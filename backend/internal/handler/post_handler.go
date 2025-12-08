package handler

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"typinggame-api/internal/service"
)

type PostHandler struct {
	postService service.PostService
}

func NewPostHandler(postService service.PostService) *PostHandler {
	return &PostHandler{postService: postService}
}

type CreatePostRequest struct {
	Content string `json:"content" validate:"required"`
}

func (h *PostHandler) CreatePost(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req CreatePostRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	post, err := h.postService.CreatePost(req.Content, userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	response := map[string]interface{}{
		"id":        post.ID,
		"content":   post.Content,
		"author":    post.AuthorID,
		"authorName": post.Author.Name,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"likes":     post.Likes,
		"comments":  post.Comments,
	}

	return c.JSON(http.StatusCreated, response)
}

func (h *PostHandler) GetAllPosts(c echo.Context) error {
	posts, err := h.postService.GetAllPosts()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	var response []map[string]interface{}
	for _, post := range posts {
		// Get reactions count for each post
		reactions, _ := h.postService.GetReactionsCount(post.ID)
		
		response = append(response, map[string]interface{}{
			"id":        post.ID,
			"content":   post.Content,
			"author":    post.AuthorID,
			"authorName": post.Author.Name,
			"createdAt": post.CreatedAt,
			"likes":     post.Likes,
			"comments":  post.Comments,
			"reactions": reactions,
		})
	}

	return c.JSON(http.StatusOK, response)
}

type ReactRequest struct {
	Reaction string `json:"reaction" validate:"required,oneof=like love haha wow sad angry"`
}

func (h *PostHandler) ReactToPost(c echo.Context) error {
	userID := c.Get("user_id").(string)
	postID := c.Param("id")

	var req ReactRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "reaction ไม่ถูกต้อง"})
	}

	if err := h.postService.ReactToPost(postID, userID, req.Reaction); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Get updated reactions count
	counts, _ := h.postService.GetReactionsCount(postID)
	userReaction, _ := h.postService.GetUserReaction(postID, userID)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":      "สำเร็จ",
		"reactions":    counts,
		"userReaction": userReaction,
	})
}

func (h *PostHandler) GetReactions(c echo.Context) error {
	userID := c.Get("user_id").(string)
	postID := c.Param("id")

	counts, err := h.postService.GetReactionsCount(postID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	userReaction, _ := h.postService.GetUserReaction(postID, userID)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"reactions":    counts,
		"userReaction": userReaction,
	})
}

func (h *PostHandler) GetMyPosts(c echo.Context) error {
	userID := c.Get("user_id").(string)

	posts, err := h.postService.GetPostsByUserID(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	var response []map[string]interface{}
	for _, post := range posts {
		reactions, _ := h.postService.GetReactionsCount(post.ID)
		
		response = append(response, map[string]interface{}{
			"id":        post.ID,
			"content":   post.Content,
			"author":    post.AuthorID,
			"authorName": post.Author.Name,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"likes":     post.Likes,
			"comments":  post.Comments,
			"reactions": reactions,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *PostHandler) GetUserPosts(c echo.Context) error {
	userID := c.Param("id")

	posts, err := h.postService.GetPostsByUserID(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	// Format response
	var response []map[string]interface{}
	for _, post := range posts {
		reactions, _ := h.postService.GetReactionsCount(post.ID)
		
		response = append(response, map[string]interface{}{
			"id":        post.ID,
			"content":   post.Content,
			"author":    post.AuthorID,
			"authorName": post.Author.Name,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"likes":     post.Likes,
			"comments":  post.Comments,
			"reactions": reactions,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *PostHandler) GetEditHistory(c echo.Context) error {
	postID := c.Param("id")

	histories, err := h.postService.GetEditHistory(postID)
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

func (h *PostHandler) DeletePost(c echo.Context) error {
	userID := c.Get("user_id").(string)
	postID := c.Param("id")

	if err := h.postService.DeletePost(postID, userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ลบโพสต์สำเร็จ"})
}

type UpdatePostRequest struct {
	Content string `json:"content" validate:"required"`
}

func (h *PostHandler) UpdatePost(c echo.Context) error {
	userID := c.Get("user_id").(string)
	postID := c.Param("id")

	var req UpdatePostRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	post, err := h.postService.UpdatePost(postID, userID, req.Content)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	if post == nil {
		return c.JSON(http.StatusForbidden, map[string]string{"message": "ไม่มีสิทธิ์แก้ไขโพสต์นี้"})
	}

	// Get reactions count
	reactions, _ := h.postService.GetReactionsCount(post.ID)

	// Format response
	response := map[string]interface{}{
		"id":        post.ID,
		"content":   post.Content,
		"author":    post.AuthorID,
		"authorName": post.Author.Name,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"likes":     post.Likes,
		"comments":  post.Comments,
		"reactions": reactions,
	}

	return c.JSON(http.StatusOK, response)
}

func (h *PostHandler) GetPost(c echo.Context) error {
	postID := c.Param("id")

	post, err := h.postService.GetPostByID(postID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "ไม่พบโพสต์"})
	}

	// Get reactions count
	reactions, _ := h.postService.GetReactionsCount(post.ID)

	// Format response
	response := map[string]interface{}{
		"id":        post.ID,
		"content":   post.Content,
		"author":    post.AuthorID,
		"authorName": post.Author.Name,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"likes":     post.Likes,
		"comments":  post.Comments,
		"reactions": reactions,
	}

	return c.JSON(http.StatusOK, response)
}

