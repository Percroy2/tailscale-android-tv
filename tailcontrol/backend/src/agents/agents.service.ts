import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { randomUUID } from 'node:crypto';

export interface SupervisionAgent {
  id: string;
  name: string;
  hostname: string;
  capabilities: string[];
  lastSeenAt: string;
  status: 'online' | 'offline';
}

interface AgentStore {
  agents: SupervisionAgent[];
}

@Injectable()
export class AgentsService {
  private readonly onlineWindowMs = 2 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async listAgents(tailnetId: string) {
    const store = await this.loadStore(tailnetId);
    return store.agents.map((agent) => ({
      ...agent,
      status: this.isOnline(agent.lastSeenAt) ? 'online' : 'offline',
    }));
  }

  async registerAgent(
    tailnetId: string,
    input: { name: string; hostname: string; capabilities?: string[] },
  ) {
    const store = await this.loadStore(tailnetId);
    const agent: SupervisionAgent = {
      id: randomUUID(),
      name: input.name,
      hostname: input.hostname,
      capabilities: input.capabilities ?? ['ping', 'port', 'http', 'wol'],
      lastSeenAt: new Date().toISOString(),
      status: 'online',
    };
    store.agents.push(agent);
    await this.saveStore(tailnetId, store);
    return agent;
  }

  async heartbeat(tailnetId: string, agentId: string) {
    const store = await this.loadStore(tailnetId);
    const agent = store.agents.find((item) => item.id === agentId);
    if (!agent) {
      throw new NotFoundException('Agent introuvable');
    }
    agent.lastSeenAt = new Date().toISOString();
    await this.saveStore(tailnetId, store);
    return { success: true, at: agent.lastSeenAt };
  }

  async requestCheck(tailnetId: string, agentId: string) {
    const agents = await this.listAgents(tailnetId);
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) {
      throw new NotFoundException('Agent introuvable');
    }
    if (agent.status !== 'online') {
      return { accepted: false, reason: 'Agent hors ligne' };
    }
    return {
      accepted: true,
      agentId,
      message: 'Demande de supervision transmise à l’agent',
    };
  }

  private async loadStore(tailnetId: string): Promise<AgentStore> {
    const key = this.storeKey(tailnetId);
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return { agents: [] };
    }
    return setting.value as unknown as AgentStore;
  }

  private async saveStore(tailnetId: string, store: AgentStore) {
    const key = this.storeKey(tailnetId);
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: store as unknown as Prisma.InputJsonValue },
      update: { value: store as unknown as Prisma.InputJsonValue },
    });
  }

  private storeKey(tailnetId: string) {
    return `agents:${tailnetId}`;
  }

  private isOnline(lastSeenAt: string) {
    const timestamp = Date.parse(lastSeenAt);
    if (Number.isNaN(timestamp)) {
      return false;
    }
    return Date.now() - timestamp <= this.onlineWindowMs;
  }
}
