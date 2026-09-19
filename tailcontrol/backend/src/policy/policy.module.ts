import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { PolicyController } from './policy.controller.js';
import { PolicyService } from './policy.service.js';

@Module({
  imports: [TailscaleModule, AuthModule],
  controllers: [PolicyController],
  providers: [PolicyService],
})
export class PolicyModule {}
