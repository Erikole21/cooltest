import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CheckoutDto } from './dtos/checkout.dto';
import { CheckoutUseCase } from '../../../../application/use-cases/checkout.use-case';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutUseCase: CheckoutUseCase,
    @InjectQueue('transaction-polling') private readonly pollingQueue: Queue,
  ) {}

  @Post()
  async checkout(@Body() dto: CheckoutDto) {
    const result = await this.checkoutUseCase.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      paymentToken: dto.paymentToken,
      installments: dto.installments || 1,
      acceptanceToken: dto.acceptanceToken,
      acceptPersonalAuth: dto.acceptPersonalAuth,
      customer: dto.customer,
      delivery: dto.delivery,
    });

    if (!result.success) {
      const message =
        result.error || 'No se pudo procesar el pago. Intenta nuevamente.';

      switch (result.code) {
        case 'PRODUCT_NOT_FOUND':
          throw new HttpException(message, HttpStatus.NOT_FOUND);
        case 'INSUFFICIENT_STOCK':
          throw new HttpException(message, HttpStatus.CONFLICT);
        default:
          throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
    }

    // Enqueue Bull job: first run at 10s; processor re-adds up to 5 more times every 10 min when PENDING
    await this.pollingQueue.add(
      'poll-transaction',
      { transactionId: result.transactionId, pollAttempt: 0 },
      { delay: 10000 },
    );

    return {
      transactionId: result.transactionId,
      status: result.status,
      total: result.total,
    };
  }
}
