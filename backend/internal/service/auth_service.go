package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"typinggame-api/config"
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(name, email, password string) (*models.User, error)
	Login(email, password string) (string, *models.User, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(name, email, password string) (*models.User, error) {
	// Check if user exists
	existingUser, _ := s.userRepo.FindByEmail(email)
	if existingUser != nil {
		return nil, errors.New("อีเมลนี้ถูกใช้งานแล้ว")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	user.Password = ""
	return user, nil
}

func (s *authService) Login(email, password string) (string, *models.User, error) {
	// Find user
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", nil, errors.New("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, errors.New("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString([]byte(config.Get().JWT.Secret))
	if err != nil {
		return "", nil, err
	}

	user.Password = ""
	return tokenString, user, nil
}

