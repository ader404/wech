# Fix TypeScript Error - Regenerate Prisma Client

## The Issue
The Prisma client is out of sync with the schema changes. You updated the schema but didn't regenerate the Prisma client types.

## Solution - Run These Commands in Order

### Step 1: Stop the Backend Server
Press `Ctrl+C` to stop the running backend server.

### Step 2: Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

This regenerates the TypeScript types for the Prisma client based on your updated schema.

### Step 3: Create and Apply Migration
```bash
npx prisma migrate dev --name add_purchase_order_to_loan
```

This will:
- Create a migration file
- Apply it to your database
- Add the `purchaseOrderId` column to the `loans` table

### Step 4: Restart Backend
```bash
npm run start:dev
# OR
pnpm start:dev
```

## Complete Command Sequence

```bash
# 1. Stop the backend (Ctrl+C)

# 2. Navigate to backend folder
cd backend

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Create and run migration
npx prisma migrate dev --name add_purchase_order_to_loan

# 5. Start backend
npm run start:dev
```

## If Generation Fails (File Locked)

If you get an error like "EPERM: operation not permitted", do this:

1. **Close/Stop the backend completely** (make sure it's not running)
2. Wait 2-3 seconds
3. Try again: `npx prisma generate`

## Verify It Worked

After running the commands, you should see:
- ✅ No TypeScript errors
- ✅ Backend starts successfully
- ✅ "Convert Due to Loan" button works in the UI

That's it! The error will be fixed once Prisma generates the new types.
