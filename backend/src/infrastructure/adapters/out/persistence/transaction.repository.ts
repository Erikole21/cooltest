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
        vatFee: data.vatFee,
        total: data.total,
        reference: data.reference,
        ...(data.reservedUntil && { reservedUntil: data.reservedUntil }),
        status: PrismaTransactionStatus.PENDING,
      },
    });
    return this.toEntity(transaction);
  }

  async findAll(): Promise<TransactionEntity[]> {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        product: true,
        customer: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return transactions.map((t) => this.toEntity(t));
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

  async finalizeStatus(
    id: number,
    status: TransactionStatus,
    wompiTxnId?: string,
  ): Promise<TransactionEntity> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findUnique({ where: { id } });
      if (!current) throw new Error('Transaction not found');

      const currentStatus = this.toDomainStatus(current.status);
      const isCurrentFinal = [
        TransactionStatus.APPROVED,
        TransactionStatus.DECLINED,
        TransactionStatus.ERROR,
        TransactionStatus.VOIDED,
      ].includes(currentStatus);

      // If already final, don't touch stock twice; still ensure wompiTxnId is set if provided.
      if (isCurrentFinal) {
        if (wompiTxnId && !current.wompiTxnId) {
          const updated = await tx.transaction.update({
            where: { id },
            data: { wompiTxnId },
          });
          return this.toEntity(updated);
        }
        return this.toEntity(current);
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          status: this.toPrismaStatus(status),
          ...(wompiTxnId && { wompiTxnId }),
        },
      });

      if (status === TransactionStatus.APPROVED) {
        // Commit reservation -> decrement stock + reserved (idempotent per stockCommittedAt)
        if (!updated.stockCommittedAt) {
          const ok = await tx.$executeRaw`
            UPDATE "products"
            SET "stock_quantity" = "stock_quantity" - ${updated.quantity},
                "reserved_quantity" = "reserved_quantity" - ${updated.quantity}
            WHERE "id" = ${updated.productId}
              AND "reserved_quantity" >= ${updated.quantity}
              AND "stock_quantity" >= ${updated.quantity}
          `;
          if (Number(ok) === 0) {
            // Fallback for legacy transactions without reservation: try direct decrement
            await tx.$executeRaw`
              UPDATE "products"
              SET "stock_quantity" = "stock_quantity" - ${updated.quantity}
              WHERE "id" = ${updated.productId}
                AND "stock_quantity" >= ${updated.quantity}
            `;
          }
          await tx.transaction.update({
            where: { id },
            data: { stockCommittedAt: new Date() },
          });
        }
      } else {
        // Release reservation for any non-approved final status
        if (!updated.stockReleasedAt) {
          await tx.$executeRaw`
            UPDATE "products"
            SET "reserved_quantity" = "reserved_quantity" - ${updated.quantity}
            WHERE "id" = ${updated.productId}
              AND "reserved_quantity" >= ${updated.quantity}
          `;
          await tx.transaction.update({
            where: { id },
            data: { stockReleasedAt: new Date() },
          });
        }
      }

      const finalTx = await tx.transaction.findUnique({ where: { id } });
      return this.toEntity(finalTx);
    });
  }

  async findExpiredPendingReservations(now: Date): Promise<TransactionEntity[]> {
    const txns = await this.prisma.transaction.findMany({
      where: {
        status: PrismaTransactionStatus.PENDING,
        reservedUntil: { lt: now },
        stockReleasedAt: null,
        stockCommittedAt: null,
      },
    });
    return txns.map((t) => this.toEntity(t));
  }
}
