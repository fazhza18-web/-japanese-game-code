package repository

import (
	"github.com/google/uuid"
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type PostRepository interface {
	Create(post *models.Post) error
	FindAll() ([]models.Post, error)
	FindByID(id string) (*models.Post, error)
	FindByAuthorID(authorID string) ([]models.Post, error)
	Update(post *models.Post) error
	Delete(id string) error
	ReactToPost(postID, userID, reaction string) error
	GetUserReaction(postID, userID string) (string, error)
	GetReactionsCount(postID string) (map[string]int64, error)
	UpdateLikesCount(postID string) error
	UpdateCommentsCount(postID string, count int) error
}

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) Create(post *models.Post) error {
	post.ID = uuid.New().String()
	return r.db.Create(post).Error
}

func (r *postRepository) FindAll() ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Order("created_at DESC").Find(&posts).Error
	return posts, err
}

func (r *postRepository) FindByID(id string) (*models.Post, error) {
	var post models.Post
	err := r.db.Preload("Author").Where("id = ?", id).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *postRepository) FindByAuthorID(authorID string) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Where("author_id = ?", authorID).Order("created_at DESC").Find(&posts).Error
	return posts, err
}

func (r *postRepository) Update(post *models.Post) error {
	return r.db.Save(post).Error
}

func (r *postRepository) Delete(id string) error {
	return r.db.Delete(&models.Post{}, "id = ?", id).Error
}

func (r *postRepository) ReactToPost(postID, userID, reaction string) error {
	var existing models.PostReaction
	err := r.db.Where("post_id = ? AND user_id = ?", postID, userID).First(&existing).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new reaction
		newReaction := models.PostReaction{
			ID:       uuid.New().String(),
			PostID:   postID,
			UserID:   userID,
			Reaction: reaction,
		}
		return r.db.Create(&newReaction).Error
	} else if err == nil {
		// Update existing reaction
		if existing.Reaction == reaction {
			// Same reaction, remove it (unlike)
			return r.db.Delete(&existing).Error
		} else {
			// Different reaction, update it
			existing.Reaction = reaction
			return r.db.Save(&existing).Error
		}
	}
	return err
}

func (r *postRepository) GetUserReaction(postID, userID string) (string, error) {
	var reaction models.PostReaction
	err := r.db.Where("post_id = ? AND user_id = ?", postID, userID).First(&reaction).Error
	if err == gorm.ErrRecordNotFound {
		return "", nil // No reaction
	}
	if err != nil {
		return "", err
	}
	return reaction.Reaction, nil
}

func (r *postRepository) GetReactionsCount(postID string) (map[string]int64, error) {
	var reactions []models.PostReaction
	err := r.db.Where("post_id = ?", postID).Find(&reactions).Error
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range reactions {
		counts[r.Reaction]++
	}
	return counts, nil
}

func (r *postRepository) UpdateLikesCount(postID string) error {
	var count int64
	r.db.Model(&models.PostReaction{}).Where("post_id = ?", postID).Count(&count)
	return r.db.Model(&models.Post{}).Where("id = ?", postID).Update("likes", count).Error
}

func (r *postRepository) UpdateCommentsCount(postID string, count int) error {
	return r.db.Model(&models.Post{}).Where("id = ?", postID).Update("comments", count).Error
}

