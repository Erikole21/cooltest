import { TransactionStatus } from '../../entities/transaction.entity';

export interface CreateWompiTransactionData {
  acceptanceToken: string;
  acceptPersonalAuth: string;
  amountInCents: number;
  reference: string;
  paymentToken: string;
  installments: number;
  customerEmail: string;
}

export interface WompiTransactionResponse {
  id: string;
  status: TransactionStatus;
  reference: string;
  amountInCents: number;
}

export interface WompiServicePort {
  createTransaction(
    data: CreateWompiTransactionData,
  ): Promise<WompiTransactionResponse>;
  getTransaction(wompiTxnId: string): Promise<WompiTransactionResponse>;
  validateWebhookSignature(payload: any, signature: string): boolean;
}

export const WOMPI_SERVICE = Symbol('WOMPI_SERVICE');
