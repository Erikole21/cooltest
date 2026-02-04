export class CustomerEntity {
  id: number;
  email: string;
  fullName: string;
  createdAt: Date;

  constructor(partial: Partial<CustomerEntity>) {
    Object.assign(this, partial);
  }
}
