export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export class TransactionEntity {
  id: number;
  productId: number;
  customerId: number;
  deliveryId: number;
  quantity: number;
  unitPrice: number;
  baseFee: number;
  deliveryFee: number;
  total: number;
  status: TransactionStatus;
  wompiTxnId?: string;
  reference: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TransactionEntity>) {
    Object.assign(this, partial);
  }

  isFinal(): boolean {
    return [
      TransactionStatus.APPROVED,
      TransactionStatus.DECLINED,
      TransactionStatus.ERROR,
      TransactionStatus.VOIDED,
    ].includes(this.status);
  }

  isApproved(): boolean {
    return this.status === TransactionStatus.APPROVED;
  }
}
