import { ProductEntity } from './product.entity';

describe('ProductEntity', () => {
  describe('constructor', () => {
    it('should create a product entity with all properties', () => {
      const productData = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 100000,
        stockQuantity: 10,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const product = new ProductEntity(productData);

      expect(product.id).toBe(1);
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(100000);
      expect(product.stockQuantity).toBe(10);
    });

    it('should create a product entity without optional imageUrl', () => {
      const productData = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const product = new ProductEntity(productData);

      expect(product.imageUrl).toBeUndefined();
    });
  });

  describe('hasStock', () => {
    it('should return true when stock is sufficient', () => {
      const product = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(product.hasStock(5)).toBe(true);
      expect(product.hasStock(10)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const product = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(product.hasStock(10)).toBe(false);
    });
  });

  describe('decrementStock', () => {
    it('should decrement stock when quantity is available', () => {
      const product = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      product.decrementStock(3);

      expect(product.stockQuantity).toBe(7);
    });

    it('should throw error when insufficient stock', () => {
      const product = new ProductEntity({
        id: 1,
        name: 'Test Product',
        description: 'Test',
        price: 100000,
        stockQuantity: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => product.decrementStock(10)).toThrow('Insufficient stock');
      expect(product.stockQuantity).toBe(5);
    });
  });
});
