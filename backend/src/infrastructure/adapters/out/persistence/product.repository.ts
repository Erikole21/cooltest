import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { ProductRepositoryPort } from '../../../../domain/ports/out/product.repository.port';
import { ProductEntity } from '../../../../domain/entities/product.entity';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(p: any): ProductEntity {
    return new ProductEntity({
      ...p,
      imageUrl: p.imageUrl || undefined,
    });
  }

  async findAll(): Promise<ProductEntity[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.toEntity(p));
  }

  async findById(id: number): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    return product ? this.toEntity(product) : null;
  }

  async updateStock(id: number, quantity: number): Promise<ProductEntity> {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
      },
    });
    return this.toEntity(product);
  }

  async reserveStock(id: number, quantity: number): Promise<boolean> {
    const updated = await this.prisma.$executeRaw`
      UPDATE "products"
      SET "reserved_quantity" = "reserved_quantity" + ${quantity}
      WHERE "id" = ${id}
        AND ("stock_quantity" - "reserved_quantity") >= ${quantity}
    `;
    return Number(updated) > 0;
  }

  async releaseReservedStock(id: number, quantity: number): Promise<boolean> {
    const updated = await this.prisma.$executeRaw`
      UPDATE "products"
      SET "reserved_quantity" = "reserved_quantity" - ${quantity}
      WHERE "id" = ${id}
        AND "reserved_quantity" >= ${quantity}
    `;
    return Number(updated) > 0;
  }

  async commitReservedStock(id: number, quantity: number): Promise<boolean> {
    const updated = await this.prisma.$executeRaw`
      UPDATE "products"
      SET "stock_quantity" = "stock_quantity" - ${quantity},
          "reserved_quantity" = "reserved_quantity" - ${quantity}
      WHERE "id" = ${id}
        AND "reserved_quantity" >= ${quantity}
        AND "stock_quantity" >= ${quantity}
    `;
    return Number(updated) > 0;
  }
}
