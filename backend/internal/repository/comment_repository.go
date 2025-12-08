package repository

import (
	"github.com/google/uuid"
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type CommentRepository interface {
	Create(comment *models.Comment) error
	FindByPostID(postID string) ([]models.Comment, error)
	FindByID(id string) (*models.Comment, error)
	Update(comment *models.Comment) error
	Delete(id string) error
	CountByPostID(postID string) (int64, error)
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(comment *models.Comment) error {
	comment.ID = uuid.New().String()
	return r.db.Create(comment).Error
}

func (r *commentRepository) FindByPostID(postID string) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Preload("Author").Where("post_id = ?", postID).Order("created_at ASC").Find(&comments).Error
	return comments, err
}

func (r *commentRepository) FindByID(id string) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Preload("Author").Where("id = ?", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *commentRepository) Update(comment *models.Comment) error {
	return r.db.Save(comment).Error
}

func (r *commentRepository) Delete(id string) error {
	return r.db.Delete(&models.Comment{}, "id = ?", id).Error
}

func (r *commentRepository) CountByPostID(postID string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Comment{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}

