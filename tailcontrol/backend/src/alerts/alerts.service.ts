import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';

export interface CreateAlertInput {
  type: string;
  title: string;
  message: string;
  tvDeviceId?: string;
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  listAlerts(tailnetId: string) {
    return this.prisma.alert.findMany({
      where: { tailnetId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { readAt: new Date() },
    });
  }

  async createAlert(tailnetId: string, input: CreateAlertInput) {
    const alert = await this.prisma.alert.create({
      data: {
        tailnetId,
        tvDeviceId: input.tvDeviceId,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });

    this.events.emitAlert(tailnetId, {
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt.toISOString(),
    });

    return alert;
  }

  async createAlertIfNew(
    tailnetId: string,
    input: CreateAlertInput,
    dedupeWindowMs = 60 * 60 * 1000,
  ) {
    const since = new Date(Date.now() - dedupeWindowMs);
    const existing = await this.prisma.alert.findFirst({
      where: {
        tailnetId,
        type: input.type,
        title: input.title,
        createdAt: { gte: since },
      },
    });

    if (existing) {
      return existing;
    }

    return this.createAlert(tailnetId, input);
  }
}
