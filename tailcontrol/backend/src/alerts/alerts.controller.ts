import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { AlertsService } from './alerts.service.js';

@Controller('api/v1/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  listAlerts(@Req() request: Request) {
    return this.alertsService
      .listAlerts(request.tvAuth!.tailnetId)
      .then((alerts) => ({ alerts }));
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  listAlertsPortal(@Query('tailnetId') tailnetId: string) {
    return this.alertsService
      .listAlerts(tailnetId)
      .then((alerts) => ({ alerts }));
  }

  @Post(':id/read')
  @UseGuards(TvAuthGuard)
  markRead(@Param('id') alertId: string) {
    return this.alertsService.markRead(alertId);
  }
}
