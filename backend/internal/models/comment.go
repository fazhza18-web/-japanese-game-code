package models

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	PostID    string    `gorm:"type:varchar(36);not null;index" json:"postId"`
	Post      Post      `gorm:"foreignKey:PostID" json:"-"`
	AuthorID  string    `gorm:"type:varchar(36);not null;index" json:"authorId"`
	Author    User      `gorm:"foreignKey:AuthorID" json:"author"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}


