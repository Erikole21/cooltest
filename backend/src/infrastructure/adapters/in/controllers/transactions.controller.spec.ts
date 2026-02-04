import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TRANSACTION_REPOSITORY } from '../../../../domain/ports/out/transaction.repository.port';
import { TransactionEntity, TransactionStatus } from '../../../../domain/entities/transaction.entity';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const mockTransaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        wompiTxnId: 'wompi-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      transactionRepository.findById.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow(
        'Transaction with ID 999 not found',
      );
    });
  });
});
