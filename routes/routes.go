package routes

import (
	"github.com/Ucokgreget/backend-idle/controllers"
	"github.com/Ucokgreget/backend-idle/middleware"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := router.Group("/api")
	api.POST("/auth/login", controllers.Login(db))
	api.POST("/auth/logout", controllers.LogOut())
	api.Use(middleware.AuthMiddleware(db))
	{

		api.GET("/equipment", controllers.GetAllEquipment(db))
		api.GET("/equipment/:id", controllers.GetEquipment(db))
		api.POST("/equipment", controllers.CreateEquipment(db))
		api.PATCH("/equipment/:id", middleware.RequireRole("RENDAL_PEMELIHARAAN"), controllers.UpdateEquipment(db))
		api.PATCH("/equipment/:id/validate", middleware.RequireRole("INSPEKSI_TEKNIK"), controllers.ValidateEquipment(db))
		api.POST("/attachments/upload", controllers.UploadAttachment(db))

		api.GET("/approvals", controllers.GetApprovals(db))
		api.GET("/approvals/:id", controllers.GetApprovalById(db))
		api.PATCH("/approvals/:id/review", middleware.RequireRole("MANAJER_RENDAL"), controllers.ReviewApproval(db))

		api.GET("/inspections", controllers.GetAllInspection(db))
		api.POST("/inspections", controllers.CreateInspection(db))
	}
}
