import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { TailnetsController } from './tailnets.controller.js';
import { TailnetsService } from './tailnets.service.js';

@Module({
  imports: [AuthModule, TailscaleModule],
  controllers: [TailnetsController],
  providers: [TailnetsService],
  exports: [TailnetsService],
})
export class TailnetsModule {}
