import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { TransactionUpdateEvent } from '../types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  (window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin);

export function useTransactionUpdate(
  transactionId: number | null,
  onUpdate: (event: TransactionUpdateEvent) => void
): void {
  const socketRef = useRef<Socket | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (transactionId == null) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const handler = (event: TransactionUpdateEvent) => {
      if (event.transactionId === transactionId) {
        onUpdateRef.current(event);
      }
    };

    socket.on('transaction-update', handler);

    return () => {
      socket.off('transaction-update', handler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [transactionId]);
}
