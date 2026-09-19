import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { DnsService } from './dns.service.js';

@Controller('api/v1/dns')
export class DnsController {
  constructor(private readonly dnsService: DnsService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  getDns(@Req() request: Request) {
    return this.dnsService.getDns(request.tvAuth!.tailnetId);
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  getDnsPortal(@Query('tailnetId') tailnetId: string) {
    return this.dnsService.getDns(tailnetId);
  }

  @Post('nameservers')
  @UseGuards(TvAuthGuard)
  updateNameservers(
    @Req() request: Request,
    @Body() body: { nameservers: string[] },
  ) {
    return this.dnsService.updateNameservers(
      request.tvAuth!.tailnetId,
      body.nameservers ?? [],
      request.tvAuth!,
    );
  }
}
