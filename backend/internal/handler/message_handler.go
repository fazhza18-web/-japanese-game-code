package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"typinggame-api/internal/service"
)

type MessageHandler struct {
	messageService service.MessageService
}

func NewMessageHandler(messageService service.MessageService) *MessageHandler {
	return &MessageHandler{messageService: messageService}
}

func (h *MessageHandler) StartConversation(c echo.Context) error {
	userID := c.Get("user_id").(string)
	otherUserID := c.Param("id")

	conversation, err := h.messageService.GetOrCreateConversation(userID, otherUserID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	// Get the other user
	var otherUser interface{}
	if conversation.User1ID == userID {
		otherUser = map[string]interface{}{
			"id":    conversation.User2.ID,
			"name":  conversation.User2.Name,
			"email": conversation.User2.Email,
		}
	} else {
		otherUser = map[string]interface{}{
			"id":    conversation.User1.ID,
			"name":  conversation.User1.Name,
			"email": conversation.User1.Email,
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":       conversation.ID,
		"otherUser": otherUser,
		"createdAt": conversation.CreatedAt,
		"updatedAt": conversation.UpdatedAt,
	})
}

func (h *MessageHandler) GetConversations(c echo.Context) error {
	userID := c.Get("user_id").(string)

	conversations, err := h.messageService.GetConversations(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, conv := range conversations {
		// Get the other user
		var otherUser interface{}
		if conv.User1ID == userID {
			otherUser = map[string]interface{}{
				"id":    conv.User2.ID,
				"name":  conv.User2.Name,
				"email": conv.User2.Email,
			}
		} else {
			otherUser = map[string]interface{}{
				"id":    conv.User1.ID,
				"name":  conv.User1.Name,
				"email": conv.User1.Email,
			}
		}

		// Get unread count
		unreadCount, _ := h.messageService.GetUnreadCount(userID, conv.ID)

		response = append(response, map[string]interface{}{
			"id":         conv.ID,
			"otherUser":  otherUser,
			"updatedAt":  conv.UpdatedAt,
			"unreadCount": unreadCount,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *MessageHandler) SendMessage(c echo.Context) error {
	userID := c.Get("user_id").(string)
	conversationID := c.Param("id")

	var req struct {
		Content string `json:"content"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "invalid request"})
	}

	message, err := h.messageService.SendMessage(conversationID, userID, req.Content)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":        message.ID,
		"senderId":  message.SenderID,
		"sender": map[string]interface{}{
			"id":   message.Sender.ID,
			"name": message.Sender.Name,
		},
		"content":   message.Content,
		"isRead":    message.IsRead,
		"createdAt": message.CreatedAt,
	})
}

func (h *MessageHandler) GetMessages(c echo.Context) error {
	conversationID := c.Param("id")
	
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")
	
	limit := 50
	offset := 0
	
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	messages, err := h.messageService.GetMessages(conversationID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Reverse to show oldest first
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	var response []map[string]interface{}
	for _, msg := range messages {
		response = append(response, map[string]interface{}{
			"id":        msg.ID,
			"senderId":  msg.SenderID,
			"sender": map[string]interface{}{
				"id":   msg.Sender.ID,
				"name": msg.Sender.Name,
			},
			"content":   msg.Content,
			"isRead":    msg.IsRead,
			"createdAt": msg.CreatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *MessageHandler) MarkAsRead(c echo.Context) error {
	userID := c.Get("user_id").(string)
	conversationID := c.Param("id")

	if err := h.messageService.MarkAsRead(conversationID, userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "marked as read"})
}

