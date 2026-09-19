import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../common/audit/audit-log.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly auditLog: AuditLogService) {}

  listForTailnet(tailnetId: string, limit = 100) {
    return this.auditLog.listForTailnet(tailnetId, limit);
  }
}
