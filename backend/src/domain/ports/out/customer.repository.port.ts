import { CustomerEntity } from '../../entities/customer.entity';

export interface CreateCustomerData {
  email: string;
  fullName: string;
}

export interface CustomerRepositoryPort {
  create(data: CreateCustomerData): Promise<CustomerEntity>;
  findById(id: number): Promise<CustomerEntity | null>;
}

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');
