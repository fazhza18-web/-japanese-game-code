package repository

import (
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type EditHistoryRepository interface {
	Create(history *models.EditHistory) error
	FindByEntity(entityType, entityID string) ([]models.EditHistory, error)
}

type editHistoryRepository struct {
	db *gorm.DB
}

func NewEditHistoryRepository(db *gorm.DB) EditHistoryRepository {
	return &editHistoryRepository{db: db}
}

func (r *editHistoryRepository) Create(history *models.EditHistory) error {
	return r.db.Create(history).Error
}

func (r *editHistoryRepository) FindByEntity(entityType, entityID string) ([]models.EditHistory, error) {
	var histories []models.EditHistory
	err := r.db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at DESC").
		Find(&histories).Error
	return histories, err
}


