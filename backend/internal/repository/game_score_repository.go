package repository

import (
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type GameScoreRepository interface {
	Create(score *models.GameScore) error
	GetTopScores(limit int) ([]models.GameScore, error)
	GetTopScoresByDifficulty(difficulty string, limit int) ([]models.GameScore, error)
	GetUserBestScore(userID string) (*models.GameScore, error)
	GetUserScores(userID string, limit int) ([]models.GameScore, error)
}

type gameScoreRepository struct {
	db *gorm.DB
}

func NewGameScoreRepository(db *gorm.DB) GameScoreRepository {
	return &gameScoreRepository{db: db}
}

func (r *gameScoreRepository) Create(score *models.GameScore) error {
	return r.db.Create(score).Error
}

func (r *gameScoreRepository) GetTopScores(limit int) ([]models.GameScore, error) {
	var scores []models.GameScore
	err := r.db.Preload("User").
		Order("score DESC, words_typed DESC").
		Limit(limit).
		Find(&scores).Error
	return scores, err
}

func (r *gameScoreRepository) GetTopScoresByDifficulty(difficulty string, limit int) ([]models.GameScore, error) {
	var scores []models.GameScore
	err := r.db.Preload("User").
		Where("difficulty = ?", difficulty).
		Order("score DESC, words_typed DESC").
		Limit(limit).
		Find(&scores).Error
	return scores, err
}

func (r *gameScoreRepository) GetUserBestScore(userID string) (*models.GameScore, error) {
	var score models.GameScore
	err := r.db.Preload("User").
		Where("user_id = ?", userID).
		Order("score DESC, words_typed DESC").
		First(&score).Error
	if err != nil {
		return nil, err
	}
	return &score, nil
}

func (r *gameScoreRepository) GetUserScores(userID string, limit int) ([]models.GameScore, error) {
	var scores []models.GameScore
	err := r.db.Preload("User").
		Where("user_id = ?", userID).
		Order("score DESC, words_typed DESC").
		Limit(limit).
		Find(&scores).Error
	return scores, err
}

