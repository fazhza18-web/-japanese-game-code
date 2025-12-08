package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"typinggame-api/internal/service"
)

type FriendHandler struct {
	friendService service.FriendService
}

func NewFriendHandler(friendService service.FriendService) *FriendHandler {
	return &FriendHandler{friendService: friendService}
}

func (h *FriendHandler) SearchUsers(c echo.Context) error {
	userID := c.Get("user_id").(string)
	query := c.QueryParam("q")
	limit := 10

	if query == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "query parameter 'q' is required"})
	}

	users, err := h.friendService.SearchUsers(query, userID, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, user := range users {
		// Double check: filter out blocked users (safety check)
		isBlocked, _ := h.friendService.IsBlocked(userID, user.ID)
		if isBlocked {
			continue // Skip blocked users
		}
		
		status, _ := h.friendService.GetFriendStatus(userID, user.ID)
		response = append(response, map[string]interface{}{
			"id":     user.ID,
			"name":   user.Name,
			"email":  user.Email,
			"status": status,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *FriendHandler) SendFriendRequest(c echo.Context) error {
	requesterID := c.Get("user_id").(string)
	receiverID := c.Param("id")

	if err := h.friendService.SendFriendRequest(requesterID, receiverID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Friend request sent"})
}

func (h *FriendHandler) AcceptFriendRequest(c echo.Context) error {
	userID := c.Get("user_id").(string)
	requestID := c.Param("id")

	if err := h.friendService.AcceptFriendRequest(requestID, userID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Friend request accepted"})
}

func (h *FriendHandler) RejectFriendRequest(c echo.Context) error {
	userID := c.Get("user_id").(string)
	requestID := c.Param("id")

	if err := h.friendService.RejectFriendRequest(requestID, userID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Friend request rejected"})
}

func (h *FriendHandler) GetPendingRequests(c echo.Context) error {
	userID := c.Get("user_id").(string)

	requests, err := h.friendService.GetPendingRequests(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, req := range requests {
		response = append(response, map[string]interface{}{
			"id":        req.ID,
			"requester": map[string]interface{}{
				"id":   req.Requester.ID,
				"name": req.Requester.Name,
				"email": req.Requester.Email,
			},
			"createdAt": req.CreatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *FriendHandler) GetFriends(c echo.Context) error {
	userID := c.Get("user_id").(string)

	friends, err := h.friendService.GetFriends(userID)
	if err != nil {
		c.Logger().Errorf("GetFriends error: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, friend := range friends {
		response = append(response, map[string]interface{}{
			"id":    friend.ID,
			"name":  friend.Name,
			"email": friend.Email,
		})
	}

	// Log for debugging
	c.Logger().Infof("GetFriends: userID=%s, found %d friends", userID, len(response))

	return c.JSON(http.StatusOK, response)
}

func (h *FriendHandler) GetFriendStatus(c echo.Context) error {
	userID := c.Get("user_id").(string)
	targetUserID := c.Param("id")

	status, err := h.friendService.GetFriendStatus(userID, targetUserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"status": status})
}

func (h *FriendHandler) DeleteFriend(c echo.Context) error {
	userID := c.Get("user_id").(string)
	friendID := c.Param("id")

	if err := h.friendService.DeleteFriend(userID, friendID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ลบเพื่อนสำเร็จ"})
}

func (h *FriendHandler) BlockUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	blockedUserID := c.Param("id")

	if err := h.friendService.BlockUser(userID, blockedUserID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "บล็อคผู้ใช้สำเร็จ"})
}

func (h *FriendHandler) UnblockUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	blockedUserID := c.Param("id")

	if err := h.friendService.UnblockUser(userID, blockedUserID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ยกเลิกการบล็อคสำเร็จ"})
}

func (h *FriendHandler) GetBlockedUsers(c echo.Context) error {
	userID := c.Get("user_id").(string)

	users, err := h.friendService.GetBlockedUsers(userID)
	if err != nil {
		c.Logger().Errorf("GetBlockedUsers error: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, user := range users {
		response = append(response, map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		})
	}

	c.Logger().Infof("GetBlockedUsers: userID=%s, found %d blocked users", userID, len(response))
	return c.JSON(http.StatusOK, response)
}

