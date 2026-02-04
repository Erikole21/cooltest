import {
  TransactionEntity,
  TransactionStatus,
} from '../../entities/transaction.entity';

export interface CreateTransactionData {
  productId: number;
  customerId: number;
  deliveryId: number;
  quantity: number;
  unitPrice: number;
  baseFee: number;
  deliveryFee: number;
  total: number;
  reference: string;
  reservedUntil?: Date;
}

export interface TransactionRepositoryPort {
  create(data: CreateTransactionData): Promise<TransactionEntity>;
  findById(id: number): Promise<TransactionEntity | null>;
  findByReference(reference: string): Promise<TransactionEntity | null>;
  updateStatus(
    id: number,
    status: TransactionStatus,
    wompiTxnId?: string,
  ): Promise<TransactionEntity>;
  updateReference(id: number, reference: string): Promise<TransactionEntity>;
  finalizeStatus(
    id: number,
    status: TransactionStatus,
    wompiTxnId?: string,
  ): Promise<TransactionEntity>;
  findExpiredPendingReservations(now: Date): Promise<TransactionEntity[]>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
