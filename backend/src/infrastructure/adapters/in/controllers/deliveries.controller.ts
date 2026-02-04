import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { DELIVERY_REPOSITORY } from '../../../../domain/ports/out/delivery.repository.port';
import type { DeliveryRepositoryPort } from '../../../../domain/ports/out/delivery.repository.port';

@Controller('deliveries')
export class DeliveriesController {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }
}
