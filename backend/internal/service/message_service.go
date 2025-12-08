package service

import (
	"errors"
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
)

type MessageService interface {
	GetOrCreateConversation(user1ID, user2ID string) (*models.Conversation, error)
	GetConversations(userID string) ([]models.Conversation, error)
	SendMessage(conversationID, senderID, content string) (*models.Message, error)
	GetMessages(conversationID string, limit, offset int) ([]models.Message, error)
	GetUnreadCount(userID, conversationID string) (int64, error)
	MarkAsRead(conversationID, userID string) error
}

type messageService struct {
	messageRepo repository.MessageRepository
	friendRepo  repository.FriendRepository
}

func NewMessageService(messageRepo repository.MessageRepository, friendRepo repository.FriendRepository) MessageService {
	return &messageService{
		messageRepo: messageRepo,
		friendRepo:  friendRepo,
	}
}

func (s *messageService) GetOrCreateConversation(user1ID, user2ID string) (*models.Conversation, error) {
	if user1ID == user2ID {
		return nil, errors.New("cannot create conversation with yourself")
	}

	isBlocked1, err := s.friendRepo.IsBlocked(user1ID, user2ID)
	if err != nil {
		return nil, err
	}
	isBlocked2, err := s.friendRepo.IsBlocked(user2ID, user1ID)
	if err != nil {
		return nil, err
	}
	if isBlocked1 || isBlocked2 {
		return nil, errors.New("คุณถูกผู้ใช้นี้บล็อค")
	}

	isFriend, err := s.friendRepo.IsFriend(user1ID, user2ID)
	if err != nil {
		return nil, err
	}
	if !isFriend {
		return nil, errors.New("users must be friends to chat")
	}

	conversation, err := s.messageRepo.FindConversation(user1ID, user2ID)
	if err == nil && conversation != nil {
		return conversation, nil
	}

	conversation = models.NewConversation(user1ID, user2ID)
	if err := s.messageRepo.CreateConversation(conversation); err != nil {
		return nil, err
	}

	return s.messageRepo.FindConversation(user1ID, user2ID)
}

func (s *messageService) GetConversations(userID string) ([]models.Conversation, error) {
	return s.messageRepo.GetConversations(userID)
}

func (s *messageService) SendMessage(conversationID, senderID, content string) (*models.Message, error) {
	if content == "" {
		return nil, errors.New("message content cannot be empty")
	}

	conversation, err := s.messageRepo.FindConversationByID(conversationID)
	if err != nil {
		return nil, errors.New("conversation not found")
	}

	var receiverID string
	if conversation.User1ID == senderID {
		receiverID = conversation.User2ID
	} else if conversation.User2ID == senderID {
		receiverID = conversation.User1ID
	} else {
		return nil, errors.New("unauthorized: you are not part of this conversation")
	}

	isBlocked, err := s.friendRepo.IsBlocked(receiverID, senderID)
	if err != nil {
		return nil, err
	}
	if isBlocked {
		var receiverName string
		if conversation.User1ID == receiverID {
			receiverName = conversation.User1.Name
		} else {
			receiverName = conversation.User2.Name
		}
		return nil, errors.New("คุณถูก " + receiverName + " บล็อค")
	}

	message := models.NewMessage(conversationID, senderID, content)
	if err := s.messageRepo.CreateMessage(message); err != nil {
		return nil, err
	}

	messages, err := s.messageRepo.GetMessages(conversationID, 1, 0)
	if err != nil || len(messages) == 0 {
		return nil, err
	}

	return &messages[0], nil
}

func (s *messageService) GetMessages(conversationID string, limit, offset int) ([]models.Message, error) {
	return s.messageRepo.GetMessages(conversationID, limit, offset)
}

func (s *messageService) GetUnreadCount(userID, conversationID string) (int64, error) {
	return s.messageRepo.GetUnreadCount(userID, conversationID)
}

func (s *messageService) MarkAsRead(conversationID, userID string) error {
	return s.messageRepo.MarkAsRead(conversationID, userID)
}

