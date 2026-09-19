import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { DevicesService } from './devices.service.js';

@Controller('api/v1/devices')
@UseGuards(TvAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  listDevices(
    @Req() request: Request,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
  ) {
    const tailnetId = request.tvAuth!.tailnetId;
    return this.devicesService.listDevices(tailnetId, filter, search).then(
      (devices) => ({ devices }),
    );
  }

  @Get(':id')
  getDevice(@Req() request: Request, @Param('id') deviceId: string) {
    return this.devicesService.getDevice(request.tvAuth!.tailnetId, deviceId);
  }

  @Post(':id/authorize')
  authorizeDevice(@Req() request: Request, @Param('id') deviceId: string) {
    return this.devicesService.authorizeDevice(
      request.tvAuth!.tailnetId,
      deviceId,
      request.tvAuth!,
    );
  }

  @Post(':id/revoke')
  revokeDevice(@Req() request: Request, @Param('id') deviceId: string) {
    return this.devicesService.revokeDevice(
      request.tvAuth!.tailnetId,
      deviceId,
      request.tvAuth!,
    );
  }

  @Post(':id/routes/:route/approve')
  approveRoute(
    @Req() request: Request,
    @Param('id') deviceId: string,
    @Param('route') route: string,
  ) {
    return this.devicesService.approveRoute(
      request.tvAuth!.tailnetId,
      deviceId,
      decodeURIComponent(route),
      request.tvAuth!,
    );
  }
}
