import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { RoutesService } from './routes.service.js';

@Controller('api/v1')
@UseGuards(TvAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('routes')
  listRoutes(@Req() request: Request) {
    return this.routesService
      .listRoutes(request.tvAuth!.tailnetId)
      .then((routes) => ({ routes }));
  }

  @Get('exit-nodes')
  listExitNodes(@Req() request: Request) {
    return this.routesService
      .listExitNodes(request.tvAuth!.tailnetId)
      .then((exitNodes) => ({ exitNodes }));
  }
}
