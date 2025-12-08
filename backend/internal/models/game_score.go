package models

import (
	"time"

	"github.com/google/uuid"
)

type GameScore struct {
	ID         string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID     string    `gorm:"type:varchar(36);not null;index" json:"userId"`
	User       User      `gorm:"foreignKey:UserID" json:"user"`
	Score      int       `gorm:"not null" json:"score"`
	WordsTyped int       `gorm:"not null" json:"wordsTyped"`
	Difficulty string    `gorm:"type:varchar(20)" json:"difficulty"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (GameScore) TableName() string {
	return "game_scores"
}

func NewGameScore(userID string, score, wordsTyped int, difficulty string) *GameScore {
	return &GameScore{
		ID:         uuid.New().String(),
		UserID:     userID,
		Score:      score,
		WordsTyped: wordsTyped,
		Difficulty: difficulty,
	}
}

