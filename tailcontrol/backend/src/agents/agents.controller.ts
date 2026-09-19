import {
  Body,
  Controller,
  Delete,
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
import { AgentsService } from './agents.service.js';

@Controller('api/v1/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('for-tv')
  @UseGuards(TvAuthGuard)
  listForTv(@Req() request: Request) {
    return this.agentsService
      .listAgents(request.tvAuth!.tailnetId)
      .then((agents) => ({ agents }));
  }

  @Get()
  @UseGuards(PortalAuthGuard)
  listAgents(@Query('tailnetId') tailnetId: string) {
    return this.agentsService
      .listAgents(tailnetId)
      .then((agents) => ({ agents }));
  }

  @Post('register')
  @UseGuards(PortalAuthGuard)
  registerAgent(
    @Query('tailnetId') tailnetId: string,
    @Body()
    body: {
      name: string;
      hostname: string;
      capabilities?: string[];
    },
  ) {
    return this.agentsService.registerAgent(tailnetId, body);
  }

  @Post(':id/heartbeat')
  heartbeat(@Param('id') agentId: string, @Query('tailnetId') tailnetId: string) {
    return this.agentsService.heartbeat(tailnetId, agentId);
  }

  @Post(':id/check')
  @UseGuards(TvAuthGuard)
  requestCheck(@Req() request: Request, @Param('id') agentId: string) {
    return this.agentsService.requestCheck(
      request.tvAuth!.tailnetId,
      agentId,
    );
  }
}
