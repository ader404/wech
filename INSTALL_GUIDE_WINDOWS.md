# Retail CRM — Windows Installation & User Guide

A complete guide for installing, configuring, and maintaining the Retail CRM Desktop application on Windows.

---

## 1. Prerequisites

Before installing the application, ensure your system meets the following requirements:

- **Operating System:** Windows 10 or later (64-bit)
- **Database:** MySQL 8.0 or higher installed and running
  - [Download MySQL Installer for Windows](https://dev.mysql.com/downloads/installer/)
- **MySQL Credentials:** Have your MySQL root username and password ready.
- **Network Ports:** Ports `3000` and `3001` should ideally be available (the application will automatically select alternative ports in the range 3000–3020 if conflicts exist).

---

## 2. Installation Steps

### Step 1: Download & Run the Installer
1. Download the installer file (`Retail CRM Setup <version>.exe`) from your release or distribution link.
2. Double-click the installer to launch setup.
3. Select the installation directory (the default path `C:\Users\<YourUser>\AppData\Local\Programs\retail-crm-desktop` is recommended).
4. Click **Install** and wait for the wizard to finish.

### Step 2: Launch the Application
- Launch **Retail CRM** from your Desktop shortcut or Start Menu.

### Step 3: First-Run Setup Wizard
On initial launch, a setup wizard appears to configure your database and create your administrator account:

1. **Step 1 — MySQL Database Configuration:**
   - **Host:** `127.0.0.1` (or `localhost`)
   - **Port:** `3306` (default MySQL port)
   - **Database Name:** `retail_crm_desktop` (will be created automatically if it does not exist)
   - **Username:** `root` (or your dedicated MySQL user)
   - **Password:** Your MySQL password
   - Click **"Test & Continue"** — The setup connects to MySQL, initializes the database, and executes database migrations automatically.

2. **Step 2 — Admin Account Setup:**
   - **Full Name:** Your name (e.g., `Shop Administrator`)
   - **Email:** Your email address (used for login)
   - **Password:** A secure password (minimum 8 characters)
   - **Language:** Select your preferred language (English, Arabic, or French)
   - Click **"Create & Continue"**.

3. **Step 3 — Launch:**
   - Click **"Launch Application"**. The system initializes backend services and opens the application interface.

### Step 4: Login
- Enter the admin email and password created during setup to access your POS and CRM dashboard.

---

## 3. Daily Usage

1. Launch **Retail CRM** from the Desktop shortcut or Start Menu.
2. The application automatically starts the local database connector and interface.
3. Log in with your admin or staff credentials.
4. When finished, close the window. Background processes terminate cleanly upon exit.

---

## 4. Backup & Restore

Protect your business data with regular database backups.

### In-App Backup & Restore
- **Backup:** In the application menu, navigate to **File > Backup Database**.
- **Restore:** In the application menu, navigate to **File > Restore Database** and select a previous backup snapshot.
- **Default Storage Location:** Backups are saved to:
  ```text
  %USERPROFILE%\Documents\RetailCRM-Backups\
  ```

### Manual Backup (Command Prompt)
Open Windows Command Prompt (`cmd.exe`) and run:
```cmd
mysqldump -u root -p retail_crm_desktop > "%USERPROFILE%\Documents\RetailCRM-Backups\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql"
```

### Manual Restore (Command Prompt)
```cmd
mysql -u root -p retail_crm_desktop < "C:\Path\To\Your\backup.sql"
```

---

## 5. Troubleshooting

### MySQL Service Not Running
- **Symptom:** Setup or startup reports `"Cannot connect to MySQL"` or `"ECONNREFUSED"`.
- **Solution:**
  1. Press `Win + R`, type `services.msc`, and press **Enter**.
  2. Locate **MySQL80** (or your MySQL service name).
  3. Right-click and choose **Start** (or **Restart**).
  4. Ensure its Startup Type is set to **Automatic**.

### Port Conflicts
- **Symptom:** Notifications about ports 3000/3001 being busy.
- **Solution:** Retail CRM automatically attempts to bind to available ports between 3000 and 3020. If an issue occurs, close other applications using these ports or restart your PC.

### Login Failures
- Verify caps lock and ensure you are using the exact email created in the setup wizard.
- If the admin password is lost, you can reset the configuration and recreate the admin account.

### Application Logs
For detailed diagnostics and error reporting, logs are stored locally at:
```text
%APPDATA%\retail-crm-desktop\logs\desktop.log
```
*(You can paste this path into File Explorer's address bar to view the log).*

### Reset Configuration
To re-run the setup wizard with fresh database settings:
1. Inside the application: Go to **Settings > Reset Configuration**.
2. Or manually: Press `Win + R`, type `%APPDATA%\retail-crm-desktop`, and delete `config.enc`.
3. Relaunch the application to start the setup wizard again.

---

## 6. Uninstallation

1. Open **Windows Settings > Apps > Installed apps** (or **Apps & features**).
2. Locate **Retail CRM** in the list and click **Uninstall**.
3. Follow the on-screen uninstaller prompt.

> **Note on Data Preservation:**
> Uninstalling the application removes the desktop program files but does **NOT** delete your MySQL database or sales records.
> If you wish to completely wipe all business data, open MySQL Command Line or MySQL Workbench and run:
> ```sql
> DROP DATABASE retail_crm_desktop;
> ```
