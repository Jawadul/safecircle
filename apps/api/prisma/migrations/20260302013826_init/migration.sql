-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('CHECKIN', 'SAFERIDE', 'WALKALONE', 'SOS');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IDLE', 'SETTING_UP', 'ACTIVE', 'COMPLETED', 'ESCALATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DELAYED_ARRIVAL', 'ROUTE_DEVIATION', 'UNEXPLAINED_STOP', 'NON_RESPONSE', 'SOS_TRIGGERED', 'SOS_ESCALATED_SMS', 'SOS_ESCALATED_CALL', 'SESSION_CANCELLED', 'SESSION_COMPLETED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('SENT', 'DELIVERED', 'ACKNOWLEDGED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('PUSH', 'SMS', 'CALL', 'IN_APP');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('FAMILY', 'FRIEND', 'COLLEAGUE', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "privacySettings" JSONB NOT NULL DEFAULT '{"locationRetentionDays":30,"shareLocationWithContacts":true,"reduceLocationPrecision":false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_contacts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactUserId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" "Relationship" NOT NULL,
    "alertChannels" "AlertChannel"[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "subStatus" TEXT NOT NULL DEFAULT 'TRACKING',
    "policy" JSONB NOT NULL,
    "shareWith" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_session_details" (
    "sessionId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "etaAt" TIMESTAMP(3) NOT NULL,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "arrivedAt" TIMESTAMP(3),
    "overdueAt" TIMESTAMP(3),

    CONSTRAINT "checkin_session_details_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "saferide_session_details" (
    "sessionId" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "routePolyline" TEXT NOT NULL,
    "deviationThresholdMeters" INTEGER NOT NULL DEFAULT 200,
    "stopThresholdSeconds" INTEGER NOT NULL DEFAULT 120,
    "firstDeviationAt" TIMESTAMP(3),
    "firstStopAt" TIMESTAMP(3),

    CONSTRAINT "saferide_session_details_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "walkalone_session_details" (
    "sessionId" TEXT NOT NULL,
    "promptIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "lastPromptAt" TIMESTAMP(3),
    "lastResponseAt" TIMESTAMP(3),

    CONSTRAINT "walkalone_session_details_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "location_pings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "geohash6" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notifiedContacts" TEXT[],
    "channels" "AlertChannel"[],
    "status" "AlertStatus" NOT NULL DEFAULT 'SENT',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_contacts_inviteToken_key" ON "trusted_contacts"("inviteToken");

-- CreateIndex
CREATE INDEX "trusted_contacts_ownerId_idx" ON "trusted_contacts"("ownerId");

-- CreateIndex
CREATE INDEX "trusted_contacts_inviteToken_idx" ON "trusted_contacts"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_contacts_ownerId_phone_key" ON "trusted_contacts"("ownerId", "phone");

-- CreateIndex
CREATE INDEX "safety_sessions_userId_idx" ON "safety_sessions"("userId");

-- CreateIndex
CREATE INDEX "safety_sessions_status_idx" ON "safety_sessions"("status");

-- CreateIndex
CREATE INDEX "safety_sessions_type_status_idx" ON "safety_sessions"("type", "status");

-- CreateIndex
CREATE INDEX "location_pings_sessionId_recordedAt_idx" ON "location_pings"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "location_pings_userId_recordedAt_idx" ON "location_pings"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "location_pings_geohash6_idx" ON "location_pings"("geohash6");

-- CreateIndex
CREATE INDEX "alert_events_sessionId_idx" ON "alert_events"("sessionId");

-- CreateIndex
CREATE INDEX "alert_events_userId_createdAt_idx" ON "alert_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "alert_events_status_idx" ON "alert_events"("status");

-- CreateIndex
CREATE INDEX "audit_log_userId_createdAt_idx" ON "audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_action_createdAt_idx" ON "audit_log"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_sessions" ADD CONSTRAINT "safety_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_session_details" ADD CONSTRAINT "checkin_session_details_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "safety_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saferide_session_details" ADD CONSTRAINT "saferide_session_details_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "safety_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "walkalone_session_details" ADD CONSTRAINT "walkalone_session_details_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "safety_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_pings" ADD CONSTRAINT "location_pings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "safety_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "safety_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
