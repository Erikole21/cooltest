import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryRepository } from './delivery.repository';
import { PrismaService } from '../../../config/prisma.service';
import { DeliveryEntity } from '../../../../domain/entities/delivery.entity';

describe('DeliveryRepository', () => {
  let repository: DeliveryRepository;
  let prismaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryRepository,
        {
          provide: PrismaService,
          useValue: {
            delivery: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<DeliveryRepository>(DeliveryRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new delivery', async () => {
      const createData = {
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
      };

      const mockDelivery = {
        id: 1,
        ...createData,
        createdAt: new Date(),
      };

      prismaService.delivery.create.mockResolvedValue(mockDelivery);

      const result = await repository.create(createData);

      expect(result).toBeInstanceOf(DeliveryEntity);
      expect(result.address).toBe('123 Test St');
      expect(result.city).toBe('Test City');
      expect(result.phone).toBe('1234567890');
      expect(prismaService.delivery.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findById', () => {
    it('should return delivery when found', async () => {
      const mockDelivery = {
        id: 1,
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
        createdAt: new Date(),
      };

      prismaService.delivery.findUnique.mockResolvedValue(mockDelivery);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(DeliveryEntity);
      expect(result?.id).toBe(1);
      expect(prismaService.delivery.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when delivery not found', async () => {
      prismaService.delivery.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });
});
