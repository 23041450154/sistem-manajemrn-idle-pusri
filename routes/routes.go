package routes

import (
	"github.com/Ucokgreget/backend-idle/controllers"
	"github.com/Ucokgreget/backend-idle/middleware"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	router.POST("/login", controllers.Login(db))

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware(db))
	{
		api.POST("/equipment", controllers.CreateEquipment(db))
		api.POST("/attachments/upload", controllers.UploadAttachment(db))
	}
}
