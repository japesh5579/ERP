import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const STAGE_ORDER = [
  "RAW_MATERIAL_RECEIVED",
  "ASSEMBLY",
  "COIL_WINDING",
  "CORE_ASSEMBLY",
  "OIL_FILLING",
  "TESTING",
  "QC_APPROVAL",
  "DISPATCH_READY",
] as const

export const STAGE_LABELS: Record<string, string> = {
  RAW_MATERIAL_RECEIVED: "Raw Material Received",
  ASSEMBLY: "Assembly",
  COIL_WINDING: "Coil Winding",
  CORE_ASSEMBLY: "Core Assembly",
  OIL_FILLING: "Oil Filling",
  TESTING: "Testing",
  QC_APPROVAL: "QC Approval",
  DISPATCH_READY: "Dispatch Ready",
}

export const CATEGORY_LABELS: Record<string, string> = {
  COPPER_COIL: "Copper Coil",
  CRGO_STEEL: "CRGO Steel",
  TRANSFORMER_OIL: "Transformer Oil",
  BUSHINGS: "Bushings",
  INSULATION: "Insulation",
  CORE_FRAME: "Core Frame",
  TAPPING_SWITCH: "Tapping Switch",
  COOLING_RADIATOR: "Cooling Radiator",
  PACKAGING: "Packaging",
  OTHER: "Other",
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PRODUCTION_MANAGER: "Production Manager",
  INVENTORY_MANAGER: "Inventory Manager",
  QUALITY_ENGINEER: "Quality Engineer",
  DISPATCH_STAFF: "Dispatch Staff",
}

export const TEST_TYPE_LABELS: Record<string, string> = {
  VOLTAGE_TEST: "Voltage Test",
  LOAD_TEST: "Load Test",
  TEMPERATURE_RISE: "Temperature Rise",
  INSULATION_RESISTANCE: "Insulation Resistance",
  TURNS_RATIO: "Turns Ratio",
  FINAL_QC: "Final QC",
}

export function getStageProgress(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number])
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100)
}

export function generateOrderNumber(): string {
  const prefix = "PO"
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${date}-${rand}`
}

export function generateInvoiceNumber(): string {
  const prefix = "INV"
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${date}-${rand}`
}
