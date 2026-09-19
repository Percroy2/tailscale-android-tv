import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { AuthKeysService } from './auth-keys.service.js';

@Controller('api/v1/auth-keys')
export class AuthKeysController {
  constructor(private readonly authKeysService: AuthKeysService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  listKeys(@Req() request: Request) {
    return this.authKeysService
      .listKeys(request.tvAuth!.tailnetId)
      .then((keys) => ({ keys }));
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  listKeysPortal(@Query('tailnetId') tailnetId: string) {
    return this.authKeysService.listKeys(tailnetId).then((keys) => ({ keys }));
  }

  @Post()
  @UseGuards(TvAuthGuard)
  createKey(
    @Req() request: Request,
    @Body()
    body: {
      description?: string;
      reusable?: boolean;
      ephemeral?: boolean;
      preauthorized?: boolean;
      tags?: string[];
      expirySeconds?: number;
    },
  ) {
    return this.authKeysService.createKey(
      request.tvAuth!.tailnetId,
      body,
      request.tvAuth!,
    );
  }
}
