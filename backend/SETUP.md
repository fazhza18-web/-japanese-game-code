# Backend Setup Guide

## Setup Steps

### 1. Create .env File

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Or create a new `.env` file with the following content:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=social_feed
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-secret-key-change-in-production
```

**Note:** Edit `DB_PASSWORD` to match your MySQL password

### 2. Verify MySQL Server is Running

**Windows:**
- Open Services (Press `Win + R` → Type `services.msc`)
- Find "MySQL" or "MySQL80"
- Verify that Status is "Running"
- If not running, right-click → Start

**Or use Command Prompt:**
```cmd
net start MySQL80
```

### 3. Create Database

Connect to MySQL and create database:

```sql
CREATE DATABASE social_feed;
```

**How to connect to MySQL:**
```cmd
mysql -u root -p
```

Or use MySQL Workbench, phpMyAdmin, or other tools

### 4. Run Backend

```powershell
go mod download
go run cmd/main.go
```

## Troubleshooting Connection Error

If you encounter "No connection could be made" error:

1. **Verify MySQL Server is running** (see step 2)
2. **Check settings in .env file** that Host, Port, Username, Password are correct
3. **Verify database is created** (see step 3)
4. **Check Firewall** to ensure port 3306 is allowed

## URLs

- Backend API: http://localhost:8080
