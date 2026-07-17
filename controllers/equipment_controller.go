package controllers

import (
	"net/http"
	"time"

	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/request"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		
	}
}

func CreateEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input request.CreateEquipmentRequest

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Format request tidak valid",
			})
			return
		}

		validate := validator.New()
		if err := validate.Struct(input); err != nil {
			validationErrors := err.(validator.ValidationErrors)
			fields := []string{}
			fieldLabels := map[string]string{
				"EquipmentCode": "Kode Alat (equipment_code)",
				"Name":          "Nama Alat (name)",
				"ObjectTypeID":  "Jenis Alat (id_object_type)",
				"Plant":         "Pabrik (plant)",
				"ConditionID":   "Kondisi Awal (id_condition)",
			}
			for _, fe := range validationErrors {
				if label, ok := fieldLabels[fe.Field()]; ok {
					fields = append(fields, label)
				}
			}
			message := "Validasi gagal: "
			for i, f := range fields {
				if i > 0 {
					message += " dan "
				}
				message += f
			}
			message += " wajib diisi"

			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": message,
			})
			return
		}

		var existing models.Equipment
		if err := db.Where("equipment_code = ?", input.EquipmentCode).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Kode alat sudah terdaftar",
			})
			return
		}

		var status models.Status
		if err := db.Where("name = ?", "REGISTERED").First(&status).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Status REGISTERED tidak ditemukan di database",
			})
			return
		}

		userID := c.GetUint("user_id")
		userNPP := c.GetString("user_npp")

		equipment := models.Equipment{
			UUID:              uuid.New().String(),
			EquipmentCode:     input.EquipmentCode,
			Name:              input.Name,
			ObjectTypeID:      input.ObjectTypeID,
			Plant:             input.Plant,
			PlantDescription:  input.PlantDescription,
			StorageLocationID: input.StorageLocationID,
			FuncLoc:           input.FuncLoc,
			Vendor:            input.Vendor,
			Year:              input.Year,
			OriginalValue:     input.OriginalValue,
			BookValue:         input.BookValue,
			ConditionID:       input.ConditionID,
			StatusID:          status.ID,
			IdleSince:         nil,
			Notes:             input.Notes,
			CreatedBy:         userID,
			CreatedByNPP:      userNPP,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		if err := db.Create(&equipment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menyimpan data aset",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"status":  "success",
			"message": "Aset baru berhasil didaftarkan",
			"data": gin.H{
				"id":             equipment.ID,
				"uuid":           equipment.UUID,
				"equipment_code": equipment.EquipmentCode,
				"status_name":    "REGISTERED",
				"created_by":     userNPP,
				"created_at":     equipment.CreatedAt.Format(time.RFC3339),
			},
		})
	}
}
