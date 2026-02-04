import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/out/transaction.repository.port';
import type { TransactionRepositoryPort } from '../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../domain/ports/out/wompi.service.port';
import type { WompiServicePort } from '../../domain/ports/out/wompi.service.port';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { TransactionGateway } from '../../infrastructure/adapters/in/gateways/transaction.gateway';

@Processor('transaction-polling')
export class TransactionPollingProcessor {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(WOMPI_SERVICE)
    private readonly wompiService: WompiServicePort,
    private readonly transactionGateway: TransactionGateway,
    @InjectQueue('transaction-polling') private readonly pollingQueue: Queue,
  ) {}

  @Process('poll-transaction')
  async handlePollTransaction(job: Job) {
    const { transactionId } = job.data;

    console.log(
      `🔄 Polling transaction ${transactionId} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      // 1. Load our transaction
      const transaction =
        await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        console.error(`Transaction ${transactionId} not found`);
        return;
      }

      // 2. If already final, skip
      if (transaction.isFinal()) {
        console.log(
          `✅ Transaction ${transactionId} already in final status: ${transaction.status}`,
        );
        return;
      }

      // 3. If still PENDING, call Wompi
      if (!transaction.wompiTxnId) {
        console.log(
          `⚠️ Transaction ${transactionId} has no Wompi ID, skipping poll`,
        );
        return;
      }

      const wompiResponse = await this.wompiService.getTransaction(
        transaction.wompiTxnId,
      );

      console.log(
        `📊 Wompi status for transaction ${transactionId}: ${wompiResponse.status}`,
      );

      // 4. If Wompi has a final status, update our transaction
      if (
        [
          TransactionStatus.APPROVED,
          TransactionStatus.DECLINED,
          TransactionStatus.ERROR,
          TransactionStatus.VOIDED,
        ].includes(wompiResponse.status)
      ) {
        await this.transactionRepository.finalizeStatus(
          transactionId,
          wompiResponse.status,
          wompiResponse.id,
        );

        console.log(
          `✅ Transaction ${transactionId} updated to status: ${wompiResponse.status}`,
        );

        this.transactionGateway.emitTransactionUpdate(
          transactionId,
          wompiResponse.status,
        );
      } else {
        const pollAttempt = (job.data.pollAttempt as number) ?? 0;
        if (pollAttempt < 5) {
          await this.pollingQueue.add(
            'poll-transaction',
            { transactionId, pollAttempt: pollAttempt + 1 },
            { delay: 600000 },
          );
          console.log(
            `⏳ Transaction ${transactionId} still PENDING in Wompi, re-scheduled in 10 min (attempt ${pollAttempt + 2}/6)`,
          );
        } else {
          console.log(
            `⏳ Transaction ${transactionId} still PENDING after max polling attempts`,
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Error polling transaction ${transactionId}:`,
        error.message,
      );
      throw error; // Let Bull retry
    }
  }

  @Process('expire-reservations')
  async handleExpireReservations() {
    const now = new Date();
    const expired = await this.transactionRepository.findExpiredPendingReservations(
      now,
    );
    if (expired.length === 0) return;

    console.log(`🧹 Expiring ${expired.length} reservation(s)`);

    for (const txn of expired) {
      try {
        await this.transactionRepository.finalizeStatus(
          txn.id,
          TransactionStatus.VOIDED,
        );
        this.transactionGateway.emitTransactionUpdate(txn.id, TransactionStatus.VOIDED);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`❌ Failed to expire reservation for txn ${txn.id}:`, msg);
      }
    }
  }
}
