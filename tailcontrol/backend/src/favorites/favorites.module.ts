import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';

@Module({
  imports: [AuthModule, TailscaleModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
