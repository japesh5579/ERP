-- Migration: Simplify roles to ADMIN/WORKER, add imageUrl & userId tracking

-- Step 1: Create new Role enum with just two values
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'WORKER');

-- Step 2: Remove the old default, migrate data, set new default
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE role::text
      WHEN 'SUPER_ADMIN' THEN 'ADMIN'::"Role_new"
      ELSE 'WORKER'::"Role_new"
    END
  );

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'WORKER'::"Role_new";

-- Step 3: Swap enum names
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 4: Add imageUrl to RawMaterial for item photos
ALTER TABLE "RawMaterial" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Step 5: Add userId FK to MaterialUsage for worker tracking
ALTER TABLE "MaterialUsage" ADD COLUMN IF NOT EXISTS "userId" TEXT;

ALTER TABLE "MaterialUsage"
  ADD CONSTRAINT "MaterialUsage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MaterialUsage_userId_idx" ON "MaterialUsage"("userId");
