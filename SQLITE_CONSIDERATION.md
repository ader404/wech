# SQLite Migration Consideration for Retail CRM Desktop

## 1. Executive Summary

This document evaluates the architectural, operational, and development trade-offs of migrating the desktop database backend from **MySQL 8.0** to **SQLite (via Prisma)**.

The primary motivation for considering SQLite is **end-user simplicity**: eliminating MySQL as an external prerequisite would remove 80–90% of user onboarding friction and installation support tickets for desktop POS users.

---

## 2. Current State: MySQL Dependency

Currently, Retail CRM requires an external MySQL server instance running locally (`127.0.0.1:3306`) or over the local network:

- **User Burden:** The client must download MySQL Community Server / MySQL Installer, configure root credentials, start the Windows service, and resolve potential port collisions before Retail CRM can start.
- **Packaging Impact:** The Electron desktop installer cannot bundle a full MySQL server cleanly across Windows/macOS/Linux due to service daemon requirements and installer size constraints.
- **Support Overhead:** First-run wizard issues (wrong root passwords, unstarted MySQL services, firewall blocks, permission errors) account for the vast majority of installation roadblocks.

---

## 3. Advantages of SQLite (Pros)

| Advantage | Description |
| :--- | :--- |
| **Truly Self-Contained** | Zero external dependencies. SQLite engine is embedded directly within the Node.js/Prisma process runtime. |
| **Zero-Configuration Install** | No database creation wizard, no root passwords, no service daemons (`services.msc`), and no port binding issues. |
| **Atomic Single-File Backups** | Backing up or restoring the database is as simple as copying a single `.db` file (e.g., `%APPDATA%/retail-crm-desktop/retail_crm.db`), compared to running `mysqldump` and parsing SQL dumps. |
| **Portability & Recovery** | Moving data to a new computer requires just copying the database file to the new machine's data folder. |
| **Lower Resource Overhead** | SQLite operates in-process with almost no idle RAM usage, compared to MySQL which typically consumes 200MB–500MB idle RAM. |

---

## 4. Disadvantages & Limitations of SQLite (Cons)

| Disadvantage | Description & Mitigation |
| :--- | :--- |
| **Concurrency & Write Locks** | SQLite allows multiple readers but locks the database during writes. For a single-register desktop POS, this is negligible (<5ms per transaction). For multi-cashier setups hitting a shared file over SMB/NFS, SQLite is **not recommended**. |
| **Prisma Type Differences** | Prisma's SQLite connector does not natively support arbitrary-precision `@db.Decimal(10, 2)` or native database `ENUM` types. Prisma emulates enums with string columns and maps Decimals to floating-point or Decimal strings in JavaScript runtime. |
| **Data Migration Requirement** | Existing client installations using MySQL would require an automated or scripted migration utility to export data from MySQL into the SQLite file. |
| **No Remote Network Access** | A local SQLite file cannot be queried directly over TCP from secondary cashier terminals without the backend API serving as the intermediary layer. |

---

## 5. Current Schema Analysis & Feature Compatibility

An audit of `backend/prisma/schema.prisma` reveals that the current application schema uses mostly standard relational patterns with minimal MySQL-specific extensions:

### Schema Features & SQLite Mapping:

1. **Enums (`Role`, `SaleStatus`, `PaymentMethod`, `ExpenseCategory`, etc.):**
   - *MySQL:* Native MySQL `ENUM` types.
   - *SQLite:* Prisma automatically translates enum models into `TEXT` fields with Prisma-level runtime validation. No application code changes needed.

2. **Decimal Fields (`@db.Decimal(10, 2)`):**
   - *MySQL:* Stores native fixed-point decimals.
   - *SQLite:* Prisma maps `Decimal` types to `Float` or strings in SQLite while maintaining Prisma's `Prisma.Decimal` JS objects. Calculations in backend services remain precise.

3. **Text & String Annotations (`@db.Text`):**
   - *MySQL:* Requires `@db.Text` for strings larger than `VARCHAR(191)`.
   - *SQLite:* SQLite strings are dynamically sized; `@db.Text` attributes are simply ignored or mapped directly to `TEXT`.

4. **Product Images (`Bytes` in `ProductImage`):**
   - *MySQL:* Stores image buffers in `LONGBLOB`/`BLOB`.
   - *SQLite:* Stores buffers in SQLite `BLOB` columns directly.

5. **DateTime & Timestamps:**
   - *MySQL:* `DATETIME(3)`.
   - *SQLite:* Stored as ISO 8601 strings or millisecond integers, automatically parsed by Prisma.

---

## 6. Strategic Recommendation

> **Recommendation:**
> - **Desktop Single-Machine POS:** SQLite is the superior architectural choice. If customer feedback and support metrics show that MySQL installation is a significant hurdle, migrating the desktop application to SQLite is strongly recommended.
> - **Multi-Register / Server Deployments:** Keep the MySQL backend available for networked, multi-terminal, or cloud-hosted deployments where multiple clients connect to a central database server.

---

## 7. Step-by-Step Migration Roadmap

If deciding to migrate or support dual database providers:

### Step 1: Update Prisma Configuration
Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // e.g. "file:./dev.db" or "file:%APPDATA%/retail-crm-desktop/retail_crm.db"
}
```
Remove MySQL-specific attributes such as `@db.Decimal(10, 2)` and `@db.Text`.

### Step 2: Regenerate Prisma Client & Push
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Verify DateTime, Decimal, & Seed Data
- Run unit and integration tests to ensure monetary rounding and date queries (e.g. daily sales reports, `todaysSalesDetail`) behave identically.
- Execute seed data scripts to populate initial categories, settings, and super admin user.

### Step 4: Streamline Desktop App Setup
- Update Electron's `desktop-app/main.js` and `setup.html`:
  - Bypass the MySQL connection form entirely.
  - On first launch, automatically initialize the SQLite database file in `app.getPath('userData')/database.db`.
  - Prompt the user only for **Step 2 (Admin Account)** and **Step 3 (Store Details)**.

### Step 5: Data Migration Tool (For Existing MySQL Users)
- Provide a CLI utility (`node scripts/migrate-mysql-to-sqlite.js`) using `knex` or Prisma to read from existing MySQL tables and insert into the local SQLite file.
