package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Ucokgreget/backend-idle/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".pdf":  true,
}

const maxFileSize = 5 * 1024 * 1024 // 5 MB

// UploadAttachment godoc
// @Summary      Unggah berkas lampiran equipment
// @Description  Mengunggah berkas lampiran (JPG, PNG, atau PDF, maks 5 MB) yang terkait dengan sebuah equipment
// @Tags         Attachment
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        equipment_id  formData  int     true   "ID Equipment"
// @Param        category      formData  string  false  "Kategori lampiran"
// @Param        file          formData  file    true   "Berkas yang diunggah (JPG/PNG/PDF, maks 5 MB)"
// @Success      200  {object}  map[string]interface{}  "File berkas berhasil diunggah"
// @Failure      400  {object}  map[string]interface{}  "equipment_id tidak valid / aset tidak ditemukan / file wajib diunggah / ukuran melebihi batas"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      415  {object}  map[string]interface{}  "Format file tidak didukung"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /attachments/upload [post]
func UploadAttachment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		equipmentIDStr := c.PostForm("equipment_id")
		category := c.PostForm("category")

		equipmentID, err := strconv.Atoi(equipmentIDStr)
		if err != nil || equipmentID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "equipment_id tidak valid",
			})
			return
		}

		var equipment models.Equipment
		if err := db.First(&equipment, equipmentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Aset dengan ID tersebut tidak ditemukan",
			})
			return
		}

		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "File wajib diunggah",
			})
			return
		}

		if file.Size > maxFileSize {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Ukuran file melebihi batas maksimum 5 MB",
			})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		if !allowedExtensions[ext] {
			c.JSON(http.StatusUnsupportedMediaType, gin.H{
				"status":  "error",
				"message": "Format file tidak didukung. Hanya menerima JPG, PNG, dan PDF",
			})
			return
		}

		uploadDir := "./uploads/equipment"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal membuat direktori upload",
			})
			return
		}

		fileName := fmt.Sprintf("%d_%d_%s", equipmentID, time.Now().Unix(), file.Filename)
		filePath := filepath.Join(uploadDir, fileName)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menyimpan file",
			})
			return
		}

		userID := c.GetUint("user_id")
		userNPP := c.GetString("user_npp")
		fileURL := "/uploads/equipment/" + fileName

		attachment := models.EquipmentAttachment{
			ReferenceTable:     "equipments",
			ReferenceID:        equipmentID,
			AttachmentCategory: category,
			FileName:           file.Filename,
			FileURL:            fileURL,
			FileType:           ext,
			UploadedBy:         userID,
			UploadedAt:         time.Now(),
		}

		if err := db.Create(&attachment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menyimpan data attachment",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "File berkas berhasil diunggah",
			"data": gin.H{
				"id_attachment": attachment.ID,
				"file_name":     attachment.FileName,
				"file_url":      attachment.FileURL,
				"uploaded_by":   userNPP,
				"uploaded_at":   attachment.UploadedAt.Format(time.RFC3339),
			},
		})
	}
}
