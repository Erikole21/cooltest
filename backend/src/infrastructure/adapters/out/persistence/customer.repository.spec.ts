import { Test, TestingModule } from '@nestjs/testing';
import { CustomerRepository } from './customer.repository';
import { PrismaService } from '../../../config/prisma.service';
import { CustomerEntity } from '../../../../domain/entities/customer.entity';

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let prismaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerRepository,
        {
          provide: PrismaService,
          useValue: {
            customer: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<CustomerRepository>(CustomerRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createData = {
        email: 'test@example.com',
        fullName: 'Test User',
      };

      const mockCustomer = {
        id: 1,
        ...createData,
        createdAt: new Date(),
      };

      prismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await repository.create(createData);

      expect(result).toBeInstanceOf(CustomerEntity);
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test User');
      expect(prismaService.customer.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      const mockCustomer = {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: new Date(),
      };

      prismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(CustomerEntity);
      expect(result?.id).toBe(1);
      expect(prismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when customer not found', async () => {
      prismaService.customer.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });
});
