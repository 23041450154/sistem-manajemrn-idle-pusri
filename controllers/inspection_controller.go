package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/request"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllInspection(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var inspections []models.EquipmentInspection
		if err := db.Find(&inspections).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": inspections})
	}
}

func CreateInspection(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input request.CreateInspectionRequest

		// Pakai ShouldBind (bukan ShouldBindJSON) karena request berupa
		// multipart/form-data agar bisa membawa file foto.
		if err := c.ShouldBind(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := validate.Struct(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userID := c.GetUint("user_id")
		now := time.Now()

		inspection := models.EquipmentInspection{
			EquipmentID:            input.EquipmentID,
			InspectionDate:         now,
			Inspector:              input.InspectorID,
			RequireActionID:        input.RequireActionID,
			MechanicalCondition:    input.MechanicalCondition,
			ElectricalCondition:    input.ElectricalCondition,
			EstimatedRefurbishCost: input.EstimatedRefurbishCost,
			Notes:                  input.Notes,
			CreatedAt:              now,
			UpdatedAt:              now,
			CreatedBy:              userID,
		}

		var attachment models.EquipmentAttachment

		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&inspection).Error; err != nil {
				return err
			}

			if input.Photo != nil {
				// Nama file dibuat unik agar tidak saling menimpa.
				ext := filepath.Ext(input.Photo.Filename)
				fileName := fmt.Sprintf("inspection_%d_%d%s", inspection.ID, now.Unix(), ext)
				dst := filepath.Join("uploads", "inspections", fileName)

				if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
					return err
				}
				if err := c.SaveUploadedFile(input.Photo, dst); err != nil {
					return err
				}

				attachment = models.EquipmentAttachment{
					ReferenceTable:     "equipment_inspections",
					ReferenceID:        inspection.ID,
					AttachmentCategory: "photo",
					FileName:           input.Photo.Filename,
					FileURL:            dst,
					FileType:           input.Photo.Header.Get("Content-Type"),
					IsPrimary:          true,
					UploadedBy:         userID,
					UploadedAt:         now,
				}
				if err := tx.Create(&attachment).Error; err != nil {
					return err
				}
			}

			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Inspeksi berhasil disimpan",
			"data": gin.H{
				"inspection": inspection,
				"attachment": attachment,
			},
		})
	}
}
