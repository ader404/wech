# Project Architecture Insight

## Executive Summary

This project is a prototype desktop retail CRM/POS system. The owner appears to want a client-installable desktop application, distributed as a Windows `.exe` and now also testable as a Linux AppImage, that gives a small retail business one local system for POS, inventory, sales, customer debt, supplier debt, loans, expenses, reporting, users, and receipt/shop settings.

The current architecture is not a pure native desktop app. It is a web application packaged inside Electron:

- Electron owns first-run setup, encrypted local configuration, and process orchestration.
- NestJS provides the local backend API.
- Next.js provides the user interface.
- Prisma maps the backend domain model to MySQL.
- MySQL remains an external requirement on the client machine.

That is a practical prototype architecture because it reuses a web stack while producing an installable desktop artifact. The main drawback is operational: the client still needs MySQL installed and running, and the app starts multiple local processes on fixed ports.

## What The Owner Wants

Based on the docs, scripts, UI, and schema, the expected product is:

- A retail-focused CRM/POS desktop app for small shops.
- A first-run setup wizard where the user enters MySQL credentials, creates the database/schema, and creates the first admin user.
- A distributable Windows installer for the client, with a Linux AppImage used for local testing.
- Local-first operation, not a hosted SaaS product.
- A single-shop workflow. Some older docs still mention multi-branch, but the active backend explicitly removed branch support.
- Multi-language support for Arabic, French, and English.
- Core retail workflows: dashboard, POS, products, inventory, customers, sales, expenses, loans, purchase orders, employees, suppliers, reports, and settings.

This is best presented to the client as a local desktop retail management prototype, not as a fully hardened enterprise accounting platform.

## High-Level Architecture

```text
Electron desktop shell
  |
  |-- setup.html + preload.js
  |     - first-run database setup
  |     - admin account creation
  |     - encrypted config storage
  |
  |-- starts local backend process
  |     NestJS API on 127.0.0.1:3001
  |     Prisma ORM
  |     MySQL database
  |
  |-- starts local frontend process
        Next.js standalone server on 127.0.0.1:3000
        React UI loaded in Electron BrowserWindow
```

The desktop app does not directly implement business screens. It launches the web frontend and backend locally, then opens the frontend in an Electron window.

## Repository Layout

- `desktop-app/`
  Electron shell, setup wizard, packaging configuration, Windows installer script, and Linux AppImage test scripts.

- `backend/`
  NestJS API server. Business logic is split into modules such as auth, users, products, inventory, customers, sales, expenses, suppliers, employees, reports, dashboard, notifications, audit, settings, loans, purchase orders, and setup.

- `frontend/`
  Next.js 14 application with React, Tailwind CSS, Radix UI components, translations, protected app layout, dashboard, POS, and management screens.

- `backend/prisma/schema.prisma`
  MySQL schema and domain model. This is the best single source of truth for the data shape.

- root Markdown files
  Many files are phase reports, fixes, and build notes from prototype development. They are useful as history, but not all of them are client-facing.

## Desktop Runtime

The Electron app has two modes:

- First run: if no encrypted config exists, it opens `setup.html`.
- Normal run: it decrypts saved config, starts backend and frontend, then opens the main CRM UI.

Important files:

- `desktop-app/main.js`
  Main Electron process. It stores config with `safeStorage`, tests MySQL, creates the database, runs Prisma schema push, creates the first admin, starts the backend, starts the frontend, and opens the window.

- `desktop-app/preload.js`
  Exposes a narrow IPC API to the setup page: test database, run migration, create admin, complete setup.

- `desktop-app/package.json`
  Uses `electron-builder`. The package includes Electron files plus built backend resources and Next.js standalone output.

The current packaging approach is correct for a desktop bundle because the installed app uses Electron's embedded Node runtime instead of requiring system Node or `npm install` on the client machine.

## Backend Architecture

The backend is a modular NestJS API:

- `AppModule` imports each business module.
- `PrismaService` owns the MySQL connection.
- Global validation uses Nest `ValidationPipe`.
- API routes are under `/api`.
- Swagger docs are exposed under `/api/docs`.
- Helmet is enabled, with HSTS disabled because the app is local HTTP.
- The server binds to `127.0.0.1` by default, which is appropriate for a desktop-local backend.

Authentication uses JWT plus server-side sessions:

- JWT secret comes from the Electron-generated config in packaged desktop mode.
- Passwords are hashed.
- Sessions, password history, failed login tracking, account lock fields, and audit logs exist in the schema.

The backend is feature-oriented rather than layered by technical concern. That is fine for the prototype and easy to navigate.

## Frontend Architecture

The frontend is a Next.js app using:

- App Router under `frontend/app`.
- Shared UI components under `frontend/components/ui`.
- Axios API client in `frontend/lib/api.ts`.
- React Query provider.
- Zustand stores for layout/privacy state.
- `next-intl` translation files for English, French, and Arabic.
- Tailwind CSS for styling.

The frontend calls the local backend through `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:3001/api`. In packaged mode Electron starts the frontend with that value set explicitly.

The visible product is an operational dashboard style app, not a marketing site. Navigation shows the intended scope clearly: dashboard, POS, products, customers, sales, expenses, loans, purchase orders, employees, suppliers, reports, and settings.

## Data Model

The Prisma schema models a single retail shop. Major entities include:

- `User`, `Session`, `PasswordHistory`, `AuditLog`
- `ShopSettings` and `Settings`
- `Product`, `ProductImage`, `Category`, `Brand`, `Inventory`
- `Customer`
- `Sale`, `SaleItem`, `Payment`
- `Expense`
- `Supplier`, `SupplierPayment`
- `PurchaseOrder`, `PurchaseOrderItem`
- `Loan`, `LoanPayment`

This supports both customer-side debt and supplier-side debt through sales, purchase orders, payments, and loans.

## Build And Distribution

Windows build:

- Build backend.
- Build frontend with `output: 'standalone'`.
- Package via `electron-builder --win --x64`.
- Output is expected under `desktop-app/dist/`.

Linux test build:

- `desktop-app/test-linux/build-linux.sh` builds the same packaged architecture as Windows.
- `desktop-app/test-linux/run-appimage.sh` helps test AppImage output.

Current important distribution limitation:

- MySQL is not bundled.
- Target machines need MySQL 5.7+ or compatible MySQL/MariaDB already installed and running.
- Users must know the MySQL credentials during first setup.

## Strengths

- Clear separation between desktop shell, API, frontend, and database.
- Local backend binds to `127.0.0.1`, reducing LAN exposure.
- Electron setup uses `contextIsolation` and a narrow preload bridge.
- Database credentials are encrypted with Electron `safeStorage`.
- Next.js standalone output is a good fit for packaging.
- Domain coverage is broad for a retail prototype.
- Arabic/French/English support is already considered.
- The data model includes audit logs, sessions, password history, and user roles.

## Drawbacks And Risks

1. MySQL is an external dependency.

   This is the largest handoff risk. A non-technical client may experience setup failure if MySQL is not installed, not running, bound only to a different host, using a forgotten password, or blocked by local policy.

2. Fixed local ports can conflict.

   The app expects frontend `3000` and backend `3001`. If another service uses either port, startup can fail or behave unpredictably.

3. Schema setup uses `prisma db push --accept-data-loss`.

   This is acceptable for a prototype or fresh local database, but risky for real client data. Once the client enters production-like data, schema changes should use versioned Prisma migrations and backup steps.

4. Electron is mostly a process launcher.

   The desktop app does not deeply integrate native desktop functionality. That is not wrong, but the client should understand this is a packaged local web app.

5. Linux AppImage sandbox tradeoff.

   The Linux package may need sandbox workarounds on some hosts because AppImage and Chromium sandbox support vary by distribution. Windows is the main client target, so this is mostly a test-platform issue unless Linux delivery becomes official.

6. Documentation is noisy.

   The repo contains many phase reports and fix notes. Some wording is stale, including older multi-branch references. Client-facing docs should be curated before delivery.

7. Security is prototype-grade, not deployment-hardened.

   The app has good local basics, but production hardening is incomplete: CORS allows any origin, Swagger is exposed, ports are fixed, and local HTTP is used. Localhost reduces risk but does not eliminate it.

8. Test coverage and release verification are unclear.

   There are scripts and troubleshooting docs, but no obvious mature end-to-end release checklist covering installer install, first-run setup, login, POS sale, inventory update, receipt, restart, and uninstall behavior.

9. Database backup and recovery are not productized.

   For a retail client, losing local MySQL data is a critical business risk. The app currently depends on the user or installer environment to manage backup.

10. Update strategy is not defined.

    There is no clear auto-update, migration, rollback, or support channel strategy for after the client receives the installer.

## Recommended Improvements Before Client Handoff

Highest priority:

- Create a clean client-facing installation guide focused only on Windows users.
- Add a preflight check screen or clear setup diagnostics for MySQL, ports `3000/3001`, and credentials.
- Replace `db push --accept-data-loss` with controlled migrations before any real client data is used.
- Add a backup/export workflow for the MySQL database.
- Hide or restrict Swagger docs in packaged production builds.
- Narrow CORS to the local frontend origin in production desktop mode.
- Add startup retry and health checks before opening the main window.
- Add clear logs accessible from the app or documented path.

Medium priority:

- Make backend/frontend ports configurable or auto-select available ports.
- Add a reset/reconfigure option in the UI instead of asking users to delete `config.enc`.
- Add a migration/upgrade checklist for future installer versions.
- Consolidate the many root Markdown files into a smaller docs set.
- Add branded icon, product name, company name, and license metadata before client delivery.
- Add a smoke-test script that verifies setup, login, and a minimal POS flow.

Longer-term:

- Consider bundling a managed database runtime, or move to SQLite if the app is truly single-machine and does not require MySQL-specific behavior.
- Add auto-update if the client expects ongoing releases.
- Add role/permission verification tests.
- Add data import/export tooling for onboarding existing shop inventory and customers.
- Add hardware integration validation for barcode scanners, receipt printers, and cash drawer workflows if those are in scope.

## Client Handoff Positioning

The honest positioning is:

> This is a desktop-packaged local retail CRM/POS prototype. It includes the application frontend and backend, runs locally on the user's machine, and stores business data in a local MySQL database configured during first run.

Avoid saying:

- It is fully self-contained, because MySQL is separate.
- It is production-hardened, because migration, backup, update, and support flows still need work.
- It is multi-branch, because the active app is single-shop.
- It has been validated on every client environment, because packaging and MySQL behavior depend on the target machine.

## Suggested Final Release Checklist

- Build clean Windows installer from a fresh dependency install.
- Install on a clean Windows test machine or VM.
- Confirm MySQL is installed and running before setup.
- Complete setup wizard with `127.0.0.1`, port `3306`, database name, username, and password.
- Confirm admin login works.
- Create a product and inventory quantity.
- Run a POS sale and confirm inventory decreases.
- Create a customer and test partial payment/debt behavior.
- Create a supplier and purchase order.
- Confirm dashboard/report totals update.
- Restart the desktop app and confirm it skips setup and loads normally.
- Confirm logs are available for troubleshooting.
- Confirm uninstall does not accidentally delete client data unless explicitly intended.
- Keep a database backup before any upgrade test.

