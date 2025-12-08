package repository

import (
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type MessageRepository interface {
	CreateConversation(conversation *models.Conversation) error
	FindConversation(user1ID, user2ID string) (*models.Conversation, error)
	FindConversationByID(conversationID string) (*models.Conversation, error)
	GetConversations(userID string) ([]models.Conversation, error)
	CreateMessage(message *models.Message) error
	GetMessages(conversationID string, limit, offset int) ([]models.Message, error)
	GetUnreadCount(userID, conversationID string) (int64, error)
	MarkAsRead(conversationID, userID string) error
}

type messageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db: db}
}

func (r *messageRepository) CreateConversation(conversation *models.Conversation) error {
	return r.db.Create(conversation).Error
}

func (r *messageRepository) FindConversation(user1ID, user2ID string) (*models.Conversation, error) {
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}
	
	var conversation models.Conversation
	err := r.db.Where("user1_id = ? AND user2_id = ?", user1ID, user2ID).
		Preload("User1").
		Preload("User2").
		First(&conversation).Error
	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *messageRepository) FindConversationByID(conversationID string) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.Where("id = ?", conversationID).
		Preload("User1").
		Preload("User2").
		First(&conversation).Error
	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *messageRepository) GetConversations(userID string) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := r.db.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").
		Preload("User2").
		Order("updated_at DESC").
		Find(&conversations).Error
	return conversations, err
}

func (r *messageRepository) CreateMessage(message *models.Message) error {
	// Update conversation updated_at
	r.db.Model(&models.Conversation{}).
		Where("id = ?", message.ConversationID).
		Update("updated_at", gorm.Expr("NOW()"))
	
	return r.db.Create(message).Error
}

func (r *messageRepository) GetMessages(conversationID string, limit, offset int) ([]models.Message, error) {
	var messages []models.Message
	query := r.db.Where("conversation_id = ?", conversationID).
		Preload("Sender").
		Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}
	
	err := query.Find(&messages).Error
	return messages, err
}

func (r *messageRepository) GetUnreadCount(userID, conversationID string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, userID, false).
		Count(&count).Error
	return count, err
}

func (r *messageRepository) MarkAsRead(conversationID, userID string) error {
	return r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, userID, false).
		Update("is_read", true).Error
}

