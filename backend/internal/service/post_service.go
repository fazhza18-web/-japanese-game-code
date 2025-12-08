package service

import (
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
)

type PostService interface {
	CreatePost(content, authorID string) (*models.Post, error)
	GetAllPosts() ([]models.Post, error)
	GetPostByID(postID string) (*models.Post, error)
	GetPostsByUserID(userID string) ([]models.Post, error)
	UpdatePost(postID, userID, content string) (*models.Post, error)
	GetEditHistory(postID string) ([]models.EditHistory, error)
	DeletePost(postID, userID string) error
	ReactToPost(postID, userID, reaction string) error
	GetUserReaction(postID, userID string) (string, error)
	GetReactionsCount(postID string) (map[string]int64, error)
}

type postService struct {
	postRepo      repository.PostRepository
	userRepo      repository.UserRepository
	historyRepo   repository.EditHistoryRepository
}

func NewPostService(postRepo repository.PostRepository, userRepo repository.UserRepository, historyRepo repository.EditHistoryRepository) PostService {
	return &postService{
		postRepo:    postRepo,
		userRepo:    userRepo,
		historyRepo: historyRepo,
	}
}

func (s *postService) CreatePost(content, authorID string) (*models.Post, error) {
	// Verify user exists
	_, err := s.userRepo.FindByID(authorID)
	if err != nil {
		return nil, err
	}

	post := &models.Post{
		Content:  content,
		AuthorID: authorID,
		Likes:    0,
		Comments:  0,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, err
	}

	// Load author
	return s.postRepo.FindByID(post.ID)
}

func (s *postService) GetAllPosts() ([]models.Post, error) {
	return s.postRepo.FindAll()
}

func (s *postService) GetPostByID(postID string) (*models.Post, error) {
	return s.postRepo.FindByID(postID)
}

func (s *postService) GetPostsByUserID(userID string) ([]models.Post, error) {
	return s.postRepo.FindByAuthorID(userID)
}

func (s *postService) UpdatePost(postID, userID, content string) (*models.Post, error) {
	// Verify post exists and belongs to user
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, err
	}
	
	if post.AuthorID != userID {
		return nil, nil // Not authorized
	}
	
	// Save old content for history
	oldContent := post.Content
	
	// Update content
	post.Content = content
	if err := s.postRepo.Update(post); err != nil {
		return nil, err
	}
	
	// Save edit history
	history := models.NewEditHistory("post", postID, oldContent, content)
	if err := s.historyRepo.Create(history); err != nil {
		// Log error but don't fail the update
	}
	
	// Reload with author
	return s.postRepo.FindByID(postID)
}

func (s *postService) GetEditHistory(postID string) ([]models.EditHistory, error) {
	return s.historyRepo.FindByEntity("post", postID)
}

func (s *postService) DeletePost(postID, userID string) error {
	// Verify post exists and belongs to user
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return err
	}
	
	if post.AuthorID != userID {
		return nil // Not authorized, but don't reveal this
	}
	
	return s.postRepo.Delete(postID)
}

func (s *postService) ReactToPost(postID, userID, reaction string) error {
	// Validate reaction type
	validReactions := map[string]bool{
		"like":  true,
		"love":  true,
		"haha":  true,
		"wow":   true,
		"sad":   true,
		"angry": true,
	}
	if !validReactions[reaction] {
		return nil // Invalid reaction, ignore
	}

	return s.postRepo.ReactToPost(postID, userID, reaction)
}

func (s *postService) GetUserReaction(postID, userID string) (string, error) {
	return s.postRepo.GetUserReaction(postID, userID)
}

func (s *postService) GetReactionsCount(postID string) (map[string]int64, error) {
	return s.postRepo.GetReactionsCount(postID)
}

