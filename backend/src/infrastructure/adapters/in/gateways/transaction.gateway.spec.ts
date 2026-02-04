import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TransactionGateway } from './transaction.gateway';
import { Server, Socket } from 'socket.io';

describe('TransactionGateway', () => {
  let gateway: TransactionGateway;
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SOCKET_CORS_ORIGIN') return 'http://localhost:5173';
              return '';
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get<TransactionGateway>(TransactionGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should log when client connects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient: Partial<Socket> = {
        id: 'test-socket-id',
      };

      gateway.handleConnection(mockClient as Socket);

      expect(consoleSpy).toHaveBeenCalledWith('🔗 Client connected: test-socket-id');
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log when client disconnects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient: Partial<Socket> = {
        id: 'test-socket-id',
      };

      gateway.handleDisconnect(mockClient as Socket);

      expect(consoleSpy).toHaveBeenCalledWith('🔌 Client disconnected: test-socket-id');
      consoleSpy.mockRestore();
    });
  });

  describe('emitTransactionUpdate', () => {
    it('should emit transaction update event to all clients', () => {
      gateway.emitTransactionUpdate(1, 'APPROVED');

      expect(mockServer.emit).toHaveBeenCalledWith('transaction-update', expect.objectContaining({
        transactionId: 1,
        status: 'APPROVED',
      }));
    });

    it('should log the emitted event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.emitTransactionUpdate(123, 'DECLINED');

      expect(consoleSpy).toHaveBeenCalledWith(
        '📡 Emitted transaction update: 123 -> DECLINED',
      );
      consoleSpy.mockRestore();
    });
  });
});
