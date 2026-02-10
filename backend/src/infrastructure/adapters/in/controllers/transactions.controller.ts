import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { TRANSACTION_REPOSITORY } from '../../../../domain/ports/out/transaction.repository.port';
import type { TransactionRepositoryPort } from '../../../../domain/ports/out/transaction.repository.port';
import type { TransactionEntity } from '../../../../domain/entities/transaction.entity';

function formatTransaction(t: TransactionEntity) {
  return {
    id: t.id,
    reference: t.reference,
    status: t.status,
    quantity: t.quantity,
    unitPrice: t.unitPrice,
    baseFee: t.baseFee,
    deliveryFee: t.deliveryFee,
    vatFee: t.vatFee,
    total: t.total,
    wompiTxnId: t.wompiTxnId ?? null,
    reservedUntil: t.reservedUntil ?? null,
    stockCommittedAt: t.stockCommittedAt ?? null,
    stockReleasedAt: t.stockReleasedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  @Get()
  async findAll() {
    const transactions = await this.transactionRepository.findAll();
    return {
      count: transactions.length,
      transactions: transactions.map(formatTransaction),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return formatTransaction(transaction);
  }
}
