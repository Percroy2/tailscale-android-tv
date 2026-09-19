import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { WebsocketModule } from '../websocket/websocket.module.js';
import { TvsController } from './tvs.controller.js';
import { TvsService } from './tvs.service.js';

@Module({
  imports: [AuthModule, WebsocketModule],
  controllers: [TvsController],
  providers: [TvsService],
})
export class TvsModule {}
