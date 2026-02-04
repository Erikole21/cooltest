export class ProductEntity {
  id: number;
  name: string;
  description: string;
  price: number; // Price in cents
  stockQuantity: number;
  reservedQuantity: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }

  hasStock(quantity: number): boolean {
    const available = this.stockQuantity - (this.reservedQuantity ?? 0);
    return available >= quantity;
  }

  decrementStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error('Insufficient stock');
    }
    this.stockQuantity -= quantity;
  }
}
