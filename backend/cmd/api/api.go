package api

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"typinggame-api/config"
	"typinggame-api/internal/driver"
	"typinggame-api/internal/handler"
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
	"typinggame-api/internal/service"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func StartServer() {
	if err := config.LoadConfig(); err != nil {
		panic(err)
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	logger.Info("Initializing database connection...")
	db := driver.NewDatabase()

	logger.Info("Running database migrations...")
	if err := autoMigrate(db); err != nil {
		logger.Fatal("Failed to migrate database", zap.Error(err))
	}
	logger.Info("Database migrations completed successfully")
	userRepo := repository.NewUserRepository(db)
	postRepo := repository.NewPostRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	historyRepo := repository.NewEditHistoryRepository(db)
	gameScoreRepo := repository.NewGameScoreRepository(db)
	friendRepo := repository.NewFriendRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	authService := service.NewAuthService(userRepo)
	postService := service.NewPostService(postRepo, userRepo, historyRepo)
	commentService := service.NewCommentService(commentRepo, postRepo, userRepo, historyRepo)
	gameService := service.NewGameService(gameScoreRepo)
	friendService := service.NewFriendService(friendRepo)
	messageService := service.NewMessageService(messageRepo, friendRepo)
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userRepo)
	postHandler := handler.NewPostHandler(postService)
	commentHandler := handler.NewCommentHandler(commentService)
	gameHandler := handler.NewGameHandler(gameService)
	friendHandler := handler.NewFriendHandler(friendService)
	messageHandler := handler.NewMessageHandler(messageService)

	handlers := &handler.Handlers{
		AuthHandler:    authHandler,
		UserHandler:    userHandler,
		PostHandler:    postHandler,
		CommentHandler: commentHandler,
		GameHandler:    gameHandler,
		FriendHandler:  friendHandler,
		MessageHandler: messageHandler,
	}

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{echo.GET, echo.HEAD, echo.PUT, echo.PATCH, echo.POST, echo.DELETE},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	handler.InitializeRoutes(e, handlers)

	port := ":" + config.Get().Server.Port
	hs := &http.Server{
		Addr:    port,
		Handler: e,
	}

	shutdownChan := make(chan bool, 1)

	go func() {
		logger.Info("Start serving at " + port)
		if err := hs.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("HTTP server error", zap.Error(err))
		}
		logger.Info("Stopped serving new connections.")
		shutdownChan <- true
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	shutdownCtx, shutdownRelease := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownRelease()

	if err := hs.Shutdown(shutdownCtx); err != nil {
		logger.Fatal("HTTP shutdown error", zap.Error(err))
	}

	<-shutdownChan
	logger.Info("Graceful shutdown complete.")
}

func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Post{},
		&models.PostReaction{},
		&models.Comment{},
		&models.EditHistory{},
		&models.GameScore{},
		&models.FriendRequest{},
		&models.BlockedUser{},
		&models.Conversation{},
		&models.Message{},
	)
}
