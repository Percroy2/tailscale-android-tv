import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';

@Module({
  imports: [AuthModule, TailscaleModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
