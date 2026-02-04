import { Test, TestingModule } from '@nestjs/testing';
import { TransactionRepository } from './transaction.repository';
import { PrismaService } from '../../../config/prisma.service';
import { TransactionEntity, TransactionStatus } from '../../../../domain/entities/transaction.entity';
import { TransactionStatus as PrismaTransactionStatus } from '@prisma/client';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let prismaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createData = {
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        reference: 'TXN-1',
      };

      const mockTransaction = {
        id: 1,
        ...createData,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await repository.create(createData);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result.id).toBe(1);
      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          status: PrismaTransactionStatus.PENDING,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return transaction with relations', async () => {
      const mockTransaction = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 1,
          name: 'Product 1',
          description: 'Test',
          price: 100000,
          stockQuantity: 10,
          imageUrl: 'https://example.com/image.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        customer: {
          id: 1,
          email: 'test@example.com',
          fullName: 'Test User',
          createdAt: new Date(),
        },
        delivery: {
          id: 1,
          address: '123 Test St',
          city: 'Test City',
          phone: '1234567890',
          createdAt: new Date(),
        },
      };

      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result?.id).toBe(1);
      expect(result?.status).toBe(TransactionStatus.APPROVED);
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          product: true,
          customer: true,
          delivery: true,
        },
      });
    });

    it('should return null when transaction not found', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('should find transaction by reference', async () => {
      const mockTransaction = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await repository.findByReference('TXN-1');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result?.reference).toBe('TXN-1');
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { reference: 'TXN-1' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const mockTransaction = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: null,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.update.mockResolvedValue(mockTransaction);

      const result = await repository.updateStatus(1, TransactionStatus.APPROVED);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: PrismaTransactionStatus.APPROVED,
        },
      });
    });

    it('should update status with wompiTxnId', async () => {
      const mockTransaction = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.update.mockResolvedValue(mockTransaction);

      await repository.updateStatus(1, TransactionStatus.APPROVED, 'wompi-123');

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: PrismaTransactionStatus.APPROVED,
          wompiTxnId: 'wompi-123',
        },
      });
    });
  });

  describe('updateReference', () => {
    it('should update transaction reference', async () => {
      const mockTransaction = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.update.mockResolvedValue(mockTransaction);

      const result = await repository.updateReference(1, 'TXN-1');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result.reference).toBe('TXN-1');
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { reference: 'TXN-1' },
      });
    });
  });

  describe('finalizeStatus', () => {
    it('should finalize transaction to APPROVED and commit stock', async () => {
      const mockCurrentTx = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        reference: 'TXN-1',
        stockCommittedAt: null,
        stockReleasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTx = {
        ...mockCurrentTx,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: 'wompi-123',
      };

      const mockFinalTx = {
        ...mockUpdatedTx,
        stockCommittedAt: new Date(),
      };

      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockCurrentTx)
            .mockResolvedValueOnce(mockFinalTx),
          update: jest.fn()
            .mockResolvedValueOnce(mockUpdatedTx)
            .mockResolvedValueOnce(mockFinalTx),
        },
        $executeRaw: jest.fn().mockResolvedValue(1),
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      const result = await repository.finalizeStatus(1, TransactionStatus.APPROVED, 'wompi-123');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should finalize transaction to DECLINED and release stock', async () => {
      const mockCurrentTx = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        reference: 'TXN-1',
        stockCommittedAt: null,
        stockReleasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTx = {
        ...mockCurrentTx,
        status: PrismaTransactionStatus.DECLINED,
      };

      const mockFinalTx = {
        ...mockUpdatedTx,
        stockReleasedAt: new Date(),
      };

      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockCurrentTx)
            .mockResolvedValueOnce(mockFinalTx),
          update: jest.fn()
            .mockResolvedValueOnce(mockUpdatedTx)
            .mockResolvedValueOnce(mockFinalTx),
        },
        $executeRaw: jest.fn().mockResolvedValue(1),
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      const result = await repository.finalizeStatus(1, TransactionStatus.DECLINED);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result.status).toBe(TransactionStatus.DECLINED);
    });

    it('should not modify stock if transaction already in final status', async () => {
      const mockCurrentTx = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: null,
        reference: 'TXN-1',
        stockCommittedAt: new Date(),
        stockReleasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTx = {
        ...mockCurrentTx,
        wompiTxnId: 'wompi-123',
      };

      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn().mockResolvedValueOnce(mockCurrentTx),
          update: jest.fn().mockResolvedValueOnce(mockUpdatedTx),
        },
        $executeRaw: jest.fn(),
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      const result = await repository.finalizeStatus(1, TransactionStatus.APPROVED, 'wompi-123');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(mockPrismaTx.$executeRaw).not.toHaveBeenCalled();
    });

    it('should return transaction when already final and no wompiTxnId to update', async () => {
      const mockCurrentTx = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.APPROVED,
        wompiTxnId: 'wompi-123',
        reference: 'TXN-1',
        stockCommittedAt: new Date(),
        stockReleasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn().mockResolvedValueOnce(mockCurrentTx),
          update: jest.fn(),
        },
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      const result = await repository.finalizeStatus(1, TransactionStatus.APPROVED);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(mockPrismaTx.transaction.update).not.toHaveBeenCalled();
    });

    it('should throw error when transaction not found', async () => {
      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn().mockResolvedValueOnce(null),
        },
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      await expect(
        repository.finalizeStatus(999, TransactionStatus.APPROVED)
      ).rejects.toThrow('Transaction not found');
    });

    it('should use fallback stock decrement when reserved quantity is zero', async () => {
      const mockCurrentTx = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        reference: 'TXN-1',
        stockCommittedAt: null,
        stockReleasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTx = {
        ...mockCurrentTx,
        status: PrismaTransactionStatus.APPROVED,
      };

      const mockFinalTx = {
        ...mockUpdatedTx,
        stockCommittedAt: new Date(),
      };

      const mockPrismaTx = {
        transaction: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockCurrentTx)
            .mockResolvedValueOnce(mockFinalTx),
          update: jest.fn()
            .mockResolvedValueOnce(mockUpdatedTx)
            .mockResolvedValueOnce(mockFinalTx),
        },
        $executeRaw: jest.fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(1),
      };

      prismaService.$transaction = jest.fn((callback) => callback(mockPrismaTx));

      const result = await repository.finalizeStatus(1, TransactionStatus.APPROVED);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(mockPrismaTx.$executeRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe('findExpiredPendingReservations', () => {
    it('should find expired pending reservations', async () => {
      const now = new Date();
      const mockTransactions = [
        {
          id: 1,
          productId: 1,
          customerId: 1,
          deliveryId: 1,
          quantity: 2,
          unitPrice: 100000,
          baseFee: 5000,
          deliveryFee: 10000,
          total: 215000,
          status: PrismaTransactionStatus.PENDING,
          wompiTxnId: null,
          reference: 'TXN-1',
          reservedUntil: new Date(Date.now() - 10000),
          stockCommittedAt: null,
          stockReleasedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.transaction = {
        ...prismaService.transaction,
        findMany: jest.fn().mockResolvedValue(mockTransactions),
      };

      const result = await repository.findExpiredPendingReservations(now);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TransactionEntity);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          status: PrismaTransactionStatus.PENDING,
          reservedUntil: { lt: now },
          stockReleasedAt: null,
          stockCommittedAt: null,
        },
      });
    });

    it('should return empty array when no expired reservations', async () => {
      const now = new Date();

      prismaService.transaction = {
        ...prismaService.transaction,
        findMany: jest.fn().mockResolvedValue([]),
      };

      const result = await repository.findExpiredPendingReservations(now);

      expect(result).toHaveLength(0);
    });
  });

  describe('create with reservedUntil', () => {
    it('should create transaction with reservedUntil when provided', async () => {
      const reservedUntil = new Date(Date.now() + 900000);
      const createData = {
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        reference: 'TXN-1',
        reservedUntil,
      };

      const mockTransaction = {
        id: 1,
        ...createData,
        status: PrismaTransactionStatus.PENDING,
        wompiTxnId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await repository.create(createData);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          productId: createData.productId,
          customerId: createData.customerId,
          deliveryId: createData.deliveryId,
          quantity: createData.quantity,
          unitPrice: createData.unitPrice,
          baseFee: createData.baseFee,
          deliveryFee: createData.deliveryFee,
          total: createData.total,
          reference: createData.reference,
          reservedUntil,
          status: PrismaTransactionStatus.PENDING,
        },
      });
    });
  });
});
