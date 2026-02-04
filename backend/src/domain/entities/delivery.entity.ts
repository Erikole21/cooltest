export class DeliveryEntity {
  id: number;
  address: string;
  city: string;
  phone: string;
  createdAt: Date;

  constructor(partial: Partial<DeliveryEntity>) {
    Object.assign(this, partial);
  }
}
