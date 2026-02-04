import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { ProductRepositoryPort } from '../../../../domain/ports/out/product.repository.port';
import { ProductEntity } from '../../../../domain/entities/product.entity';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductEntity[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => new ProductEntity({
      ...p,
      imageUrl: p.imageUrl || undefined,
    }));
  }

  async findById(id: number): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    return product ? new ProductEntity({
      ...product,
      imageUrl: product.imageUrl || undefined,
    }) : null;
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
    return new ProductEntity({
      ...product,
      imageUrl: product.imageUrl || undefined,
    });
  }
}
