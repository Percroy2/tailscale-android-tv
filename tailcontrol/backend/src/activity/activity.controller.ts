import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { ActivityService } from './activity.service.js';

@Controller('api/v1/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  listForTv(@Req() request: Request, @Query('limit') limit?: string) {
    return this.activityService.listActivity(
      request.tvAuth!.tailnetId,
      limit ? Number.parseInt(limit, 10) : 50,
    );
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  listForPortal(
    @Query('tailnetId') tailnetId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.listActivity(
      tailnetId,
      limit ? Number.parseInt(limit, 10) : 50,
    );
  }
}
