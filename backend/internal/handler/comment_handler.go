package handler

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"typinggame-api/internal/service"
)

type CommentHandler struct {
	commentService service.CommentService
}

func NewCommentHandler(commentService service.CommentService) *CommentHandler {
	return &CommentHandler{commentService: commentService}
}

type CreateCommentRequest struct {
	Content string `json:"content" validate:"required"`
}

func (h *CommentHandler) CreateComment(c echo.Context) error {
	userID := c.Get("user_id").(string)
	postID := c.Param("id")

	var req CreateCommentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	comment, err := h.commentService.CreateComment(req.Content, postID, userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	response := map[string]interface{}{
		"id":        comment.ID,
		"content":   comment.Content,
		"postId":    comment.PostID,
		"authorId":  comment.AuthorID,
		"authorName": comment.Author.Name,
		"createdAt": comment.CreatedAt,
		"updatedAt": comment.UpdatedAt,
	}

	return c.JSON(http.StatusCreated, response)
}

func (h *CommentHandler) GetComments(c echo.Context) error {
	postID := c.Param("id")

	comments, err := h.commentService.GetCommentsByPostID(postID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	var response []map[string]interface{}
	for _, comment := range comments {
		response = append(response, map[string]interface{}{
			"id":        comment.ID,
			"content":   comment.Content,
			"postId":    comment.PostID,
			"authorId":  comment.AuthorID,
			"authorName": comment.Author.Name,
			"createdAt": comment.CreatedAt,
			"updatedAt": comment.UpdatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *CommentHandler) DeleteComment(c echo.Context) error {
	userID := c.Get("user_id").(string)
	commentID := c.Param("commentId")

	if err := h.commentService.DeleteComment(commentID, userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ลบคอมเมนต์สำเร็จ"})
}

type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required"`
}

func (h *CommentHandler) UpdateComment(c echo.Context) error {
	userID := c.Get("user_id").(string)
	commentID := c.Param("commentId")

	var req UpdateCommentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	comment, err := h.commentService.UpdateComment(commentID, userID, req.Content)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	if comment == nil {
		return c.JSON(http.StatusForbidden, map[string]string{"message": "ไม่มีสิทธิ์แก้ไขคอมเมนต์นี้"})
	}

	// Format response
	response := map[string]interface{}{
		"id":        comment.ID,
		"content":   comment.Content,
		"postId":    comment.PostID,
		"authorId":  comment.AuthorID,
		"authorName": comment.Author.Name,
		"createdAt": comment.CreatedAt,
		"updatedAt": comment.UpdatedAt,
	}

	return c.JSON(http.StatusOK, response)
}

func (h *CommentHandler) GetEditHistory(c echo.Context) error {
	commentID := c.Param("commentId")

	histories, err := h.commentService.GetEditHistory(commentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	var response []map[string]interface{}
	for _, history := range histories {
		response = append(response, map[string]interface{}{
			"id":        history.ID,
			"oldContent": history.OldContent,
			"newContent": history.NewContent,
			"createdAt": history.CreatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

