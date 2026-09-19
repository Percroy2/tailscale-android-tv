import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { MonitoringService } from './monitoring.service.js';

@Controller('api/v1/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  listForTv(@Req() request: Request) {
    return this.monitoringService
      .listMonitors(request.tvAuth!.tailnetId)
      .then((monitors) => ({ monitors }));
  }

  @Post(':id/run')
  @UseGuards(TvAuthGuard)
  runForTv(@Req() request: Request, @Param('id') monitorId: string) {
    return this.monitoringService.runMonitor(
      request.tvAuth!.tailnetId,
      monitorId,
    );
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  listForPortal(@Query('tailnetId') tailnetId: string) {
    return this.monitoringService
      .listMonitors(tailnetId)
      .then((monitors) => ({ monitors }));
  }

  @Post('portal')
  @UseGuards(PortalAuthGuard)
  createForPortal(
    @Query('tailnetId') tailnetId: string,
    @Body()
    body: {
      name: string;
      type: string;
      target: string;
      config?: Record<string, unknown>;
    },
  ) {
    return this.monitoringService.createMonitor(tailnetId, body);
  }

  @Post('portal/run-all')
  @UseGuards(PortalAuthGuard)
  runAllForPortal(@Query('tailnetId') tailnetId: string) {
    return this.monitoringService.runAll(tailnetId);
  }
}
