import { TransactionEntity, TransactionStatus } from './transaction.entity';

describe('TransactionEntity', () => {
  describe('constructor', () => {
    it('should create a transaction entity with all required properties', () => {
      const transactionData = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const transaction = new TransactionEntity(transactionData);

      expect(transaction.id).toBe(1);
      expect(transaction.productId).toBe(1);
      expect(transaction.total).toBe(215000);
      expect(transaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should create a transaction entity without optional wompiTxnId', () => {
      const transactionData = {
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 2,
        unitPrice: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        total: 215000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const transaction = new TransactionEntity(transactionData);

      expect(transaction.wompiTxnId).toBeUndefined();
    });
  });

  describe('isFinal', () => {
    it('should return true for APPROVED status', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isFinal()).toBe(true);
    });

    it('should return true for DECLINED status', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.DECLINED,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isFinal()).toBe(true);
    });

    it('should return true for ERROR status', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.ERROR,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isFinal()).toBe(true);
    });

    it('should return true for VOIDED status', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.VOIDED,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isFinal()).toBe(true);
    });

    it('should return false for PENDING status', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.PENDING,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isFinal()).toBe(false);
    });
  });

  describe('isApproved', () => {
    it('should return true when status is APPROVED', () => {
      const transaction = new TransactionEntity({
        id: 1,
        productId: 1,
        customerId: 1,
        deliveryId: 1,
        quantity: 1,
        unitPrice: 100000,
        baseFee: 0,
        deliveryFee: 0,
        total: 100000,
        status: TransactionStatus.APPROVED,
        reference: 'TXN-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transaction.isApproved()).toBe(true);
    });

    it('should return false when status is not APPROVED', () => {
      const statuses = [
        TransactionStatus.PENDING,
        TransactionStatus.DECLINED,
        TransactionStatus.ERROR,
        TransactionStatus.VOIDED,
      ];

      statuses.forEach((status) => {
        const transaction = new TransactionEntity({
          id: 1,
          productId: 1,
          customerId: 1,
          deliveryId: 1,
          quantity: 1,
          unitPrice: 100000,
          baseFee: 0,
          deliveryFee: 0,
          total: 100000,
          status,
          reference: 'TXN-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        expect(transaction.isApproved()).toBe(false);
      });
    });
  });
});
