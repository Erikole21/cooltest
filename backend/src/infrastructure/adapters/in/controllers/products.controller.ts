import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../../../domain/ports/out/product.repository.port';
import type { ProductRepositoryPort } from '../../../../domain/ports/out/product.repository.port';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  @Get()
  async findAll() {
    const products = await this.productRepository.findAll();
    return { products };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
