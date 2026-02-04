import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
