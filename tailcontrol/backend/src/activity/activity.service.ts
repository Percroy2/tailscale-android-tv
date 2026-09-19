import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listActivity(tailnetId: string, limit = 50) {
    const [auditLogs, alerts] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tailnetId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { displayName: true, email: true } },
          tvDevice: { select: { name: true } },
        },
      }),
      this.prisma.alert.findMany({
        where: { tailnetId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const items = [
      ...auditLogs.map((entry) => ({
        id: entry.id,
        type: 'audit' as const,
        action: entry.action,
        title: entry.action.replaceAll('_', ' '),
        message:
          entry.tvDevice?.name ??
          entry.user?.displayName ??
          entry.user?.email ??
          entry.targetType ??
          'Système',
        result: entry.result,
        createdAt: entry.createdAt.toISOString(),
      })),
      ...alerts.map((alert) => ({
        id: alert.id,
        type: 'alert' as const,
        action: alert.type,
        title: alert.title,
        message: alert.message,
        result: alert.readAt ? 'READ' : 'NEW',
        createdAt: alert.createdAt.toISOString(),
      })),
    ];

    items.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );

    return { items: items.slice(0, limit) };
  }
}
