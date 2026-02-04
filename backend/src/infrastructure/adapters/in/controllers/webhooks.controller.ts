import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../../../config/prisma.service';
import { TRANSACTION_REPOSITORY } from '../../../../domain/ports/out/transaction.repository.port';
import type { TransactionRepositoryPort } from '../../../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../../../domain/ports/out/wompi.service.port';
import type { WompiServicePort } from '../../../../domain/ports/out/wompi.service.port';
import { TransactionStatus } from '../../../../domain/entities/transaction.entity';
import { TransactionGateway } from '../gateways/transaction.gateway';

@Controller('webhooks')
@SkipThrottle() // Webhooks should not be rate limited
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(WOMPI_SERVICE)
    private readonly wompiService: WompiServicePort,
    private readonly transactionGateway: TransactionGateway,
    private readonly logger: Logger,
  ) {}


  @Post('wompi')
  @HttpCode(200)
  async handleWompiWebhook(
    @Body() payload: any,
    @Headers('x-event-checksum') signature: string,
  ) {
    this.logger.log(`📨 Received Wompi webhook: ${payload.event}`);

    try {
      // 1. Always save the webhook event for audit
      await this.prisma.wompiWebhookEvent.create({
        data: {
          eventType: payload.event,
          payload: payload,
          receivedAt: new Date(),
        },
      });

      // 2. Validate signature (REQUIRED in production)
      if (!signature) {
        this.logger.warn('⚠️ Webhook received without signature');
        throw new UnauthorizedException('Missing webhook signature');
      }

      const isValid = this.wompiService.validateWebhookSignature(
        payload,
        signature,
      );

      if (!isValid) {
        this.logger.warn('⚠️ Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // 3. Process transaction.updated event
      if (payload.event === 'transaction.updated') {
        const reference = payload.data?.transaction?.reference;
        const status = payload.data?.transaction?.status;
        const wompiTxnId = payload.data?.transaction?.id;

        if (reference && status) {
          // Find our transaction by reference
          const transaction =
            await this.transactionRepository.findByReference(reference);

          if (transaction) {
            // Map Wompi status to our TransactionStatus
            const statusMap: Record<string, TransactionStatus> = {
              PENDING: TransactionStatus.PENDING,
              APPROVED: TransactionStatus.APPROVED,
              DECLINED: TransactionStatus.DECLINED,
              ERROR: TransactionStatus.ERROR,
              VOIDED: TransactionStatus.VOIDED,
            };

            const mappedStatus = statusMap[status] || TransactionStatus.ERROR;

            // Update transaction if status is final
            if (
              [
                TransactionStatus.APPROVED,
                TransactionStatus.DECLINED,
                TransactionStatus.ERROR,
                TransactionStatus.VOIDED,
              ].includes(mappedStatus)
            ) {
              await this.transactionRepository.finalizeStatus(
                transaction.id,
                mappedStatus,
                wompiTxnId,
              );

              this.logger.log(
                `✅ Transaction ${transaction.id} updated to ${mappedStatus} via webhook`,
              );

              this.transactionGateway.emitTransactionUpdate(
                transaction.id,
                mappedStatus,
              );
            }
          } else {
            this.logger.warn(`⚠️ Transaction not found for reference: ${reference}`);
          }
        }
      }

      return { status: 'received' };
    } catch (error) {
      this.logger.error('❌ Error processing webhook:', error);
      // Still return 200 to prevent Wompi retries for processing errors
      return { status: 'received', error: error.message };
    }
  }
}
