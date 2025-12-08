package models

import (
	"time"

	"github.com/google/uuid"
)

type EditHistory struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	EntityType string   `gorm:"type:varchar(20);not null;index" json:"entityType"` // "post" or "comment"
	EntityID   string   `gorm:"type:varchar(36);not null;index" json:"entityId"`
	OldContent string   `gorm:"type:text" json:"oldContent"`
	NewContent string   `gorm:"type:text;not null" json:"newContent"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (EditHistory) TableName() string {
	return "edit_histories"
}

func NewEditHistory(entityType, entityID, oldContent, newContent string) *EditHistory {
	return &EditHistory{
		ID:         uuid.New().String(),
		EntityType: entityType,
		EntityID:   entityID,
		OldContent: oldContent,
		NewContent: newContent,
	}
}

