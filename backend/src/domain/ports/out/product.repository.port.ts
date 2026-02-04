import { ProductEntity } from '../../entities/product.entity';

export interface ProductRepositoryPort {
  findAll(): Promise<ProductEntity[]>;
  findById(id: number): Promise<ProductEntity | null>;
  updateStock(id: number, quantity: number): Promise<ProductEntity>;
  reserveStock(id: number, quantity: number): Promise<boolean>;
  releaseReservedStock(id: number, quantity: number): Promise<boolean>;
  commitReservedStock(id: number, quantity: number): Promise<boolean>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
