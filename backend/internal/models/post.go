package models

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	AuthorID  string    `gorm:"type:varchar(36);not null;index" json:"authorId"`
	Author    User      `gorm:"foreignKey:AuthorID" json:"author"`
	Likes     int       `gorm:"default:0" json:"likes"`
	Comments  int       `gorm:"default:0" json:"comments"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type PostReaction struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)"`
	PostID    string    `gorm:"type:varchar(36);not null;index"`
	UserID    string    `gorm:"type:varchar(36);not null;index"`
	Reaction  string    `gorm:"type:varchar(20);not null;default:'like'"` // like, love, haha, wow, sad, angry
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

