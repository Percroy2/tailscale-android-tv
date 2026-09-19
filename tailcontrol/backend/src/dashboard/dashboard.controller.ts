import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';
import { RedisService } from '../common/redis/redis.service.js';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @UseGuards(TvAuthGuard)
  async getTvDashboard(@Req() request: Request) {
    return this.loadDashboard(request.tvAuth!.tailnetId);
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  async getPortalDashboard(@Query('tailnetId') tailnetId: string) {
    return this.loadDashboard(tailnetId);
  }

  private async loadDashboard(tailnetId: string) {
    const cacheKey = `dashboard:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dashboard = await this.tailscaleApi.getDashboard(tailnetId);
    await this.redis.client.setex(cacheKey, 30, JSON.stringify(dashboard));
    return dashboard;
  }
}
