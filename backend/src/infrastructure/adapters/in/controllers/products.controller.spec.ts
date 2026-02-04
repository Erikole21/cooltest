import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { PRODUCT_REPOSITORY } from '../../../../domain/ports/out/product.repository.port';
import { ProductEntity } from '../../../../domain/entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        new ProductEntity({
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 100000,
          stockQuantity: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new ProductEntity({
          id: 2,
          name: 'Product 2',
          description: 'Description 2',
          price: 200000,
          stockQuantity: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      productRepository.findAll.mockResolvedValue(mockProducts);

      const result = await controller.findAll();

      expect(result).toEqual({ products: mockProducts });
      expect(productRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      productRepository.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({ products: [] });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = new ProductEntity({
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockProduct);
      expect(productRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Product with ID 999 not found');
    });
  });
});
