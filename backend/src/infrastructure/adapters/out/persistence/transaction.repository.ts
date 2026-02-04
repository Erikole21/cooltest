import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type {
  TransactionRepositoryPort,
  CreateTransactionData,
} from '../../../../domain/ports/out/transaction.repository.port';
import {
  TransactionEntity,
  TransactionStatus,
} from '../../../../domain/entities/transaction.entity';
import { TransactionStatus as PrismaTransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toPrismaStatus(status: TransactionStatus): PrismaTransactionStatus {
    return status as unknown as PrismaTransactionStatus;
  }

  private toDomainStatus(status: PrismaTransactionStatus): TransactionStatus {
    return status as unknown as TransactionStatus;
  }

  private toEntity(prismaTransaction: any): TransactionEntity {
    return new TransactionEntity({
      ...prismaTransaction,
      status: this.toDomainStatus(prismaTransaction.status),
      imageUrl: prismaTransaction.product?.imageUrl || undefined,
    });
  }

  async create(data: CreateTransactionData): Promise<TransactionEntity> {
    const transaction = await this.prisma.transaction.create({
      data: {
        productId: data.productId,
        customerId: data.customerId,
        deliveryId: data.deliveryId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        baseFee: data.baseFee,
        deliveryFee: data.deliveryFee,
        total: data.total,
        reference: data.reference,
        status: PrismaTransactionStatus.PENDING,
      },
    });
    return this.toEntity(transaction);
  }

  async findById(id: number): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        delivery: true,
      },
    });
    return transaction ? this.toEntity(transaction) : null;
  }

  async findByReference(reference: string): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    return transaction ? this.toEntity(transaction) : null;
  }

  async updateStatus(
    id: number,
    status: TransactionStatus,
    wompiTxnId?: string,
  ): Promise<TransactionEntity> {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: this.toPrismaStatus(status),
        ...(wompiTxnId && { wompiTxnId }),
      },
    });
    return this.toEntity(transaction);
  }

  async updateReference(id: number, reference: string): Promise<TransactionEntity> {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: { reference },
    });
    return this.toEntity(transaction);
  }
}
