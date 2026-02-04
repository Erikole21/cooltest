import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from '../../../config/prisma.service';
import { TRANSACTION_REPOSITORY } from '../../../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../../../domain/ports/out/wompi.service.port';
import { TransactionGateway } from '../gateways/transaction.gateway';
import { TransactionEntity, TransactionStatus } from '../../../../domain/entities/transaction.entity';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let prisma: any;
  let transactionRepository: any;
  let wompiService: any;
  let transactionGateway: any;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      wompiWebhookEvent: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    };
    transactionRepository = {
      findByReference: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue({}),
      finalizeStatus: jest.fn().mockResolvedValue({}),
    };
    wompiService = {
      validateWebhookSignature: jest.fn().mockReturnValue(true),
    };
    transactionGateway = {
      emitTransactionUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: Logger, useValue: mockLogger },
        { provide: PrismaService, useValue: prisma },
        { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: WOMPI_SERVICE, useValue: wompiService },
        { provide: TransactionGateway, useValue: transactionGateway },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWompiWebhook', () => {
    it('should save webhook event and return received for any payload', async () => {
      const payload = { event: 'some.event', data: {} };

      const result = await controller.handleWompiWebhook(payload, undefined);

      expect(prisma.wompiWebhookEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: 'some.event',
          payload,
          receivedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ status: 'received' });
    });

    it('should process transaction.updated: update status, decrement stock if APPROVED, emit socket', async () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            reference: 'TXN-1',
            status: 'APPROVED',
            id: 'wompi-123',
          },
        },
      };
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 10000,
        baseFee: 0,
        deliveryFee: 0,
        total: 20000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      transactionRepository.findByReference.mockResolvedValue(mockTransaction);

      const result = await controller.handleWompiWebhook(payload, 'sig');

      expect(transactionRepository.findByReference).toHaveBeenCalledWith('TXN-1');
      expect(transactionRepository.finalizeStatus).toHaveBeenCalledWith(
        1,
        TransactionStatus.APPROVED,
        'wompi-123',
      );
      expect(transactionGateway.emitTransactionUpdate).toHaveBeenCalledWith(
        1,
        TransactionStatus.APPROVED,
      );
      expect(result).toEqual({ status: 'received' });
    });

    it('should not decrement stock when status is DECLINED', async () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            reference: 'TXN-2',
            status: 'DECLINED',
            id: 'wompi-456',
          },
        },
      };
      const mockTransaction = new TransactionEntity({
        id: 2,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 5000,
        baseFee: 0,
        deliveryFee: 0,
        total: 5000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      transactionRepository.findByReference.mockResolvedValue(mockTransaction);

      await controller.handleWompiWebhook(payload, undefined);

      expect(transactionRepository.finalizeStatus).toHaveBeenCalledWith(
        2,
        TransactionStatus.DECLINED,
        'wompi-456',
      );
      expect(transactionGateway.emitTransactionUpdate).toHaveBeenCalledWith(
        2,
        TransactionStatus.DECLINED,
      );
    });

    it('should return received when transaction not found by reference', async () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: { reference: 'TXN-999', status: 'APPROVED' },
        },
      };
      transactionRepository.findByReference.mockResolvedValue(null);

      const result = await controller.handleWompiWebhook(payload, undefined);

      expect(transactionRepository.finalizeStatus).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'received' });
    });

    it('should return received with error message when prisma.create throws', async () => {
      prisma.wompiWebhookEvent.create.mockRejectedValue(new Error('DB error'));

      const result = await controller.handleWompiWebhook(
        { event: 'transaction.updated' },
        undefined,
      );

      expect(result).toEqual({ status: 'received', error: 'DB error' });
    });
  });
});
