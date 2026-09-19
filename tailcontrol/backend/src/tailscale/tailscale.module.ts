import { Module } from '@nestjs/common';
import { TailscaleApiService } from './tailscale-api.service.js';
import { TailscaleOAuthService } from './tailscale-oauth.service.js';

@Module({
  providers: [TailscaleOAuthService, TailscaleApiService],
  exports: [TailscaleOAuthService, TailscaleApiService],
})
export class TailscaleModule {}
