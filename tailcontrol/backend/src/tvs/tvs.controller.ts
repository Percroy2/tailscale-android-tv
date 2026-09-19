import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PermissionProfile } from '@prisma/client';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvsService } from './tvs.service.js';

@Controller('api/v1/tvs')
@UseGuards(PortalAuthGuard)
export class TvsController {
  constructor(private readonly tvsService: TvsService) {}

  @Get()
  listTvs(@Query('tailnetId') tailnetId: string) {
    return this.tvsService.listTvs(tailnetId).then((tvs) => ({ tvs }));
  }

  @Post(':id/revoke')
  revokeTv(
    @Req() request: Request,
    @Param('id') tvDeviceId: string,
    @Query('tailnetId') tailnetId: string,
  ) {
    return this.tvsService.revokeTv(
      tailnetId,
      tvDeviceId,
      request.user!.sub,
    );
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') tvDeviceId: string,
    @Query('tailnetId') tailnetId: string,
    @Body()
    body: {
      profile: PermissionProfile;
      permissions?: Record<string, boolean>;
    },
  ) {
    return this.tvsService.updatePermissions(tailnetId, tvDeviceId, body);
  }
}
