import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { AuthKeysController } from './auth-keys.controller.js';
import { AuthKeysService } from './auth-keys.service.js';

@Module({
  imports: [TailscaleModule, AuthModule],
  controllers: [AuthKeysController],
  providers: [AuthKeysService],
})
export class AuthKeysModule {}
