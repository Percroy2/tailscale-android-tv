import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { AuditService } from './audit.service.js';

@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  listForTv(@Req() request: Request, @Query('limit') limit?: string) {
    return this.auditService
      .listForTailnet(
        request.tvAuth!.tailnetId,
        limit ? Number.parseInt(limit, 10) : 100,
      )
      .then((entries) => ({ entries }));
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  listForPortal(
    @Query('tailnetId') tailnetId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService
      .listForTailnet(tailnetId, limit ? Number.parseInt(limit, 10) : 100)
      .then((entries) => ({ entries }));
  }
}
