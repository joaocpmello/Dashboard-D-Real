-- Create product_costs table
CREATE TABLE "product_costs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_costs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints and indices
CREATE UNIQUE INDEX "product_costs_organization_id_product_id_key" ON "product_costs"("organization_id", "product_id");
CREATE UNIQUE INDEX "product_costs_product_id_key" ON "product_costs"("product_id");
CREATE INDEX "product_costs_organization_id_idx" ON "product_costs"("organization_id");

-- Foreign keys
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
