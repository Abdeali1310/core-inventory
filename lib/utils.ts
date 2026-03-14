import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function generateReference(prefix: string, count: number): string {
  const year = new Date().getFullYear()
  const paddedCount = String(count + 1).padStart(3, '0')
  return `${prefix}/${year}/${paddedCount}`
}

export function getStatusColor(
  status: string
): string {
  const colors: Record<string, string> = {
    // Receipt/Delivery/Transfer status
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    waiting: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    ready: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    done: 'bg-green-500/10 text-green-500 border-green-500/20',
    canceled: 'bg-red-500/10 text-red-500 border-red-500/20',
    // Adjustment status
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    // Stock status
    in_stock: 'bg-green-500/10 text-green-500 border-green-500/20',
    low_stock: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    out_of_stock: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
}

export function getMovementTypeColor(
  type: string
): string {
  const colors: Record<string, string> = {
    receipt: 'bg-green-500/10 text-green-500',
    delivery: 'bg-red-500/10 text-red-500',
    transfer_in: 'bg-blue-500/10 text-blue-500',
    transfer_out: 'bg-purple-500/10 text-purple-500',
    adjustment: 'bg-yellow-500/10 text-yellow-500',
  }
  return colors[type] || 'bg-gray-500/10 text-gray-500'
}

export function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) {
    return qty.toLocaleString()
  }
  return qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
