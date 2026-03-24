CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'BROKEN');

CREATE TABLE "equipment" (
  "id" TEXT NOT NULL,
  "inventoryNumber" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "allocatedBase" TEXT NOT NULL,
  "currentLocation" TEXT NOT NULL,
  "isContractual" BOOLEAN NOT NULL DEFAULT false,
  "contractCode" TEXT,
  "contractStartAt" TIMESTAMP(3),
  "contractEndAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "equipment_status_event" (
  "id" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "status" "EquipmentStatus" NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "equipment_status_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "equipment_inventoryNumber_key" ON "equipment"("inventoryNumber");
CREATE INDEX "equipment_brand_idx" ON "equipment"("brand");
CREATE INDEX "equipment_allocatedBase_idx" ON "equipment"("allocatedBase");
CREATE INDEX "equipment_status_event_equipmentId_idx" ON "equipment_status_event"("equipmentId");
CREATE INDEX "equipment_status_event_equipmentId_startedAt_idx" ON "equipment_status_event"("equipmentId", "startedAt");
CREATE INDEX "equipment_status_event_equipmentId_endedAt_idx" ON "equipment_status_event"("equipmentId", "endedAt");
CREATE INDEX "equipment_status_event_startedAt_idx" ON "equipment_status_event"("startedAt");
CREATE INDEX "equipment_status_event_endedAt_idx" ON "equipment_status_event"("endedAt");

ALTER TABLE "equipment_status_event"
  ADD CONSTRAINT "equipment_status_event_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;