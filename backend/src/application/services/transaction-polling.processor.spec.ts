import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPollingProcessor } from './transaction-polling.processor';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../domain/ports/out/wompi.service.port';
import { TransactionEntity, TransactionStatus } from '../../domain/entities/transaction.entity';
import { TransactionGateway } from '../../infrastructure/adapters/in/gateways/transaction.gateway';
import { getQueueToken } from '@nestjs/bull';

describe('TransactionPollingProcessor', () => {
  let processor: TransactionPollingProcessor;
  let transactionRepository: any;
  let wompiService: any;
  let transactionGateway: any;
  let pollingQueue: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionPollingProcessor,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            updateStatus: jest.fn(),
            finalizeStatus: jest.fn(),
          },
        },
        {
          provide: WOMPI_SERVICE,
          useValue: {
            getTransaction: jest.fn(),
          },
        },
        {
          provide: TransactionGateway,
          useValue: {
            emitTransactionUpdate: jest.fn(),
          },
        },
        {
          provide: getQueueToken('transaction-polling'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<TransactionPollingProcessor>(TransactionPollingProcessor);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    wompiService = module.get(WOMPI_SERVICE);
    transactionGateway = module.get<TransactionGateway>(TransactionGateway);
    pollingQueue = module.get(getQueueToken('transaction-polling'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePollTransaction', () => {
    const mockJob = {
      data: {
        transactionId: 1,
        pollAttempt: 0,
      },
      attemptsMade: 0,
    };

    it('should skip polling if transaction not found', async () => {
      transactionRepository.findById.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await processor.handlePollTransaction(mockJob as any);

      expect(transactionRepository.findById).toHaveBeenCalledWith(1);
      expect(consoleSpy).toHaveBeenCalledWith('Transaction 1 not found');
      consoleSpy.mockRestore();
    });

    it('should skip polling if transaction has no wompiTxnId', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await processor.handlePollTransaction(mockJob as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Transaction 1 has no Wompi ID, skipping poll',
      );
      consoleSpy.mockRestore();
    });

    it('should skip polling if transaction status is already final', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.APPROVED,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await processor.handlePollTransaction(mockJob as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Transaction 1 already in final status: APPROVED'),
      );
      consoleSpy.mockRestore();
    });

    it('should update transaction status when Wompi status changes to APPROVED', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 200000,
        status: TransactionStatus.PENDING,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockWompiResponse = {
        id: 'wompi-123',
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        amountInCents: 200000,
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      wompiService.getTransaction.mockResolvedValue(mockWompiResponse);
      transactionRepository.finalizeStatus.mockResolvedValue(mockTransaction);

      await processor.handlePollTransaction(mockJob as any);

      expect(transactionRepository.finalizeStatus).toHaveBeenCalledWith(
        1,
        TransactionStatus.APPROVED,
        'wompi-123',
      );
      expect(transactionGateway.emitTransactionUpdate).toHaveBeenCalledWith(
        1,
        TransactionStatus.APPROVED,
      );
    });

    it('should requeue job when status is still PENDING and pollAttempt < 5', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.PENDING,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockWompiResponse = {
        id: 'wompi-123',
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        amountInCents: 100000,
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      wompiService.getTransaction.mockResolvedValue(mockWompiResponse);

      await processor.handlePollTransaction(mockJob as any);

      expect(pollingQueue.add).toHaveBeenCalledWith(
        'poll-transaction',
        { transactionId: 1, pollAttempt: 1 },
        { delay: 600000 },
      );
    });

    it('should handle Wompi service errors gracefully', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.PENDING,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      wompiService.getTransaction.mockRejectedValue(new Error('Wompi API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(processor.handlePollTransaction(mockJob as any)).rejects.toThrow('Wompi API error');

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error polling transaction 1:',
        'Wompi API error',
      );
      consoleSpy.mockRestore();
    });
  });
});
