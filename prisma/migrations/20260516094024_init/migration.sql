-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'QUALITY_ENGINEER', 'DISPATCH_STAFF');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('COPPER_COIL', 'CRGO_STEEL', 'TRANSFORMER_OIL', 'BUSHINGS', 'INSULATION', 'CORE_FRAME', 'TAPPING_SWITCH', 'COOLING_RADIATOR', 'PACKAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('SINGLE_PHASE', 'THREE_PHASE');

-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('RAW_MATERIAL_RECEIVED', 'ASSEMBLY', 'COIL_WINDING', 'CORE_ASSEMBLY', 'OIL_FILLING', 'TESTING', 'QC_APPROVAL', 'DISPATCH_READY');

-- CreateEnum
CREATE TYPE "TransformerStatus" AS ENUM ('IN_PRODUCTION', 'ON_HOLD', 'COMPLETED', 'DISPATCHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('VOLTAGE_TEST', 'LOAD_TEST', 'TEMPERATURE_RISE', 'INSULATION_RESISTANCE', 'TURNS_RATIO', 'FINAL_QC');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL_PASS');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INVENTORY_MANAGER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MaterialCategory" NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialUsage" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "materialId" TEXT NOT NULL,
    "transformerId" TEXT,

    CONSTRAINT "MaterialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transformer" (
    "id" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "kvaRating" DOUBLE PRECISION NOT NULL,
    "voltageRatio" TEXT NOT NULL,
    "phaseType" "PhaseType" NOT NULL DEFAULT 'THREE_PHASE',
    "batchNumber" TEXT,
    "currentStage" "ProductionStage" NOT NULL DEFAULT 'RAW_MATERIAL_RECEIVED',
    "status" "TransformerStatus" NOT NULL DEFAULT 'IN_PRODUCTION',
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "serialNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "engineerId" TEXT,
    "clientId" TEXT,

    CONSTRAINT "Transformer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "stage" "ProductionStage" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "notes" TEXT,
    "completedBy" TEXT,
    "transformerId" TEXT NOT NULL,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityTest" (
    "id" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "result" "TestResult" NOT NULL,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "resistance" DOUBLE PRECISION,
    "loadLoss" DOUBLE PRECISION,
    "noLoadLoss" DOUBLE PRECISION,
    "notes" TEXT,
    "faultLog" TEXT,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transformerId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,

    CONSTRAINT "QualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3),
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAddress" TEXT,
    "transporterName" TEXT,
    "trackingNumber" TEXT,
    "invoiceAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transformerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dispatchedById" TEXT NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Transformer_modelNumber_key" ON "Transformer"("modelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_invoiceNumber_key" ON "Dispatch"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_transformerId_key" ON "Dispatch"("transformerId");

-- AddForeignKey
ALTER TABLE "RawMaterial" ADD CONSTRAINT "RawMaterial_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "Transformer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transformer" ADD CONSTRAINT "Transformer_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transformer" ADD CONSTRAINT "Transformer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "Transformer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityTest" ADD CONSTRAINT "QualityTest_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "Transformer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityTest" ADD CONSTRAINT "QualityTest_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "Transformer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
