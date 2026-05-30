import type {
  User,
  RawMaterial,
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialUsage,
  Transformer,
  StageHistory,
  QualityTest,
  Client,
  Dispatch,
  Role,
  MaterialCategory,
  POStatus,
  PhaseType,
  ProductionStage,
  TransformerStatus,
  TestType,
  TestResult,
  DeliveryStatus,
} from "@prisma/client"

export type {
  User,
  RawMaterial,
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialUsage,
  Transformer,
  StageHistory,
  QualityTest,
  Client,
  Dispatch,
  Role,
  MaterialCategory,
  POStatus,
  PhaseType,
  ProductionStage,
  TransformerStatus,
  TestType,
  TestResult,
  DeliveryStatus,
}

export type RawMaterialWithVendor = RawMaterial & {
  vendor: Vendor | null
  _count?: { usageRecords: number }
}

export type TransformerWithRelations = Transformer & {
  engineer: User | null
  client: Client | null
  qualityTests: QualityTest[]
  stageHistory: StageHistory[]
  dispatch: Dispatch | null
}

export type QualityTestWithRelations = QualityTest & {
  transformer: Transformer
  engineer: User
}

export type DispatchWithRelations = Dispatch & {
  transformer: Transformer
  client: Client
  dispatchedBy: User
}

export type PurchaseOrderWithRelations = PurchaseOrder & {
  vendor: Vendor
  items: (PurchaseOrderItem & { material: RawMaterial })[]
}

export type DashboardStats = {
  totalMaterials: number
  lowStockCount: number
  activeProductions: number
  completedThisMonth: number
  pendingQC: number
  dispatchesToday: number
  totalRevenue: number
  pendingRevenue: number
  productionByStage: { stage: string; count: number }[]
  monthlyOutput: { month: string; count: number; revenue: number }[]
  recentActivity: ActivityItem[]
  stockAlerts: StockAlert[]
}

export type ActivityItem = {
  id: string
  type: "production" | "inventory" | "quality" | "dispatch"
  message: string
  time: string
}

export type StockAlert = {
  id: string
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  category: string
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      email: string
      name: string
    }
  }
}
