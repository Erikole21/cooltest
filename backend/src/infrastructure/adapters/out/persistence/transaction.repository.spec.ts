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
});
