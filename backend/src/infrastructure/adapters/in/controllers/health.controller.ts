import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../../config/prisma.service';

@Controller('health')
@SkipThrottle() // Health checks should not be rate limited
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check database connection
      () => this.prismaHealth.pingCheck('database', this.prisma),

      // Check memory heap (alert if > 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Check RSS memory (alert if > 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Check disk storage (alert if > 90% used)
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9, // Alert if > 90% used
        }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      // Readiness check - only database
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  @Get('live')
  live() {
    // Simple liveness check
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
