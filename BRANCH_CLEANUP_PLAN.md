# Frontend Branch Cleanup Plan

## Files with Branch References (16 files):

1. ✅ app/(app)/pos/page.tsx
2. ✅ app/(app)/products/page.tsx
3. ✅ app/(app)/settings/page.tsx
4. ✅ app/(app)/revenue/page.tsx
5. ✅ app/(app)/purchase-orders/[id]/page.tsx
6. ✅ app/(app)/profit/page.tsx
7. ✅ app/(app)/expenses/page.tsx
8. ✅ app/(app)/dashboard/page.tsx
9. ✅ app/(app)/reports/page.tsx
10. ✅ contexts/auth-context.tsx
11. ✅ components/receipt/po-receipt-content.tsx
12. ✅ app/(app)/products/bulk-purchase/page.tsx
13. ✅ app/(app)/cameras/page.tsx
14. ✅ app/(app)/employees/page.tsx
15. ✅ app/(app)/purchase-orders/new/page.tsx
16. ✅ components/receipt/receipt-content.tsx

## What to Remove/Change:

### 1. Sales Page (app/(app)/sales/page.tsx)
- Remove `branch: { name: string }` from Sale interface (line 25)
- Remove branch column from table header (line 83)
- Remove branch cell from table rows

### 2. POS Page
- Check for branch selectors
- Remove branch from sale creation

### 3. Other Pages
- Remove branch filters
- Remove branch columns from tables
- Update interfaces to remove branch references

## Priority:
1. **HIGH**: Sales & POS pages (customer-facing)
2. **MEDIUM**: Dashboard, Products, Expenses
3. **LOW**: Reports, Settings, other pages

Let's start with Sales and POS pages first!
