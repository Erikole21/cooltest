import { DeliveryEntity } from '../../entities/delivery.entity';

export interface CreateDeliveryData {
  address: string;
  city: string;
  phone: string;
}

export interface DeliveryRepositoryPort {
  create(data: CreateDeliveryData): Promise<DeliveryEntity>;
  findById(id: number): Promise<DeliveryEntity | null>;
}

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');
