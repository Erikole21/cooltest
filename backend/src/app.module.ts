import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './infrastructure/config/prisma.module';

// Repositories
import { ProductRepository } from './infrastructure/adapters/out/persistence/product.repository';
import { CustomerRepository } from './infrastructure/adapters/out/persistence/customer.repository';
import { DeliveryRepository } from './infrastructure/adapters/out/persistence/delivery.repository';
import { TransactionRepository } from './infrastructure/adapters/out/persistence/transaction.repository';

// Services
import { WompiService } from './infrastructure/adapters/out/http/wompi.service';

// Use Cases
import { CheckoutUseCase } from './application/use-cases/checkout.use-case';

// Processors
import { TransactionPollingProcessor } from './application/services/transaction-polling.processor';
import { ReservationExpiryScheduler } from './application/services/reservation-expiry.scheduler';

// Controllers
import { ProductsController } from './infrastructure/adapters/in/controllers/products.controller';
import { CustomersController } from './infrastructure/adapters/in/controllers/customers.controller';
import { DeliveriesController } from './infrastructure/adapters/in/controllers/deliveries.controller';
import { TransactionsController } from './infrastructure/adapters/in/controllers/transactions.controller';
import { CheckoutController } from './infrastructure/adapters/in/controllers/checkout.controller';
import { WebhooksController } from './infrastructure/adapters/in/controllers/webhooks.controller';

// Gateways
import { TransactionGateway } from './infrastructure/adapters/in/gateways/transaction.gateway';

// Ports (symbols)
import { PRODUCT_REPOSITORY } from './domain/ports/out/product.repository.port';
import { CUSTOMER_REPOSITORY } from './domain/ports/out/customer.repository.port';
import { DELIVERY_REPOSITORY } from './domain/ports/out/delivery.repository.port';
import { TRANSACTION_REPOSITORY } from './domain/ports/out/transaction.repository.port';
import { WOMPI_SERVICE } from './domain/ports/out/wompi.service.port';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            configService.get('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                }
              : undefined,
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie'],
            remove: true,
          },
          serializers: {
            req: (req) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res) => ({
              statusCode: res.statusCode,
            }),
          },
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_URL', 'localhost').replace('redis://', '').split(':')[0],
          port: parseInt(
            configService.get('REDIS_URL', 'localhost').replace('redis://', '').split(':')[1] || '6379',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'transaction-polling',
    }),
  ],
  controllers: [
    ProductsController,
    CustomersController,
    DeliveriesController,
    TransactionsController,
    CheckoutController,
    WebhooksController,
  ],
  providers: [
    // Repositories
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: CustomerRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useClass: DeliveryRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
    // Services
    {
      provide: WOMPI_SERVICE,
      useClass: WompiService,
    },
    // Use Cases
    CheckoutUseCase,
    // Processors
    TransactionPollingProcessor,
    ReservationExpiryScheduler,
    // Gateways
    TransactionGateway,
  ],
})
export class AppModule {}
