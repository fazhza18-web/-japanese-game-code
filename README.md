# Typing Game Web Application

A web application for playing typing games, chatting, and sharing thoughts. Built with Frontend (Next.js) and Backend (Go).

## Project Structure

```
.
├── frontend/     # Next.js Frontend
└── backend/      # Go Backend API
```

## Running the Project

**Important:** You must run Backend and Frontend separately in two terminals.

**Note:** If you encounter "running scripts is disabled" error when running npm in PowerShell:
- **Option 1:** Use Command Prompt (cmd) instead of PowerShell
- **Option 2:** Fix execution policy by running this command in PowerShell (Run as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Terminal 1 - Backend

1. Navigate to the backend folder:
```powershell
cd backend
```

2. Install dependencies:
```powershell
go mod download
```

3. **Setup Database with Docker (Recommended):**

```powershell
cd backend
docker-compose up -d
```

This command will:
- Download and run MySQL 8.0
- Automatically create database `social_feed`
- Set credentials: root/rootpassword

**Check if Container is running:**
```powershell
docker ps
```

**View Logs:**
```powershell
docker-compose logs mysql
```

**Stop Docker:**
```powershell
docker-compose down
```

**Note:** The `.env` file is configured to work with Docker (root/rootpassword)

**Or use MySQL installed normally:**
- Create `.env` file in the backend folder and configure database
- Verify that MySQL Server is running
- Create database: `CREATE DATABASE social_feed;`

See more details in `backend/DOCKER_SETUP.md`

4. Run backend:
```powershell
go run cmd/main.go
```

Backend will run at **http://localhost:8080**

**Troubleshooting Connection Error:**
- **If using Docker:** Check that container is running (`docker ps`) and run `docker-compose up -d`
- **If using installed MySQL:** Check that MySQL Server is running
- Verify settings in `.env` file that Host, Port, Username, Password are correct
- See more details in `backend/DOCKER_SETUP.md` or `backend/SETUP.md`

### Terminal 2 - Frontend

1. Navigate to the frontend folder:
```cmd
cd frontend
```

2. Install dependencies:
```cmd
npm install
```

**Note:** If using PowerShell and encountering execution policy error, use Command Prompt (cmd) instead

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Run frontend:
```cmd
npm run dev
```

Frontend will run at **http://localhost:3000**

## Features

### Authentication & User Management
- ✅ User registration and login
- ✅ JWT Authentication
- ✅ User profile (view and edit information)
- ✅ View other users' profiles

### Posts & Comments
- ✅ Feed page (create posts, view posts, like)
- ✅ Post detail page
- ✅ Comment system (add, edit, delete)
- ✅ Edit history for posts and comments
- ✅ Show changes in Before/After format

### Social Features
- ✅ User search
- ✅ Friend system (send request, accept, reject, delete)
- ✅ Block/Unblock users
- ✅ Friends list and blocked users list
- ✅ Real-time chat system
- ✅ Show unread message count

### Games
- ✅ Typing game
- ✅ Score and time system
- ✅ Difficulty levels (easy/medium/hard)
- ✅ Real-time leaderboard
- ✅ Show personal best score

### UI/UX
- ✅ Material-UI Design
- ✅ Responsive Design
- ✅ Real-time Updates

## Technologies

### Frontend
- Next.js 15
- React 19
- Material-UI
- TypeScript
- Axios

### Backend
- Go 1.23
- Echo Framework
- GORM (MySQL)
- JWT Authentication
