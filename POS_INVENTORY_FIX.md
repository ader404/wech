# ✅ POS Inventory Fix

## Issue:
Frontend expected `inventory` as an array: `inventory: { quantity: number }[]`
Backend returns it as a single object: `inventory: { quantity: number }`

## Schema (backend):
```prisma
model Inventory {
  productId String @unique  // One inventory per product
  quantity  Int
}
```

## Fix Applied:
Updated Product interface and stockForBranch function to handle single inventory object:

```typescript
interface Product {
  inventory?: { quantity: number } | null  // Single object, not array
}

function stockForBranch(p: Product) {
  return p.inventory?.quantity ?? 0  // Direct access, no reduce
}
```

Now POS should work without the "reduce is not a function" error!
