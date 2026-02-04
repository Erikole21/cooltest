import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PRODUCT_REPOSITORY } from '../../domain/ports/out/product.repository.port';
import type { ProductRepositoryPort } from '../../domain/ports/out/product.repository.port';
import { CUSTOMER_REPOSITORY } from '../../domain/ports/out/customer.repository.port';
import type { CustomerRepositoryPort } from '../../domain/ports/out/customer.repository.port';
import { DELIVERY_REPOSITORY } from '../../domain/ports/out/delivery.repository.port';
import type { DeliveryRepositoryPort } from '../../domain/ports/out/delivery.repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/out/transaction.repository.port';
import type { TransactionRepositoryPort } from '../../domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from '../../domain/ports/out/wompi.service.port';
import type { WompiServicePort } from '../../domain/ports/out/wompi.service.port';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

export interface CheckoutInput {
  productId: number;
  quantity: number;
  paymentToken: string;
  installments: number;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  customer: {
    email: string;
    fullName: string;
  };
  delivery: {
    address: string;
    city: string;
    phone: string;
  };
}

export interface CheckoutResult {
  success: boolean;
  transactionId?: number;
  status?: string;
  total?: number;
  error?: string;
}

@Injectable()
export class CheckoutUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(WOMPI_SERVICE)
    private readonly wompiService: WompiServicePort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: CheckoutInput): Promise<CheckoutResult> {
    try {
      // 1. Validate product and stock
      const product = await this.productRepository.findById(input.productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      if (!product.hasStock(input.quantity)) {
        return { success: false, error: 'Insufficient stock' };
      }

      // 2. Calculate fees and total
      const unitPrice = product.price;
      const baseFee = parseInt(
        this.configService.get<string>('BASE_FEE_CENTS', '0'),
      );
      const deliveryFee = parseInt(
        this.configService.get<string>('DELIVERY_FEE_CENTS', '0'),
      );
      const total = unitPrice * input.quantity + baseFee + deliveryFee;

      // 3. Create customer and delivery
      const customer = await this.customerRepository.create({
        email: input.customer.email,
        fullName: input.customer.fullName,
      });

      const delivery = await this.deliveryRepository.create({
        address: input.delivery.address,
        city: input.delivery.city,
        phone: input.delivery.phone,
      });

      // 4. Create transaction with temporary reference (Wompi requiere reference único; el id se conoce tras create)
      const tempReference = `TXN-TEMP-${Date.now()}`;
      const transaction = await this.transactionRepository.create({
        productId: input.productId,
        customerId: customer.id,
        deliveryId: delivery.id,
        quantity: input.quantity,
        unitPrice,
        baseFee,
        deliveryFee,
        total,
        reference: tempReference,
      });

      // 5. Persist reference TXN-{id} para que el webhook pueda matchear por reference
      const reference = `TXN-${transaction.id}`;
      await this.transactionRepository.updateReference(transaction.id, reference);

      // 6. Call Wompi to create transaction
      const wompiResponse = await this.wompiService.createTransaction({
        acceptanceToken: input.acceptanceToken,
        acceptPersonalAuth: input.acceptPersonalAuth,
        amountInCents: total,
        reference,
        paymentToken: input.paymentToken,
        installments: input.installments,
        customerEmail: input.customer.email,
      });

      // 7. Update transaction with Wompi ID
      await this.transactionRepository.updateStatus(
        transaction.id,
        wompiResponse.status,
        wompiResponse.id,
      );

      return {
        success: true,
        transactionId: transaction.id,
        status: wompiResponse.status,
        total,
      };
    } catch (error) {
      console.error('Checkout use case error:', error);
      return {
        success: false,
        error: error.message || 'Checkout failed',
      };
    }
  }
}
