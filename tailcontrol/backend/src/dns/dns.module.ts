import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { DnsController } from './dns.controller.js';
import { DnsService } from './dns.service.js';

@Module({
  imports: [TailscaleModule, AuthModule],
  controllers: [DnsController],
  providers: [DnsService],
})
export class DnsModule {}
