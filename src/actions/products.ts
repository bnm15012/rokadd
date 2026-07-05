'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser, requirePermission } from '@/lib/permissions'
import { tenantPrisma } from '@/lib/prisma'
import type { ActionState } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

async function getShopId(): Promise<number> {
  const user = await getSessionUser()
  const shopId = user.shopMembers[0]?.shopId
  if (!shopId) throw new Error('No shop found for this user')
  return shopId
}

/** Parse a plain integer field (e.g. pieces, threshold) */
function parseIntField(
  formData: FormData,
  field: string
): number | null {
  const raw = formData.get(field)
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n) : null
}

/** Parse a rupee price field and convert to paise (×100, rounded) */
function parsePriceField(
  formData: FormData,
  field: string
): number | null {
  const raw = formData.get(field)
  if (raw === null || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

// ─── createProduct ──────────────────────────────────────────────────────────

export async function createProduct(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId()
    await requirePermission(shopId, 'canManageProducts')

    // Required fields
    const name = (formData.get('name') as string | null)?.trim()
    if (!name) return { success: false, error: 'Product name is required' }

    const piecesPerCarton = parseIntField(formData, 'piecesPerCarton')
    if (piecesPerCarton === null || piecesPerCarton < 1)
      return { success: false, error: 'Pieces per carton must be a positive integer' }

    // Prices come in as rupees (decimal); convert to paise (×100)
    const costPricePaise = parsePriceField(formData, 'costPricePerCarton')
    if (costPricePaise === null)
      return { success: false, error: 'Cost price per carton is required' }

    const sellingPriceCartonPaise = parsePriceField(formData, 'sellingPricePerCarton')
    if (sellingPriceCartonPaise === null)
      return { success: false, error: 'Selling price per carton is required' }

    const sellingPricePiecePaise = parsePriceField(formData, 'sellingPricePerPiece')
    if (sellingPricePiecePaise === null)
      return { success: false, error: 'Selling price per piece is required' }

    const lowStockThreshold = parseIntField(formData, 'lowStockThreshold') ?? 0

    // Optional fields
    const sku = (formData.get('sku') as string | null)?.trim() || null
    const rawCat = (formData.get('categoryId') as string | null)?.trim()
    const categoryId = rawCat ? parseInt(rawCat, 10) : null

    const db = tenantPrisma(shopId)

    // tenantPrisma automatically injects shopId on create.
    // We cast to `any` for the data object because TS can't see the
    // Prisma extension adding shopId at runtime.
    const product = await db.product.create({
      data: {
        name,
        sku,
        ...(categoryId !== null ? { categoryId } : {}),
        piecesPerCarton,
        costPricePerCarton: costPricePaise,
        sellingPricePerCarton: sellingPriceCartonPaise,
        sellingPricePerPiece: sellingPricePiecePaise,
        lowStockThreshold,
        currentStockPieces: 0,
        isActive: true,
      } as any,
    })

    revalidatePath('/dashboard/products')
    return { success: true, data: { id: product.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product'
    return { success: false, error: message }
  }
}

// ─── updateProduct ──────────────────────────────────────────────────────────

export async function updateProduct(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId()
    await requirePermission(shopId, 'canManageProducts')

    const productId = parseInt(formData.get('productId') as string, 10)
    if (isNaN(productId)) return { success: false, error: 'Product ID is required' }

    const name = (formData.get('name') as string | null)?.trim()
    if (!name) return { success: false, error: 'Product name is required' }

    const piecesPerCarton = parseIntField(formData, 'piecesPerCarton')
    if (piecesPerCarton === null || piecesPerCarton < 1)
      return { success: false, error: 'Pieces per carton must be a positive integer' }

    // Prices come in as rupees (decimal); convert to paise (×100)
    const costPricePaise = parsePriceField(formData, 'costPricePerCarton')
    if (costPricePaise === null)
      return { success: false, error: 'Cost price per carton is required' }

    const sellingPriceCartonPaise = parsePriceField(formData, 'sellingPricePerCarton')
    if (sellingPriceCartonPaise === null)
      return { success: false, error: 'Selling price per carton is required' }

    const sellingPricePiecePaise = parsePriceField(formData, 'sellingPricePerPiece')
    if (sellingPricePiecePaise === null)
      return { success: false, error: 'Selling price per piece is required' }

    const lowStockThreshold = parseIntField(formData, 'lowStockThreshold') ?? 0

    const sku = (formData.get('sku') as string | null)?.trim() || null
    const rawCatUpdate = (formData.get('categoryId') as string | null)?.trim()
    const categoryId = rawCatUpdate ? parseInt(rawCatUpdate, 10) : null

    const db = tenantPrisma(shopId)

    await db.product.update({
      where: { id: productId },
      data: {
        name,
        sku,
        categoryId: categoryId !== null ? categoryId : null,
        piecesPerCarton,
        costPricePerCarton: costPricePaise,
        sellingPricePerCarton: sellingPriceCartonPaise,
        sellingPricePerPiece: sellingPricePiecePaise,
        lowStockThreshold,
      },
    })

    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product'
    return { success: false, error: message }
  }
}

// ─── deleteProduct ──────────────────────────────────────────────────────────

export async function deleteProduct(productId: number): Promise<ActionState> {
  try {
    const shopId = await getShopId()
    await requirePermission(shopId, 'canManageProducts')

    const db = tenantPrisma(shopId)
    await db.product.update({
      where: { id: productId },
      data: { isActive: false },
    })

    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    return { success: false, error: message }
  }
}

// ─── createCategory ─────────────────────────────────────────────────────────

export async function createCategory(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId()
    await requirePermission(shopId, 'canManageProducts')

    const name = (formData.get('name') as string | null)?.trim()
    if (!name) return { success: false, error: 'Category name is required' }

    const db = tenantPrisma(shopId)
    // tenantPrisma injects shopId at runtime; cast data as any
    const category = await db.category.create({
      data: { name } as any,
    })

    revalidatePath('/dashboard/products')
    return { success: true, data: { id: category.id, name: category.name } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create category'
    return { success: false, error: message }
  }
}
