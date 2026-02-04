import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class ReservationExpiryScheduler implements OnModuleInit {
  constructor(
    @InjectQueue('transaction-polling') private readonly pollingQueue: Queue,
  ) {}

  async onModuleInit() {
    // Repeatable job: releases expired reservations even if no webhook arrives.
    await this.pollingQueue.add(
      'expire-reservations',
      {},
      { repeat: { every: 60_000 } }, // every 1 minute
    );
  }
}

