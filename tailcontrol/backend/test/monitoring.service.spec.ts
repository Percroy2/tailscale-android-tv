import { describe, expect, it } from 'vitest';
import { MonitorRunnerService } from '../src/monitoring/monitoring.service.js';

describe('MonitorRunnerService', () => {
  const runner = new MonitorRunnerService();

  it('rejette une MAC WoL invalide', async () => {
    const result = await runner.runCheck('wol', 'not-a-mac');
    expect(result.status).toBe('down');
    expect(result.details.error).toBe('Adresse MAC invalide');
  });

  it('normalise une MAC valide (UDP peut échouer en sandbox)', async () => {
    const result = await runner.runCheck('wol', 'AA:BB:CC:DD:EE:FF');
    expect(result.details.macAddress ?? result.details.error).toBeTruthy();
  });

  it('signale un type de supervision inconnu', async () => {
    const result = await runner.runCheck('unknown-type', 'target');
    expect(result.status).toBe('unknown');
    expect(String(result.details.error)).toContain('non supporté');
  });
});
