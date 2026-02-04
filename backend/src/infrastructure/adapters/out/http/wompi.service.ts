import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as crypto from 'crypto';
import type {
  WompiServicePort,
  CreateWompiTransactionData,
  WompiTransactionResponse,
} from '../../../../domain/ports/out/wompi.service.port';
import { TransactionStatus } from '../../../../domain/entities/transaction.entity';

@Injectable()
export class WompiService implements WompiServicePort {
  private readonly httpClient: AxiosInstance;
  private readonly privateKey: string;
  private readonly integritySecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    const apiUrl = this.configService.get<string>('WOMPI_API_URL', 'https://api-sandbox.co.uat.wompi.dev/v1');
    this.privateKey = (this.configService.get<string>('WOMPI_PRIVATE_KEY', '') || '').trim();
    this.integritySecret = (this.configService.get<string>('WOMPI_INTEGRITY_SECRET', '') || '').trim();

    this.httpClient = axios.create({
      baseURL: apiUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure retry logic
    axiosRetry(this.httpClient, {
      retries: 3, // Retry up to 3 times
      retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
      retryCondition: (error) => {
        // Retry on network errors or 5xx errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500 ||
          error.response?.status === 429 // Rate limit
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn({
          retryCount,
          url: requestConfig.url,
          method: requestConfig.method,
          error: error.message,
        }, 'Retrying Wompi API request');
      },
    });
  }

  async createTransaction(
    data: CreateWompiTransactionData,
  ): Promise<WompiTransactionResponse> {
    // Generate signature for integrity
    const signature = this.generateSignature(
      data.reference,
      data.amountInCents,
      'COP',
    );

    const payload = {
      acceptance_token: data.acceptanceToken,
      accept_personal_auth: data.acceptPersonalAuth,
      amount_in_cents: data.amountInCents,
      currency: 'COP',
      signature, // Wompi espera string (checksum), no objeto
      customer_email: data.customerEmail,
      reference: data.reference,
      payment_method: {
        type: 'CARD',
        token: data.paymentToken,
        installments: data.installments,
      },
    };

    try {
      const response = await this.httpClient.post('/transactions', payload, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      });

      return {
        id: response.data.data.id,
        status: this.mapWompiStatus(response.data.data.status),
        reference: response.data.data.reference,
        amountInCents: response.data.data.amount_in_cents,
      };
    } catch (error: unknown) {
      const errorData = (error as { response?: { data?: unknown } })?.response?.data;
      this.logger.error(
        { error: errorData, reference: data.reference },
        'Error creating Wompi transaction',
      );
      const messages = (error as { response?: { data?: { error?: { messages?: unknown } } } })?.response?.data?.error?.messages;
      const messageStr = Array.isArray(messages)
        ? messages.join(', ')
        : typeof messages === 'string'
          ? messages
          : messages != null
            ? JSON.stringify(messages)
            : (error as Error)?.message ?? 'Unknown error';
      throw new Error(`Failed to create Wompi transaction: ${messageStr}`);
    }
  }

  async getTransaction(wompiTxnId: string): Promise<WompiTransactionResponse> {
    try {
      const response = await this.httpClient.get(
        `/transactions/${wompiTxnId}`,
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        },
      );

      return {
        id: response.data.data.id,
        status: this.mapWompiStatus(response.data.data.status),
        reference: response.data.data.reference,
        amountInCents: response.data.data.amount_in_cents,
      };
    } catch (error) {
      this.logger.error(
        {
          error: (error as { response?: { data?: unknown } })?.response?.data,
          wompiTxnId,
        },
        'Error fetching Wompi transaction',
      );
      throw new Error(
        `Failed to fetch Wompi transaction: ${(error as Error).message}`,
      );
    }
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      // Wompi sends the signature in the header X-Event-Checksum
      // We need to validate it using the events secret
      const eventsSecret = this.configService.get<string>('WOMPI_EVENTS_KEY', '');

      // Concatenate: event_id.event_type.timestamp
      const concatenated = `${payload.event}.${payload.data.transaction.id}.${payload.timestamp}`;

      const calculatedSignature = crypto
        .createHmac('sha256', eventsSecret)
        .update(concatenated)
        .digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Error validating webhook signature',
      );
      return false;
    }
  }

  private generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    // Signature format: reference + amount_in_cents + currency + integrity_secret
    const concatenated = `${reference}${amountInCents}${currency}${this.integritySecret}`;

    return crypto.createHash('sha256').update(concatenated).digest('hex');
  }

  private mapWompiStatus(wompiStatus: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      PENDING: TransactionStatus.PENDING,
      APPROVED: TransactionStatus.APPROVED,
      DECLINED: TransactionStatus.DECLINED,
      ERROR: TransactionStatus.ERROR,
      VOIDED: TransactionStatus.VOIDED,
    };

    return statusMap[wompiStatus] || TransactionStatus.ERROR;
  }
}
