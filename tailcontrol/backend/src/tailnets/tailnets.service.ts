import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class TailnetsService {
  constructor(private readonly prisma: PrismaService) {}

  listTailnets() {
    return this.prisma.tailnet.findMany({
      where: { enabled: true },
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        enabled: true,
      },
    });
  }

  createTailnet(input: {
    name: string;
    displayName: string;
    enabled?: boolean;
  }) {
    return this.prisma.tailnet.create({
      data: {
        name: input.name,
        displayName: input.displayName,
        enabled: input.enabled ?? true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        enabled: true,
      },
    });
  }
}
