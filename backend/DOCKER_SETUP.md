# Docker Setup Guide

## How to Run MySQL with Docker

### 1. Start Docker Container

```powershell
cd backend
docker-compose up -d
```

This command will:
- Download MySQL 8.0 image (if not already available)
- Create container named `social-feed-mysql`
- Automatically create database `social_feed`
- Open port 3306

### 2. Verify Container is Running

```powershell
docker ps
```

You should see container `social-feed-mysql` with status "Up"

### 3. Check Logs

```powershell
docker-compose logs mysql
```

### 4. Stop Docker Container

```powershell
docker-compose down
```

### 5. Stop and Remove Data (Volume)

```powershell
docker-compose down -v
```

**Warning:** This command will delete all data in the database!

## Configuration

### Database Credentials

- **Host:** localhost
- **Port:** 3306
- **Database:** social_feed
- **Username:** root
- **Password:** rootpassword

### .env File

The `.env` file is configured to work with Docker:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=social_feed
DB_USER=root
DB_PASSWORD=rootpassword
```

## Troubleshooting

### Container Not Running

```powershell
# Check logs
docker-compose logs mysql

# Restart
docker-compose restart
```

### Port 3306 Already in Use

If port 3306 is already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Change to another port
```

And update `.env`:
```
DB_PORT=3307
```

### Connect to Database from External

```powershell
# Using MySQL Client
mysql -h localhost -P 3306 -u root -prootpassword social_feed

# Or using MySQL Workbench
Host: localhost
Port: 3306
Username: root
Password: rootpassword
```
