package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"typinggame-api/internal/repository"
)

type UserHandler struct {
	userRepo repository.UserRepository
}

func NewUserHandler(userRepo repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userID := c.Get("user_id").(string)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "ไม่พบผู้ใช้"})
	}

	return c.JSON(http.StatusOK, user)
}

type UpdateUserRequest struct {
	Name string `json:"name"`
}

func (h *UserHandler) UpdateMe(c echo.Context) error {
	userID := c.Get("user_id").(string)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "ไม่พบผู้ใช้"})
	}

	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if req.Name != "" {
		user.Name = req.Name
	}

	if err := h.userRepo.Update(user); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "เกิดข้อผิดพลาดในการอัปเดต"})
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	userID := c.Param("id")

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "ไม่พบผู้ใช้"})
	}

	// Don't return password
	user.Password = ""

	return c.JSON(http.StatusOK, user)
}

