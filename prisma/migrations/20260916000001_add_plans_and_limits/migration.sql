-- Create Plan enum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- Add plan and maxMerchants to organizations
ALTER TABLE "organizations" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'STARTER';
ALTER TABLE "organizations" ADD COLUMN "maxMerchants" INTEGER NOT NULL DEFAULT 2;
