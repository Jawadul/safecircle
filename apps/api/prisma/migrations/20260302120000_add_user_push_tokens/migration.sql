-- AddColumn: push notification tokens per user (max 5 devices)
ALTER TABLE "users" ADD COLUMN "pushTokens" TEXT[] NOT NULL DEFAULT '{}';
