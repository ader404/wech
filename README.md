# Retail CRM Desktop

A comprehensive desktop CRM application for retail businesses with POS, inventory management, and customer tracking.

## Features

- 🛍️ **Point of Sale (POS)** - Fast checkout with barcode scanning
- 📦 **Inventory Management** - Track stock levels, categories, and suppliers
- 👥 **Customer Management** - Customer profiles, purchase history, and credit management
- 💰 **Sales & Loans** - Sales tracking with partial payment and loan conversion
- 📊 **Reports & Dashboard** - Real-time analytics and business insights
- 🌍 **Multi-language** - Arabic, English, and French support
- 💾 **MySQL Database** - Reliable local data storage

## Desktop App Setup

The application includes a **3-step setup wizard** for first-time installation:

### Step 1: Database Configuration
- Enter MySQL host, port, and credentials
- Database is created automatically if it doesn't exist
- Schema migrations run automatically

### Step 2: Admin Account
- Create your administrator account
- Set email, password, and preferred language

### Step 3: Launch
- Application starts automatically
- Access at http://localhost:3000

## Installation

### For Users (Windows)

1. Download `Retail CRM Setup.exe`
2. Run the installer
3. Follow the setup wizard
4. Launch the application

**Requirements:**
- Windows 10/11 (64-bit)
- MySQL 5.7+ installed and running
- 4GB RAM minimum

### For Developers

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/retail-crm-desktop.git
cd retail-crm-desktop

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install desktop app dependencies
cd ../desktop-app
npm install
```

## Development

### Testing the App

```bash
# Quick test (from project root)
TEST.bat

# Or manually:
cd desktop-app
npm start
```

### Building the Installer

```bash
# One-click build (from project root)
BUILD.bat

# Or manually:
cd backend
npm run build

cd ../frontend
npm run build

cd ../desktop-app
npm run dist:win
```

Output: `desktop-app/dist/Retail CRM Setup 1.0.0.exe`

## Project Structure

```
retail-crm-desktop/
├── backend/              # NestJS API server
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/             # Next.js web interface
│   ├── app/
│   ├── components/
│   └── package.json
├── desktop-app/          # Electron wrapper
│   ├── main.js           # Main process
│   ├── preload.js        # Bridge
│   ├── setup.html        # Setup wizard
│   └── package.json
├── BUILD.bat             # Build installer
├── TEST.bat              # Test in dev mode
└── README.md
```

## Technology Stack

- **Backend**: NestJS, Prisma, MySQL
- **Frontend**: Next.js 14, React, TailwindCSS, Radix UI
- **Desktop**: Electron, electron-builder
- **Authentication**: JWT (optional in desktop mode)
- **Database**: MySQL with Prisma ORM

## Configuration

### Environment Variables

The desktop app manages configuration automatically through the setup wizard. Configuration is stored encrypted at:

```
%APPDATA%\retail-crm-desktop\config.enc
```

To reconfigure, delete the config file and restart the app.

## Documentation

- [Quick Start](QUICK_START.md) - Get started quickly
- [Build Instructions](BUILD_INSTALLER.md) - Detailed build guide
- [User Guide](desktop-app/USER_GUIDE.md) - End-user documentation
- [Checklist](CHECKLIST.md) - Pre-build verification

## Security

- Credentials stored encrypted using Electron safeStorage
- MySQL password never stored in plain text
- Local-only backend (127.0.0.1 binding)
- JWT authentication (configurable)

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.

## Contributing

Contributions are welcome! Please open an issue or pull request.

---

Built with ❤️ for retail businesses
