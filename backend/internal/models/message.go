package models

import (
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	User1ID   string    `gorm:"type:varchar(36);not null;index" json:"user1Id"`
	User1     User      `gorm:"foreignKey:User1ID" json:"user1"`
	User2ID   string    `gorm:"type:varchar(36);not null;index" json:"user2Id"`
	User2     User      `gorm:"foreignKey:User2ID" json:"user2"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Messages  []Message `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

func (Conversation) TableName() string {
	return "conversations"
}

func NewConversation(user1ID, user2ID string) *Conversation {
	// Ensure consistent ordering (smaller ID first)
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}
	return &Conversation{
		ID:      uuid.New().String(),
		User1ID: user1ID,
		User2ID: user2ID,
	}
}

type Message struct {
	ID             string       `gorm:"primaryKey;type:varchar(36)" json:"id"`
	ConversationID string       `gorm:"type:varchar(36);not null;index" json:"conversationId"`
	Conversation   Conversation `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
	SenderID       string       `gorm:"type:varchar(36);not null;index" json:"senderId"`
	Sender         User         `gorm:"foreignKey:SenderID" json:"sender"`
	Content        string       `gorm:"type:text;not null" json:"content"`
	IsRead         bool         `gorm:"default:false" json:"isRead"`
	CreatedAt      time.Time    `json:"createdAt"`
}

func (Message) TableName() string {
	return "messages"
}

func NewMessage(conversationID, senderID, content string) *Message {
	return &Message{
		ID:             uuid.New().String(),
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        content,
		IsRead:         false,
	}
}



