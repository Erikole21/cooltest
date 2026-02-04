import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Will be configured via SOCKET_CORS_ORIGIN
    credentials: true,
  },
})
export class TransactionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly configService: ConfigService) {}

  afterInit(server: Server) {
    const corsOrigin = this.configService
      .get<string>('SOCKET_CORS_ORIGIN', '*')
      .split(',');
    console.log(`🔌 Socket.IO initialized with CORS: ${corsOrigin}`);
  }

  handleConnection(client: Socket) {
    console.log(`🔗 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
  }

  emitTransactionUpdate(transactionId: number, status: string) {
    this.server.emit('transaction-update', {
      transactionId,
      status,
      timestamp: new Date().toISOString(),
    });
    console.log(`📡 Emitted transaction update: ${transactionId} -> ${status}`);
  }
}
