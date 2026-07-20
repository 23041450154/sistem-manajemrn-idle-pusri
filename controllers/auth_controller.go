package controllers

import (
	"net/http"
	"os"
	"time"

	"github.com/Ucokgreget/backend-idle/models"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var validate = validator.New()

type LoginInput struct {
	NPP      string `json:"npp" validate:"required"`
	Password string `json:"password" validate:"required"`
}

func Login(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input LoginInput

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}

		if err := validate.Struct(input); err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}

		var user models.User
		if err := db.Where("npp = ?", input.NPP).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "NPP atau password salah"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "NPP atau password salah"})
			return
		}

		claims := jwt.MapClaims{
			"user_id": user.Id,
			"role":    user.Role,
			"exp":     time.Now().Add(24 * time.Hour).Unix(),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

		signedToken, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
			return
		}

		user.Password = ""
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Login berhasil",
			"data": gin.H{
				"token": signedToken,
				"user":  user,
			},
		})
	}
}
