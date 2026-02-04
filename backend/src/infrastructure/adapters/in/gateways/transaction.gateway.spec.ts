import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { TransactionGateway } from './transaction.gateway';
import { Server, Socket } from 'socket.io';

describe('TransactionGateway', () => {
  let gateway: TransactionGateway;
  let mockServer: Partial<Server>;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionGateway,
        {
          provide: Logger,
          useValue: mockLogger,
        },
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
      const mockClient: Partial<Socket> = {
        id: 'test-socket-id',
      };

      gateway.handleConnection(mockClient as Socket);

      expect(mockLogger.log).toHaveBeenCalledWith('🔗 Client connected: test-socket-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should log when client disconnects', () => {
      const mockClient: Partial<Socket> = {
        id: 'test-socket-id',
      };

      gateway.handleDisconnect(mockClient as Socket);

      expect(mockLogger.log).toHaveBeenCalledWith('🔌 Client disconnected: test-socket-id');
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
      gateway.emitTransactionUpdate(123, 'DECLINED');

      expect(mockLogger.log).toHaveBeenCalledWith(
        '📡 Emitted transaction update: 123 -> DECLINED',
      );
    });
  });
});
