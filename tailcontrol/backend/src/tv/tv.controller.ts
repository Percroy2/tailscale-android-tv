import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { TvService } from './tv.service.js';

@Controller('api/v1/tv')
@UseGuards(TvAuthGuard)
export class TvController {
  constructor(private readonly tvService: TvService) {}

  @Get('profile')
  getProfile(@Req() request: Request) {
    return this.tvService.getProfile(request.tvAuth!);
  }

  @Get('tailnets')
  listTailnets(@Req() request: Request) {
    return this.tvService
      .listTailnets(request.tvAuth!.tvDeviceId)
      .then((tailnets) => ({ tailnets }));
  }

  @Post('tailnets/:tailnetId/switch')
  switchTailnet(@Req() request: Request, @Param('tailnetId') tailnetId: string) {
    return this.tvService.switchTailnet(
      request.tvAuth!.tvDeviceId,
      tailnetId,
    );
  }
}
