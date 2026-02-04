import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import {
  DeliveryRepositoryPort,
  CreateDeliveryData,
} from '../../../../domain/ports/out/delivery.repository.port';
import { DeliveryEntity } from '../../../../domain/entities/delivery.entity';

@Injectable()
export class DeliveryRepository implements DeliveryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDeliveryData): Promise<DeliveryEntity> {
    const delivery = await this.prisma.delivery.create({
      data,
    });
    return new DeliveryEntity(delivery);
  }

  async findById(id: number): Promise<DeliveryEntity | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });
    return delivery ? new DeliveryEntity(delivery) : null;
  }
}
