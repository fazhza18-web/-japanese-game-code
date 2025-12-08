# Quick Start Guide

## Fix PowerShell Execution Policy

If you encounter "running scripts is disabled" error when running npm:

**Option 1: Use Command Prompt (cmd) instead of PowerShell (Recommended)**
- Open Command Prompt instead of PowerShell
- Run npm commands normally

**Option 2: Fix Execution Policy**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Setup Database with Docker

**Option 1: Use Docker (Recommended - No MySQL installation required)**

```powershell
cd backend
docker-compose up -d
```

This command will automatically create MySQL and database.

**Check:**
```powershell
docker ps
```

**Stop Docker:**
```powershell
docker-compose down
```

**Option 2: Use Installed MySQL**

You need to install MySQL and create database yourself:
```sql
CREATE DATABASE social_feed;
```

## Run Project in 2 Terminals

### Terminal 1 - Backend

```powershell
cd backend
go mod download
go run cmd/main.go
```

**Note:** You must run Docker or MySQL Server first

### Terminal 2 - Frontend

**Use PowerShell or Command Prompt:**
```cmd
cd frontend
npm install
npm run dev
```

**Note:** If using PowerShell and encountering execution policy error, use Command Prompt instead

## Environment Variables Setup

### Backend - File `backend/.env` (auto-created)

**For Docker:**
```
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=social_feed
DB_USER=root
DB_PASSWORD=rootpassword
JWT_SECRET=your-secret-key-change-in-production
```

**For Installed MySQL:** Edit `DB_PASSWORD` to match your MySQL password

### Frontend - Create file `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Create Database

**If using Docker:** Database is created automatically, no action needed

**If using Installed MySQL:**
```sql
CREATE DATABASE social_feed;
```

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
