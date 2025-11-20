# Pharmacy Management System - Local Setup Guide

This guide will help you set up and run the Pharmacy Management System locally on your computer, similar to how you would set up a XAMPP application.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Verify npm: `npm --version`

2. **A modern web browser** (Chrome, Firefox, Edge, or Safari)

## 🚀 Quick Start

### Step 1: Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all required packages (takes about 1-2 minutes).

### Step 2: Start the Development Server

Run the following command:

```bash
npm run dev
```

You should see output like:
```
VITE v5.4.10  ready in 926 ms

➜  Local:   http://localhost:8080/
➜  Network: http://192.168.x.x:8080/
```

### Step 3: Open in Browser

Open your web browser and navigate to:
```
http://localhost:8080
```

## 🎯 First Time Setup

### Creating Your Account

1. When you first open the app, you'll see a login page
2. Click on the **"Sign Up"** tab
3. Fill in your details:
   - First Name
   - Last Name (optional)
   - Email
   - Password (minimum 6 characters)
4. Click **"Sign Up"** to create your account
5. You'll be automatically signed in and redirected to the dashboard

### Initial Configuration

After signing in:

1. Go to **Settings** (click the Settings tab)
2. Configure your pharmacy information:
   - Pharmacy Name
   - Owner Name
   - Phone Number
   - Currency (default: PKR)
   - Tax Rate (if applicable)
3. Save your settings

## 📁 How It Works (Local Storage)

This application uses **local storage** in your browser, which means:

- ✅ **No server required** - Everything runs in your browser
- ✅ **No database setup needed** - Data is stored in IndexedDB (browser database)
- ✅ **Works offline** - Once loaded, you can use it without internet
- ✅ **Private** - All data stays on your computer

### Data Storage Locations

- **User accounts**: Stored in browser's localStorage
- **Products, Sales, Customers**: Stored in IndexedDB (browser database)
- **Settings**: Stored in localStorage

### Important Notes

- Data is stored locally in your browser
- If you clear browser data, you'll lose all information
- Each browser profile has separate data
- To backup data, use the export feature in Settings (if available)

## 🛠️ Available Commands

### Development Mode
```bash
npm run dev
```
Starts the development server at `http://localhost:8080`

### Build for Production
```bash
npm run build
```
Creates an optimized production build in the `dist` folder

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally

### Lint Code
```bash
npm run lint
```
Check for code errors and warnings

## 🔧 Troubleshooting

### Problem: "Nothing shows" or blank page

**Solution:**
1. Make sure dependencies are installed: `npm install`
2. Check the terminal for errors
3. Clear browser cache and reload
4. Check browser console (F12) for errors

### Problem: Port 8080 is already in use

**Solution:**
1. Stop the other application using port 8080, OR
2. Change the port in `vite.config.ts`:
   ```typescript
   server: {
     port: 3000, // Change to any available port
   }
   ```

### Problem: "Cannot find module" errors

**Solution:**
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

### Problem: Data disappeared

**Solution:**
- Check if you're using the same browser and profile
- Data is stored per browser profile
- If you cleared browser data, it's gone (no server backup)

## 📦 Project Structure

```
app/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── lib/              # Core libraries (auth, database)
│   ├── pages/            # Page components
│   └── utils/            # Utility functions
├── public/               # Static files
├── database.txt          # Database schema documentation
├── package.json          # Dependencies
└── vite.config.ts        # Vite configuration
```

## 🌐 Network Access

The app runs on `localhost:8080` by default. To access it from other devices on your network:

1. Find your computer's IP address
2. Use the Network URL shown in terminal (e.g., `http://192.168.x.x:8080`)
3. Make sure your firewall allows connections on port 8080

## 🔒 Security Notes

- Passwords are stored in plain text (for local use only)
- For production use, implement proper password hashing
- All data is stored locally - no external servers involved
- No data is sent to external services (except optional AI features)

## 📝 Features

- ✅ Product Management
- ✅ Sales Processing
- ✅ Customer Management
- ✅ Inventory Tracking
- ✅ Reports & Analytics
- ✅ Local Storage (no server needed)
- ✅ Offline Support

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console (F12 → Console tab)
2. Check terminal for error messages
3. Verify Node.js version: `node --version` (should be 18+)
4. Try clearing browser cache and reloading

## 🎉 You're All Set!

The application is now running locally. You can:
- Add products to your inventory
- Process sales
- Manage customers
- View reports
- All without needing a server or database setup!

---

**Note:** This is a local application. Unlike XAMPP (which runs PHP/MySQL), this is a modern JavaScript application that runs entirely in your browser. No Apache, MySQL, or PHP configuration needed!

