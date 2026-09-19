-- CreateEnum
CREATE TYPE "PermissionProfile" AS ENUM ('READ_ONLY', 'OPERATOR', 'ADMIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tailnet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tailnet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TailscaleCredential" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "encryptedClientSecret" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TailscaleCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "platform" TEXT,
    "platformVersion" TEXT,
    "appVersion" TEXT,
    "refreshTokenHash" TEXT,
    "pairedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvPermission" (
    "id" TEXT NOT NULL,
    "tvDeviceId" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "profile" "PermissionProfile" NOT NULL DEFAULT 'READ_ONLY',
    "canReadDevices" BOOLEAN NOT NULL DEFAULT true,
    "canModifyDevices" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteDevices" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoutes" BOOLEAN NOT NULL DEFAULT false,
    "canManageDns" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageKeys" BOOLEAN NOT NULL DEFAULT false,
    "canManagePolicy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairingSession" (
    "id" TEXT NOT NULL,
    "pairingCodeHash" TEXT NOT NULL,
    "tvDeviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PairingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceGroup" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFavorite" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorResult" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "details" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "tvDeviceId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tailnetId" TEXT NOT NULL,
    "tvDeviceId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tvDeviceId" TEXT,
    "tailnetId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "result" "AuditResult" NOT NULL,
    "error" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TvDevice_installationId_key" ON "TvDevice"("installationId");

-- CreateIndex
CREATE INDEX "TailscaleCredential_tailnetId_idx" ON "TailscaleCredential"("tailnetId");

-- CreateIndex
CREATE INDEX "TvDevice_installationId_idx" ON "TvDevice"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "TvPermission_tvDeviceId_tailnetId_key" ON "TvPermission"("tvDeviceId", "tailnetId");

-- CreateIndex
CREATE INDEX "PairingSession_pairingCodeHash_idx" ON "PairingSession"("pairingCodeHash");

-- CreateIndex
CREATE INDEX "PairingSession_expiresAt_idx" ON "PairingSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceGroup_tailnetId_name_key" ON "DeviceGroup"("tailnetId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFavorite_tailnetId_deviceId_key" ON "DeviceFavorite"("tailnetId", "deviceId");

-- CreateIndex
CREATE INDEX "MonitorResult_monitorId_checkedAt_idx" ON "MonitorResult"("monitorId", "checkedAt");

-- CreateIndex
CREATE INDEX "Alert_tailnetId_createdAt_idx" ON "Alert"("tailnetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tailnetId_createdAt_idx" ON "AuditLog"("tailnetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "TailscaleCredential" ADD CONSTRAINT "TailscaleCredential_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvPermission" ADD CONSTRAINT "TvPermission_tvDeviceId_fkey" FOREIGN KEY ("tvDeviceId") REFERENCES "TvDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvPermission" ADD CONSTRAINT "TvPermission_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairingSession" ADD CONSTRAINT "PairingSession_tvDeviceId_fkey" FOREIGN KEY ("tvDeviceId") REFERENCES "TvDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceGroup" ADD CONSTRAINT "DeviceGroup_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFavorite" ADD CONSTRAINT "DeviceFavorite_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorResult" ADD CONSTRAINT "MonitorResult_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tvDeviceId_fkey" FOREIGN KEY ("tvDeviceId") REFERENCES "TvDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tvDeviceId_fkey" FOREIGN KEY ("tvDeviceId") REFERENCES "TvDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tvDeviceId_fkey" FOREIGN KEY ("tvDeviceId") REFERENCES "TvDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tailnetId_fkey" FOREIGN KEY ("tailnetId") REFERENCES "Tailnet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
