import { Injectable } from '@nestjs/common';
import { AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditInput {
  action: string;
  userId?: string;
  tvDeviceId?: string;
  tailnetId?: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
  result?: AuditResult;
  error?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId,
        tvDeviceId: input.tvDeviceId,
        tailnetId: input.tailnetId,
        targetType: input.targetType,
        targetId: input.targetId,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        result: input.result ?? AuditResult.SUCCESS,
        error: input.error,
        ipAddress: input.ipAddress,
      },
    });
  }

  listForTailnet(tailnetId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { tailnetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        tvDevice: { select: { id: true, name: true } },
      },
    });
  }
}
