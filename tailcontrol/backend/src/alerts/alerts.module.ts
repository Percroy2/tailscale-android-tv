import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MonitoringModule } from '../monitoring/monitoring.module.js';
import { TailscaleModule } from '../tailscale/tailscale.module.js';
import { WebsocketModule } from '../websocket/websocket.module.js';
import { AlertGeneratorService } from './alert-generator.service.js';
import { AlertsController } from './alerts.controller.js';
import { AlertsService } from './alerts.service.js';

@Module({
  imports: [AuthModule, WebsocketModule, TailscaleModule, MonitoringModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertGeneratorService],
  exports: [AlertsService],
})
export class AlertsModule {}
