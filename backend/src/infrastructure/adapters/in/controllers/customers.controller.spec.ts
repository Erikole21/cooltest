import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CUSTOMER_REPOSITORY } from '../../../../domain/ports/out/customer.repository.port';
import { CustomerEntity } from '../../../../domain/entities/customer.entity';

describe('CustomersController', () => {
  let controller: CustomersController;
  let customerRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = new CustomerEntity({
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: new Date(),
      });

      customerRepository.findById.mockResolvedValue(mockCustomer);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Customer with ID 999 not found');
    });
  });
});
