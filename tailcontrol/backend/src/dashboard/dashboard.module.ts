import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [AuthModule, TailscaleModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
