package service

import (
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
)

type GameService interface {
	SaveScore(userID string, score, wordsTyped int, difficulty string) (*models.GameScore, error)
	GetTopScores(limit int) ([]models.GameScore, error)
	GetTopScoresByDifficulty(difficulty string, limit int) ([]models.GameScore, error)
	GetUserBestScore(userID string) (*models.GameScore, error)
}

type gameService struct {
	scoreRepo repository.GameScoreRepository
}

func NewGameService(scoreRepo repository.GameScoreRepository) GameService {
	return &gameService{scoreRepo: scoreRepo}
}

func (s *gameService) SaveScore(userID string, score, wordsTyped int, difficulty string) (*models.GameScore, error) {
	gameScore := models.NewGameScore(userID, score, wordsTyped, difficulty)
	if err := s.scoreRepo.Create(gameScore); err != nil {
		return nil, err
	}
	return gameScore, nil
}

func (s *gameService) GetTopScores(limit int) ([]models.GameScore, error) {
	return s.scoreRepo.GetTopScores(limit)
}

func (s *gameService) GetTopScoresByDifficulty(difficulty string, limit int) ([]models.GameScore, error) {
	return s.scoreRepo.GetTopScoresByDifficulty(difficulty, limit)
}

func (s *gameService) GetUserBestScore(userID string) (*models.GameScore, error) {
	return s.scoreRepo.GetUserBestScore(userID)
}

