package service

import (
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
)

type CommentService interface {
	CreateComment(content, postID, authorID string) (*models.Comment, error)
	GetCommentsByPostID(postID string) ([]models.Comment, error)
	UpdateComment(commentID, userID, content string) (*models.Comment, error)
	GetEditHistory(commentID string) ([]models.EditHistory, error)
	DeleteComment(commentID, userID string) error
	UpdatePostCommentsCount(postID string) error
}

type commentService struct {
	commentRepo repository.CommentRepository
	postRepo    repository.PostRepository
	userRepo    repository.UserRepository
	historyRepo repository.EditHistoryRepository
}

func NewCommentService(commentRepo repository.CommentRepository, postRepo repository.PostRepository, userRepo repository.UserRepository, historyRepo repository.EditHistoryRepository) CommentService {
	return &commentService{
		commentRepo: commentRepo,
		postRepo:    postRepo,
		userRepo:    userRepo,
		historyRepo: historyRepo,
	}
}

func (s *commentService) CreateComment(content, postID, authorID string) (*models.Comment, error) {
	// Verify post exists
	_, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, err
	}

	// Verify user exists
	_, err = s.userRepo.FindByID(authorID)
	if err != nil {
		return nil, err
	}

	comment := &models.Comment{
		Content:  content,
		PostID:   postID,
		AuthorID: authorID,
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	// Update post comments count
	if err := s.UpdatePostCommentsCount(postID); err != nil {
		// Log error but don't fail the request
	}

	// Reload comment with author
	comments, err := s.commentRepo.FindByPostID(postID)
	if err != nil {
		return nil, err
	}

	// Find the newly created comment
	for _, c := range comments {
		if c.ID == comment.ID {
			return &c, nil
		}
	}

	return comment, nil
}

func (s *commentService) GetCommentsByPostID(postID string) ([]models.Comment, error) {
	return s.commentRepo.FindByPostID(postID)
}

func (s *commentService) UpdateComment(commentID, userID, content string) (*models.Comment, error) {
	// Find comment by ID
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return nil, err // Comment not found
	}

	// Check if user is the author
	if comment.AuthorID != userID {
		return nil, nil // Not authorized
	}

	// Save old content for history
	oldContent := comment.Content

	// Update content
	comment.Content = content
	if err := s.commentRepo.Update(comment); err != nil {
		return nil, err
	}

	// Save edit history
	history := models.NewEditHistory("comment", commentID, oldContent, content)
	if err := s.historyRepo.Create(history); err != nil {
		// Log error but don't fail the update
	}

	// Reload with author
	return s.commentRepo.FindByID(commentID)
}

func (s *commentService) GetEditHistory(commentID string) ([]models.EditHistory, error) {
	return s.historyRepo.FindByEntity("comment", commentID)
}

func (s *commentService) DeleteComment(commentID, userID string) error {
	// Find comment by ID
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return nil // Comment not found
	}

	// Check if user is the author
	if comment.AuthorID != userID {
		return nil // Not authorized
	}

	postID := comment.PostID
	if err := s.commentRepo.Delete(commentID); err != nil {
		return err
	}

	// Update post comments count
	return s.UpdatePostCommentsCount(postID)
}

func (s *commentService) UpdatePostCommentsCount(postID string) error {
	count, err := s.commentRepo.CountByPostID(postID)
	if err != nil {
		return err
	}
	return s.postRepo.UpdateCommentsCount(postID, int(count))
}

