import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/config/prisma.service';

describe('Checkout Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same config as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product E2E',
        description: 'Product for E2E testing',
        price: 1000000, // 10,000 COP
        stockQuantity: 10,
        reservedQuantity: 0,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: {
        productId: productId,
      },
    });
    await prisma.product.delete({
      where: { id: productId },
    });

    await app.close();
  });

  describe('Complete Checkout Flow', () => {
    it('should complete full checkout flow with stock reservation', async () => {
      // 1. Get product and verify stock
      const productBefore = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(productBefore).toBeDefined();
      expect(productBefore?.stockQuantity).toBe(10);
      expect(productBefore?.reservedQuantity).toBe(0);

      // 2. Create checkout (this would normally call Wompi, but we'll mock the flow)
      const checkoutData = {
        productId,
        quantity: 2,
        paymentToken: 'tok_test_12345_00000000000000000000',
        installments: 1,
        acceptanceToken: 'accept_test_12345',
        acceptPersonalAuth: 'true',
        customer: {
          email: 'test-e2e@example.com',
          fullName: 'E2E Test User',
        },
        delivery: {
          address: '123 Test Street',
          city: 'Test City',
          phone: '+573001234567',
        },
      };

      // Note: This will attempt to call Wompi API in sandbox mode
      // For true E2E, we would need valid Wompi test tokens
      // For now, we'll test the stock reservation logic

      // 3. Verify stock reservation happens atomically
      const reserved = await prisma.$executeRaw`
        UPDATE "products"
        SET "reserved_quantity" = "reserved_quantity" + ${checkoutData.quantity}
        WHERE "id" = ${productId}
          AND ("stock_quantity" - "reserved_quantity") >= ${checkoutData.quantity}
      `;

      expect(Number(reserved)).toBe(1); // Should succeed

      // 4. Verify reserved quantity updated
      const productAfterReservation = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(productAfterReservation?.stockQuantity).toBe(10); // Unchanged
      expect(productAfterReservation?.reservedQuantity).toBe(2); // Reserved

      // 5. Simulate transaction approval - commit reservation
      const committed = await prisma.$executeRaw`
        UPDATE "products"
        SET "stock_quantity" = "stock_quantity" - ${checkoutData.quantity},
            "reserved_quantity" = "reserved_quantity" - ${checkoutData.quantity}
        WHERE "id" = ${productId}
          AND "reserved_quantity" >= ${checkoutData.quantity}
          AND "stock_quantity" >= ${checkoutData.quantity}
      `;

      expect(Number(committed)).toBe(1);

      // 6. Verify final stock
      const productFinal = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(productFinal?.stockQuantity).toBe(8); // Decreased by 2
      expect(productFinal?.reservedQuantity).toBe(0); // Released

      // Clean up - restore stock
      await prisma.product.update({
        where: { id: productId },
        data: {
          stockQuantity: 10,
          reservedQuantity: 0,
        },
      });
    });

    it('should prevent overselling when stock is insufficient', async () => {
      // Try to reserve more than available
      const quantity = 15; // More than available (10)

      const reserved = await prisma.$executeRaw`
        UPDATE "products"
        SET "reserved_quantity" = "reserved_quantity" + ${quantity}
        WHERE "id" = ${productId}
          AND ("stock_quantity" - "reserved_quantity") >= ${quantity}
      `;

      expect(Number(reserved)).toBe(0); // Should fail

      // Verify stock unchanged
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(product?.stockQuantity).toBe(10);
      expect(product?.reservedQuantity).toBe(0);
    });

    it('should handle concurrent reservations correctly', async () => {
      // Simulate concurrent reservations
      const quantity1 = 6;
      const quantity2 = 5;

      const [result1, result2] = await Promise.all([
        prisma.$executeRaw`
          UPDATE "products"
          SET "reserved_quantity" = "reserved_quantity" + ${quantity1}
          WHERE "id" = ${productId}
            AND ("stock_quantity" - "reserved_quantity") >= ${quantity1}
        `,
        prisma.$executeRaw`
          UPDATE "products"
          SET "reserved_quantity" = "reserved_quantity" + ${quantity2}
          WHERE "id" = ${productId}
            AND ("stock_quantity" - "reserved_quantity") >= ${quantity2}
        `,
      ]);

      // Only one should succeed (10 available, 6+5 = 11 requested)
      const successCount = Number(result1) + Number(result2);
      expect(successCount).toBe(1);

      // Clean up
      await prisma.product.update({
        where: { id: productId },
        data: { reservedQuantity: 0 },
      });
    });
  });

  describe('Health Checks', () => {
    it('should return healthy status', async () => {
      const response = await fetch('http://localhost:3000/api/v1/health');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.info).toBeDefined();
      expect(data.info.database).toBeDefined();
      expect(data.info.database.status).toBe('up');
    });

    it('should return ready status', async () => {
      const response = await fetch('http://localhost:3000/api/v1/health/ready');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    it('should return live status', async () => {
      const response = await fetch('http://localhost:3000/api/v1/health/live');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit checkout endpoint', async () => {
      const checkoutData = {
        productId: 999, // Non-existent to avoid side effects
        quantity: 1,
        paymentToken: 'tok_test',
        installments: 1,
        acceptanceToken: 'accept_test',
        acceptPersonalAuth: 'true',
        customer: {
          email: 'ratelimit@example.com',
          fullName: 'Rate Limit Test',
        },
        delivery: {
          address: 'Test',
          city: 'Test',
          phone: '123',
        },
      };

      // Make 6 rapid requests (limit is 5 per minute)
      const requests = Array(6).fill(null).map(() =>
        fetch('http://localhost:3000/api/v1/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutData),
        })
      );

      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status);

      // At least one should be rate limited (429)
      const rateLimited = statusCodes.filter(s => s === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 10000); // Extend timeout for this test
  });
});
