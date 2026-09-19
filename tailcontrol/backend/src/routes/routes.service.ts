import { Injectable } from '@nestjs/common';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class RoutesService {
  constructor(private readonly tailscaleApi: TailscaleApiService) {}

  listRoutes(tailnetId: string) {
    return this.tailscaleApi.listRoutes(tailnetId);
  }

  listExitNodes(tailnetId: string) {
    return this.tailscaleApi.listExitNodes(tailnetId);
  }
}
