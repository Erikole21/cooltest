import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutUseCase } from '../../../../application/use-cases/checkout.use-case';
import { getQueueToken } from '@nestjs/bull';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let checkoutUseCase: any;
  let pollingQueue: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: CheckoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: getQueueToken('transaction-polling'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
    checkoutUseCase = module.get<CheckoutUseCase>(CheckoutUseCase);
    pollingQueue = module.get(getQueueToken('transaction-polling'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    const mockCheckoutDto = {
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

    it('should successfully process checkout and enqueue polling job', async () => {
      const mockResult = {
        success: true,
        transactionId: 1,
        status: 'PENDING',
        total: 215000,
      };

      checkoutUseCase.execute.mockResolvedValue(mockResult);
      pollingQueue.add.mockResolvedValue({});

      const result = await controller.checkout(mockCheckoutDto);

      expect(result).toEqual({
        transactionId: 1,
        status: 'PENDING',
        total: 215000,
      });
      expect(checkoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          quantity: 2,
          installments: 1,
        }),
      );
      expect(pollingQueue.add).toHaveBeenCalledWith(
        'poll-transaction',
        { transactionId: 1, pollAttempt: 0 },
        { delay: 10000 },
      );
    });

    it('should throw HttpException when checkout fails', async () => {
      const mockResult = {
        success: false,
        error: 'Insufficient stock',
      };

      checkoutUseCase.execute.mockResolvedValue(mockResult);

      await expect(controller.checkout(mockCheckoutDto)).rejects.toThrow(HttpException);
      await expect(controller.checkout(mockCheckoutDto)).rejects.toThrow('Insufficient stock');
      expect(pollingQueue.add).not.toHaveBeenCalled();
    });

    it('should use default installments value of 1 when not provided', async () => {
      const dtoWithoutInstallments = {
        ...mockCheckoutDto,
        installments: undefined,
      };

      const mockResult = {
        success: true,
        transactionId: 1,
        status: 'PENDING',
        total: 215000,
      };

      checkoutUseCase.execute.mockResolvedValue(mockResult);
      pollingQueue.add.mockResolvedValue({});

      await controller.checkout(dtoWithoutInstallments as any);

      expect(checkoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          installments: 1,
        }),
      );
    });

    it('should throw HttpException with generic message when no error provided', async () => {
      const mockResult = {
        success: false,
      };

      checkoutUseCase.execute.mockResolvedValue(mockResult);

      await expect(controller.checkout(mockCheckoutDto)).rejects.toThrow('Checkout failed');
    });
  });
});
