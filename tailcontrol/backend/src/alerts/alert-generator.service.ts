import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';
import { MonitoringService } from '../monitoring/monitoring.service.js';
import { AlertsService } from './alerts.service.js';

const SCAN_INTERVAL_MS = 60_000;

@Injectable()
export class AlertGeneratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertGeneratorService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tailscaleApi: TailscaleApiService,
    private readonly alertsService: AlertsService,
    private readonly monitoringService: MonitoringService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.scanAllTailnets().catch((error) => {
        this.logger.error('Scan alertes échoué', error);
      });
    }, SCAN_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async scanAllTailnets() {
    const tailnets = await this.prisma.tailnet.findMany({
      where: { enabled: true },
      include: {
        credentials: {
          where: { revokedAt: null },
          take: 1,
        },
      },
    });

    for (const tailnet of tailnets) {
      if (tailnet.credentials.length === 0) {
        continue;
      }
      await this.scanTailnet(tailnet.id);
    }
  }

  async scanTailnet(tailnetId: string) {
    try {
      const dashboard = await this.tailscaleApi.getDashboard(tailnetId);
      const stats = dashboard.stats;

      if (stats.pendingApproval > 0) {
        await this.alertsService.createAlertIfNew(tailnetId, {
          type: 'pending_devices',
          title: 'Machines en attente',
          message: `${stats.pendingApproval} machine(s) nécessitent une approbation.`,
        });
      }

      if (stats.pendingRoutes > 0) {
        await this.alertsService.createAlertIfNew(tailnetId, {
          type: 'pending_routes',
          title: 'Routes en attente',
          message: `${stats.pendingRoutes} route(s) subnet en attente d'approbation.`,
        });
      }

      if (stats.expiringKeys > 0) {
        await this.alertsService.createAlertIfNew(tailnetId, {
          type: 'expiring_keys',
          title: 'Clés expirantes',
          message: `${stats.expiringKeys} clé(s) expirent sous 7 jours.`,
        });
      }

      const offlineRatio =
        stats.devicesTotal > 0
          ? stats.devicesOffline / stats.devicesTotal
          : 0;
      if (stats.devicesTotal >= 3 && offlineRatio >= 0.5) {
        await this.alertsService.createAlertIfNew(tailnetId, {
          type: 'mass_offline',
          title: 'Panne réseau suspectée',
          message: `${stats.devicesOffline}/${stats.devicesTotal} machines hors ligne.`,
        });
      }

      const monitorResults = await this.monitoringService.runAll(tailnetId);
      for (const entry of monitorResults.results) {
        if (entry.result.status === 'down') {
          await this.alertsService.createAlertIfNew(
            tailnetId,
            {
              type: 'monitor_down',
              title: `Supervision : ${entry.monitor.name}`,
              message: `Cible ${entry.monitor.target} inaccessible (${entry.monitor.type}).`,
            },
            15 * 60 * 1000,
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Tailnet ${tailnetId} ignoré: ${String(error)}`);
    }
  }
}
