package handler

import (
	"github.com/labstack/echo/v4"
	"typinggame-api/internal/middleware"
)

type Handlers struct {
	AuthHandler    *AuthHandler
	UserHandler    *UserHandler
	PostHandler    *PostHandler
	CommentHandler *CommentHandler
	GameHandler    *GameHandler
	FriendHandler  *FriendHandler
	MessageHandler *MessageHandler
}

func InitializeRoutes(e *echo.Echo, h *Handlers) {
	api := e.Group("/api")
	api.POST("/auth/register", h.AuthHandler.Register)
	api.POST("/auth/login", h.AuthHandler.Login)

	protected := api.Group("", middleware.AuthMiddleware())
	protected.GET("/user/me", h.UserHandler.GetMe)
	protected.PUT("/user/me", h.UserHandler.UpdateMe)
	protected.GET("/user/:id", h.UserHandler.GetUser)
	protected.GET("/posts", h.PostHandler.GetAllPosts)
	protected.POST("/posts", h.PostHandler.CreatePost)
	protected.GET("/posts/my", h.PostHandler.GetMyPosts)
	protected.GET("/posts/user/:id", h.PostHandler.GetUserPosts)
	protected.GET("/posts/:id", h.PostHandler.GetPost)
	protected.PUT("/posts/:id", h.PostHandler.UpdatePost)
	protected.GET("/posts/:id/history", h.PostHandler.GetEditHistory)
	protected.DELETE("/posts/:id", h.PostHandler.DeletePost)
	protected.GET("/posts/:id/comments", h.CommentHandler.GetComments)
	protected.POST("/posts/:id/comments", h.CommentHandler.CreateComment)
	protected.GET("/posts/:id/reactions", h.PostHandler.GetReactions)
	protected.POST("/posts/:id/reactions", h.PostHandler.ReactToPost)
	protected.PUT("/comments/:commentId", h.CommentHandler.UpdateComment)
	protected.GET("/comments/:commentId/history", h.CommentHandler.GetEditHistory)
	protected.DELETE("/comments/:commentId", h.CommentHandler.DeleteComment)
	
	protected.POST("/game/scores", h.GameHandler.SaveScore)
	protected.GET("/game/leaderboard", h.GameHandler.GetTopScores)
	protected.GET("/game/leaderboard/:difficulty", h.GameHandler.GetTopScoresByDifficulty)
	protected.GET("/game/my-best", h.GameHandler.GetUserBestScore)
	
	protected.GET("/users/search", h.FriendHandler.SearchUsers)
	protected.POST("/friends/:id", h.FriendHandler.SendFriendRequest)
	protected.POST("/friends/accept/:id", h.FriendHandler.AcceptFriendRequest)
	protected.POST("/friends/reject/:id", h.FriendHandler.RejectFriendRequest)
	protected.DELETE("/friends/:id", h.FriendHandler.DeleteFriend)
	protected.GET("/friends/pending", h.FriendHandler.GetPendingRequests)
	protected.GET("/friends", h.FriendHandler.GetFriends)
	protected.GET("/friends/status/:id", h.FriendHandler.GetFriendStatus)
	protected.POST("/friends/block/:id", h.FriendHandler.BlockUser)
	protected.POST("/friends/unblock/:id", h.FriendHandler.UnblockUser)
	protected.GET("/friends/blocked", h.FriendHandler.GetBlockedUsers)
	
	protected.GET("/conversations", h.MessageHandler.GetConversations)
	protected.POST("/conversations/start/:id", h.MessageHandler.StartConversation)
	protected.GET("/conversations/:id/messages", h.MessageHandler.GetMessages)
	protected.POST("/conversations/:id/messages", h.MessageHandler.SendMessage)
	protected.POST("/conversations/:id/read", h.MessageHandler.MarkAsRead)
}

