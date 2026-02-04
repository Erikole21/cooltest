import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import {
  CustomerRepositoryPort,
  CreateCustomerData,
} from '../../../../domain/ports/out/customer.repository.port';
import { CustomerEntity } from '../../../../domain/entities/customer.entity';

@Injectable()
export class CustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCustomerData): Promise<CustomerEntity> {
    const customer = await this.prisma.customer.create({
      data,
    });
    return new CustomerEntity(customer);
  }

  async findById(id: number): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    return customer ? new CustomerEntity(customer) : null;
  }
}
