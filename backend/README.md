# Typing Game API (Backend)

Backend API for Typing Game Web Application

## Technologies Used

- Go 1.23
- Echo Framework
- GORM (MySQL)
- JWT Authentication
- bcrypt for password hashing

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Create `.env` file:
```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=social_feed
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-secret-key-change-in-production
```

3. Create database:
```sql
CREATE DATABASE social_feed;
```

4. Run the application:
```bash
go run cmd/main.go
```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### User (Protected)
- `GET /api/user/me` - Get current user information
- `PUT /api/user/me` - Update user information
- `GET /api/user/:id` - Get other user information

### Posts (Protected)
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/Unlike post
- `GET /api/posts/:id/edit-history` - Get post edit history

### Comments (Protected)
- `POST /api/posts/:id/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `GET /api/comments/:id/edit-history` - Get comment edit history

### Friends (Protected)
- `GET /api/friends/search?q=query` - Search users
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `POST /api/friends/reject/:id` - Reject friend request
- `DELETE /api/friends/:id` - Delete friend
- `GET /api/friends/pending` - Get pending requests
- `GET /api/friends` - Get friends list
- `GET /api/friends/status/:id` - Check friend status
- `POST /api/friends/block/:id` - Block user
- `DELETE /api/friends/block/:id` - Unblock user
- `GET /api/friends/blocked` - Get blocked users list

### Messages (Protected)
- `GET /api/conversations` - Get conversations list
- `POST /api/conversations` - Create or find conversation
- `GET /api/conversations/:id/messages` - Get messages in conversation
- `POST /api/conversations/:id/messages` - Send message
- `POST /api/conversations/:id/read` - Mark as read

### Game (Protected)
- `POST /api/game/score` - Save game score
- `GET /api/game/leaderboard?difficulty=easy|hard` - Get leaderboard
- `GET /api/game/my-best` - Get personal best score
