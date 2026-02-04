import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DELIVERY_REPOSITORY } from '../../../../domain/ports/out/delivery.repository.port';
import { DeliveryEntity } from '../../../../domain/entities/delivery.entity';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let deliveryRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [
        {
          provide: DELIVERY_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DeliveriesController>(DeliveriesController);
    deliveryRepository = module.get(DELIVERY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a delivery by id', async () => {
      const mockDelivery = new DeliveryEntity({
        id: 1,
        address: '123 Test St',
        city: 'Test City',
        phone: '1234567890',
        createdAt: new Date(),
      });

      deliveryRepository.findById.mockResolvedValue(mockDelivery);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockDelivery);
      expect(deliveryRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when delivery does not exist', async () => {
      deliveryRepository.findById.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Delivery with ID 999 not found');
    });
  });
});
