import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { PolicyService } from './policy.service.js';

@Controller('api/v1/policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  @UseGuards(TvAuthGuard)
  getPolicy(@Req() request: Request) {
    return this.policyService.getPolicy(request.tvAuth!.tailnetId);
  }

  @Get('portal')
  @UseGuards(PortalAuthGuard)
  getPolicyPortal(@Query('tailnetId') tailnetId: string) {
    return this.policyService.getPolicy(tailnetId);
  }

  @Post('validate')
  @UseGuards(TvAuthGuard)
  validatePolicy(@Req() request: Request, @Body() body: { acl: unknown }) {
    return this.policyService.validatePolicy(
      request.tvAuth!.tailnetId,
      body.acl,
    );
  }

  @Post()
  updatePolicy(@Req() request: Request, @Body() body: { acl: unknown }) {
    return this.policyService.updatePolicy(
      request.tvAuth!.tailnetId,
      body.acl,
      request.tvAuth!,
    );
  }
}
