import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CheckoutUseCase } from './checkout.use-case';
import { PRODUCT_REPOSITORY } from '../../domain/ports/out/product.repository.port';
import { CUSTOMER_REPOSITORY } from '../../domain/ports/out/customer.repository.port';
import { DELIVERY_REPOSITORY } from '../../domain/ports/out/delivery.repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../domain/ports/out/wompi.service.port';
import { ProductEntity } from '../../domain/entities/product.entity';
import { CustomerEntity } from '../../domain/entities/customer.entity';
import { DeliveryEntity } from '../../domain/entities/delivery.entity';
import { TransactionEntity, TransactionStatus } from '../../domain/entities/transaction.entity';

describe('CheckoutUseCase', () => {
  let useCase: CheckoutUseCase;
  let productRepository: any;
  let customerRepository: any;
  let deliveryRepository: any;
  let transactionRepository: any;
  let wompiService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DELIVERY_REPOSITORY,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: {
            create: jest.fn(),
            updateReference: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: WOMPI_SERVICE,
          useValue: {
            createTransaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'BASE_FEE_CENTS') return '5000';
              if (key === 'DELIVERY_FEE_CENTS') return '10000';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckoutUseCase>(CheckoutUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
    deliveryRepository = module.get(DELIVERY_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    wompiService = module.get(WOMPI_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockInput = {
      productId: 1,
      quantity: 2,
      paymentToken: 'tok_test_12345',
      installments: 1,
      acceptanceToken: 'accept_test',
      acceptPersonalAuth: 'auth_test',
      customer: {
        email: 'test@example.com',
        fullName: 'Test User',
      },
      delivery: {
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
      },
    };

    it('should successfully process checkout', async () => {
      const mockProduct = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockCustomer = new CustomerEntity({
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: new Date(),
      });

      const mockDelivery = new DeliveryEntity({
        id: 1,
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
        createdAt: new Date(),
      });

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
        status: TransactionStatus.PENDING,
        reference: 'TXN-TEMP-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockWompiResponse = {
        id: 'wompi-123',
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        amountInCents: 215000,
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      customerRepository.create.mockResolvedValue(mockCustomer);
      deliveryRepository.create.mockResolvedValue(mockDelivery);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      wompiService.createTransaction.mockResolvedValue(mockWompiResponse);

      const result = await useCase.execute(mockInput);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(1);
      expect(result.total).toBe(215000);
      expect(productRepository.findById).toHaveBeenCalledWith(1);
      expect(customerRepository.create).toHaveBeenCalled();
      expect(deliveryRepository.create).toHaveBeenCalled();
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(wompiService.createTransaction).toHaveBeenCalled();
    });

    it('should return error when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
      expect(customerRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when insufficient stock', async () => {
      const mockProduct = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await useCase.execute(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock');
      expect(customerRepository.create).not.toHaveBeenCalled();
    });

    it('should handle Wompi service errors', async () => {
      const mockProduct = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockCustomer = new CustomerEntity({
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: new Date(),
      });

      const mockDelivery = new DeliveryEntity({
        id: 1,
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
        createdAt: new Date(),
      });

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
        status: TransactionStatus.PENDING,
        reference: 'TXN-TEMP-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productRepository.findById.mockResolvedValue(mockProduct);
      customerRepository.create.mockResolvedValue(mockCustomer);
      deliveryRepository.create.mockResolvedValue(mockDelivery);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      wompiService.createTransaction.mockRejectedValue(new Error('Wompi error'));

      const result = await useCase.execute(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wompi error');
    });

    it('should calculate total correctly with fees', async () => {
      const mockProduct = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productRepository.findById.mockResolvedValue(mockProduct);
      customerRepository.create.mockResolvedValue({ id: 1 });
      deliveryRepository.create.mockResolvedValue({ id: 1 });
      transactionRepository.create.mockResolvedValue({ id: 1, reference: 'TXN-1' });
      wompiService.createTransaction.mockResolvedValue({
        id: 'wompi-123',
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        amountInCents: 215000,
      });

      const result = await useCase.execute(mockInput);

      expect(result.total).toBe(215000); // (100000 * 2) + 5000 + 10000
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitPrice: 100000,
          quantity: 2,
          baseFee: 5000,
          deliveryFee: 10000,
          total: 215000,
        }),
      );
    });
  });
});
