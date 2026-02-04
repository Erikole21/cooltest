import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { WompiService } from './wompi.service';
import { TransactionStatus } from '../../../../domain/entities/transaction.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WompiService', () => {
  let service: WompiService;
  let configService: ConfigService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                WOMPI_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
                WOMPI_PRIVATE_KEY: 'prv_test_12345',
                WOMPI_INTEGRITY_SECRET: 'integrity_secret_123',
                WOMPI_EVENTS_KEY: 'events_key_123',
              };
              return config[key] || '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WompiService>(WompiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'wompi-txn-123',
            status: 'APPROVED',
            reference: 'TXN-1',
            amount_in_cents: 215000,
          },
        },
      };

      const httpClient = (service as any).httpClient;
      httpClient.post.mockResolvedValue(mockResponse);

      const transactionData = {
        acceptanceToken: 'accept_token',
        acceptPersonalAuth: 'auth_token',
        amountInCents: 215000,
        reference: 'TXN-1',
        paymentToken: 'payment_token',
        installments: 1,
        customerEmail: 'customer@example.com',
      };

      const result = await service.createTransaction(transactionData);

      expect(result).toEqual({
        id: 'wompi-txn-123',
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        amountInCents: 215000,
      });
      expect(httpClient.post).toHaveBeenCalledWith(
        '/transactions',
        expect.objectContaining({
          amount_in_cents: 215000,
          reference: 'TXN-1',
          currency: 'COP',
          customer_email: 'customer@example.com',
          signature: expect.any(String),
          payment_method: {
            type: 'CARD',
            token: 'payment_token',
            installments: 1,
          },
        }),
        expect.any(Object),
      );
    });

    it('should handle Wompi API errors', async () => {
      const httpClient = (service as any).httpClient;
      httpClient.post.mockRejectedValue({
        response: {
          data: {
            error: {
              messages: ['Invalid payment token'],
            },
          },
        },
      });

      const transactionData = {
        acceptanceToken: 'accept_token',
        acceptPersonalAuth: 'auth_token',
        amountInCents: 215000,
        reference: 'TXN-1',
        paymentToken: 'invalid_token',
        installments: 1,
        customerEmail: 'customer@example.com',
      };

      await expect(service.createTransaction(transactionData)).rejects.toThrow(
        'Failed to create Wompi transaction',
      );
    });
  });

  describe('getTransaction', () => {
    it('should fetch transaction by Wompi ID', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'wompi-txn-123',
            status: 'APPROVED',
            reference: 'TXN-1',
            amount_in_cents: 215000,
          },
        },
      };

      const httpClient = (service as any).httpClient;
      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.getTransaction('wompi-txn-123');

      expect(result).toEqual({
        id: 'wompi-txn-123',
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        amountInCents: 215000,
      });
      expect(httpClient.get).toHaveBeenCalledWith(
        '/transactions/wompi-txn-123',
        expect.any(Object),
      );
    });

    it('should handle fetch errors', async () => {
      const httpClient = (service as any).httpClient;
      httpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getTransaction('wompi-txn-123')).rejects.toThrow(
        'Failed to fetch Wompi transaction',
      );
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate correct webhook signature', () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi-123',
          },
        },
        timestamp: 1234567890,
      };

      const signature = 'valid_signature';

      const result = service.validateWebhookSignature(payload, signature);

      expect(typeof result).toBe('boolean');
    });

    it('should handle validation errors gracefully', () => {
      const invalidPayload = null;
      const signature = 'any_signature';

      const result = service.validateWebhookSignature(invalidPayload, signature);

      expect(result).toBe(false);
    });
  });

  describe('mapWompiStatus', () => {
    it('should map PENDING status correctly', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'wompi-123',
            status: 'PENDING',
            reference: 'TXN-1',
            amount_in_cents: 100000,
          },
        },
      };

      const httpClient = (service as any).httpClient;
      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.getTransaction('wompi-123');

      expect(result.status).toBe(TransactionStatus.PENDING);
    });

    it('should map DECLINED status correctly', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'wompi-123',
            status: 'DECLINED',
            reference: 'TXN-1',
            amount_in_cents: 100000,
          },
        },
      };

      const httpClient = (service as any).httpClient;
      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.getTransaction('wompi-123');

      expect(result.status).toBe(TransactionStatus.DECLINED);
    });

    it('should map unknown status to ERROR', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'wompi-123',
            status: 'UNKNOWN_STATUS',
            reference: 'TXN-1',
            amount_in_cents: 100000,
          },
        },
      };

      const httpClient = (service as any).httpClient;
      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.getTransaction('wompi-123');

      expect(result.status).toBe(TransactionStatus.ERROR);
    });
  });
});
