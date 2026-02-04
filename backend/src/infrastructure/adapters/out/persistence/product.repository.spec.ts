import { Test, TestingModule } from '@nestjs/testing';
import { ProductRepository } from './product.repository';
import { PrismaService } from '../../../config/prisma.service';
import { ProductEntity } from '../../../../domain/entities/product.entity';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let prismaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products ordered by createdAt desc', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 100000,
          stockQuantity: 10,
          imageUrl: 'https://example.com/image1.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Product 2',
          description: 'Description 2',
          price: 200000,
          stockQuantity: 5,
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProductEntity);
      expect(result[0].id).toBe(1);
      expect(result[1].imageUrl).toBeUndefined();
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 100000,
        stockQuantity: 10,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(ProductEntity);
      expect(result?.id).toBe(1);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when product not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle null imageUrl correctly', async () => {
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 100000,
        stockQuantity: 10,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repository.findById(1);

      expect(result?.imageUrl).toBeUndefined();
    });
  });

  describe('updateStock', () => {
    it('should decrement stock quantity', async () => {
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 100000,
        stockQuantity: 7,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.product.update.mockResolvedValue(mockProduct);

      const result = await repository.updateStock(1, 3);

      expect(result).toBeInstanceOf(ProductEntity);
      expect(result.stockQuantity).toBe(7);
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stockQuantity: {
            decrement: 3,
          },
        },
      });
    });
  });
});
