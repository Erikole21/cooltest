import { vi, describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTransactionUpdate } from './useSocket';

const mockOn = vi.fn();
const mockOff = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: mockOn,
    off: mockOff,
    disconnect: mockDisconnect,
  }),
}));

describe('useTransactionUpdate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to transaction-update when transactionId provided', () => {
    const onUpdate = vi.fn();
    renderHook(() => useTransactionUpdate(10, onUpdate));
    expect(mockOn).toHaveBeenCalledWith('transaction-update', expect.any(Function));
  });

  it('does not connect when transactionId is null', () => {
    renderHook(() => useTransactionUpdate(null, vi.fn()));
    expect(mockOn).not.toHaveBeenCalled();
  });
});
