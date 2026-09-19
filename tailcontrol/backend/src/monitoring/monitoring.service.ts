import { createConnection } from 'node:net';
import { createSocket } from 'node:dgram';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

export interface MonitorCheckResult {
  status: 'up' | 'down' | 'unknown';
  latencyMs: number | null;
  details: Record<string, unknown>;
}

@Injectable()
export class MonitorRunnerService {
  async runCheck(
    type: string,
    target: string,
    config?: Record<string, unknown> | null,
  ): Promise<MonitorCheckResult> {
    switch (type) {
      case 'http':
        return this.checkHttp(target, config);
      case 'port':
        return this.checkPort(target, Number(config?.port ?? 80));
      case 'ping':
        return this.checkTcpReachable(target, Number(config?.port ?? 443));
      case 'wol':
        return this.sendWakeOnLan(target);
      default:
        return {
          status: 'unknown',
          latencyMs: null,
          details: { error: `Type ${type} non supporté` },
        };
    }
  }

  private async checkHttp(
    target: string,
    config?: Record<string, unknown> | null,
  ): Promise<MonitorCheckResult> {
    const url = target.startsWith('http') ? target : `http://${target}`;
    const started = Date.now();
    try {
      const response = await fetch(url, {
        method: (config?.method as string | undefined) ?? 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return {
        status: response.ok ? 'up' : 'down',
        latencyMs: Date.now() - started,
        details: { statusCode: response.status, url },
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        details: {
          url,
          error: error instanceof Error ? error.message : 'Erreur HTTP',
        },
      };
    }
  }

  private checkPort(host: string, port: number): Promise<MonitorCheckResult> {
    return new Promise((resolve) => {
      const started = Date.now();
      const socket = createConnection({ host, port, timeout: 5000 }, () => {
        const latencyMs = Date.now() - started;
        socket.end();
        resolve({ status: 'up', latencyMs, details: { host, port } });
      });

      socket.on('error', (error) => {
        resolve({
          status: 'down',
          latencyMs: Date.now() - started,
          details: { host, port, error: error.message },
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          status: 'down',
          latencyMs: Date.now() - started,
          details: { host, port, error: 'Timeout' },
        });
      });
    });
  }

  private checkTcpReachable(host: string, port: number) {
    return this.checkPort(host, port);
  }

  private sendWakeOnLan(macAddress: string): Promise<MonitorCheckResult> {
    return new Promise((resolve) => {
      const normalized = macAddress.replace(/[^a-fA-F0-9]/g, '');
      if (normalized.length !== 12) {
        resolve({
          status: 'down',
          latencyMs: null,
          details: { error: 'Adresse MAC invalide' },
        });
        return;
      }

      const buffer = Buffer.alloc(102);
      buffer.fill(0xff, 0, 6);
      for (let index = 6; index < buffer.length; index += 6) {
        Buffer.from(normalized, 'hex').copy(buffer, index);
      }

      const socket = createSocket('udp4');
      socket.send(buffer, 9, '255.255.255.255', (error) => {
        socket.close();
        if (error) {
          resolve({
            status: 'down',
            latencyMs: null,
            details: { error: error.message },
          });
          return;
        }
        resolve({
          status: 'up',
          latencyMs: null,
          details: { macAddress, sent: true },
        });
      });
    });
  }
}

@Injectable()
export class MonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: MonitorRunnerService,
  ) {}

  listMonitors(tailnetId: string) {
    return this.prisma.monitor.findMany({
      where: { tailnetId },
      orderBy: { name: 'asc' },
      include: {
        results: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  createMonitor(
    tailnetId: string,
    input: {
      name: string;
      type: string;
      target: string;
      config?: Record<string, unknown>;
    },
  ) {
    return this.prisma.monitor.create({
      data: {
        tailnetId,
        name: input.name,
        type: input.type,
        target: input.target,
        config: input.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async runMonitor(tailnetId: string, monitorId: string) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, tailnetId },
    });
    if (!monitor) {
      throw new NotFoundException('Supervision introuvable');
    }

    const result = await this.runner.runCheck(
      monitor.type,
      monitor.target,
      monitor.config as Record<string, unknown> | null,
    );

    const saved = await this.prisma.monitorResult.create({
      data: {
        monitorId: monitor.id,
        status: result.status,
        latencyMs: result.latencyMs,
        details: result.details as Prisma.InputJsonValue,
      },
    });

    return { monitor, result: saved };
  }

  async runAll(tailnetId: string) {
    const monitors = await this.prisma.monitor.findMany({
      where: { tailnetId, enabled: true },
    });
    const results = [];

    for (const monitor of monitors) {
      results.push(await this.runMonitor(tailnetId, monitor.id));
    }

    return { results };
  }
}
