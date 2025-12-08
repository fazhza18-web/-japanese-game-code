package handler

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"typinggame-api/internal/service"
)

type GameHandler struct {
	gameService service.GameService
}

func NewGameHandler(gameService service.GameService) *GameHandler {
	return &GameHandler{gameService: gameService}
}

type SaveScoreRequest struct {
	Score      int    `json:"score" validate:"required,min=0"`
	WordsTyped int    `json:"wordsTyped" validate:"required,min=0"`
	Difficulty string `json:"difficulty" validate:"required"`
}

func (h *GameHandler) SaveScore(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req SaveScoreRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := validator.New().Struct(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
	}

	score, err := h.gameService.SaveScore(userID, req.Score, req.WordsTyped, req.Difficulty)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":         score.ID,
		"score":      score.Score,
		"wordsTyped": score.WordsTyped,
		"difficulty": score.Difficulty,
		"createdAt":  score.CreatedAt,
	})
}

func (h *GameHandler) GetTopScores(c echo.Context) error {
	limit := 10
	if limitParam := c.QueryParam("limit"); limitParam != "" {
		// Parse limit if provided
	}

	scores, err := h.gameService.GetTopScores(limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, score := range scores {
		response = append(response, map[string]interface{}{
			"id":         score.ID,
			"userId":     score.UserID,
			"userName":   score.User.Name,
			"score":      score.Score,
			"wordsTyped": score.WordsTyped,
			"difficulty": score.Difficulty,
			"createdAt":  score.CreatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *GameHandler) GetTopScoresByDifficulty(c echo.Context) error {
	difficulty := c.Param("difficulty")
	limit := 10

	scores, err := h.gameService.GetTopScoresByDifficulty(difficulty, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var response []map[string]interface{}
	for _, score := range scores {
		response = append(response, map[string]interface{}{
			"id":         score.ID,
			"userId":     score.UserID,
			"userName":   score.User.Name,
			"score":      score.Score,
			"wordsTyped": score.WordsTyped,
			"difficulty": score.Difficulty,
			"createdAt":  score.CreatedAt,
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *GameHandler) GetUserBestScore(c echo.Context) error {
	userID := c.Get("user_id").(string)

	score, err := h.gameService.GetUserBestScore(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "ไม่พบคะแนน"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":         score.ID,
		"userId":     score.UserID,
		"userName":   score.User.Name,
		"score":      score.Score,
		"wordsTyped": score.WordsTyped,
		"difficulty": score.Difficulty,
		"createdAt":  score.CreatedAt,
	})
}

