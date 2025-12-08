package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"typinggame-api/config"
)

func AuthMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "ไม่พบ token"})
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "รูปแบบ token ไม่ถูกต้อง"})
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, echo.NewHTTPError(http.StatusUnauthorized, "รูปแบบ token ไม่ถูกต้อง")
				}
				return []byte(config.Get().JWT.Secret), nil
			})

			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "token ไม่ถูกต้อง"})
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "ไม่สามารถอ่าน token ได้"})
			}

			userID, ok := claims["user_id"].(string)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "ไม่พบ user_id ใน token"})
			}

			c.Set("user_id", userID)
			return next(c)
		}
	}
}

