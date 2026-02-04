export class ProductEntity {
  id: number;
  name: string;
  description: string;
  price: number; // Price in cents
  stockQuantity: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }

  hasStock(quantity: number): boolean {
    return this.stockQuantity >= quantity;
  }

  decrementStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error('Insufficient stock');
    }
    this.stockQuantity -= quantity;
  }
}
