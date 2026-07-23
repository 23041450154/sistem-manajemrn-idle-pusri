package controllers

import (
	"net/http"
	"time"

	"github.com/Ucokgreget/backend-idle/constants"
	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/request"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GetAllEquipment godoc
// @Summary      Ambil semua equipment
// @Description  Mengambil daftar seluruh data equipment/aset idle
// @Tags         Equipment
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{}  "Data berhasil diambil"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /equipment [get]
func GetAllEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var equipments []models.Equipment

		if err := db.Find(&equipments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "ada yang salah dengan server",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Data berhasil diambil",
			"data":    equipments,
		})
	}
}

// GetEquipment godoc
// @Summary      Ambil detail equipment
// @Description  Mengambil detail satu equipment berdasarkan ID, termasuk relasi Condition, Status, StorageLocation, dan ObjectType
// @Tags         Equipment
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "ID Equipment"
// @Success      200  {object}  map[string]interface{}  "Berhasil mengambil data equipment"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      404  {object}  map[string]interface{}  "Aset tidak ditemukan"
// @Router       /equipment/{id} [get]
func GetEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var equipment models.Equipment
		if err := db.Preload("Condition").Preload("Status").Preload("StorageLocation").Preload("ObjectType").First(&equipment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Aset tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "berhasil mengambil data equipment",
			"data":    equipment,
		})
	}
}

// CreateEquipment godoc
// @Summary      Daftarkan equipment baru
// @Description  Mendaftarkan aset/equipment idle baru dengan status awal REGISTERED
// @Tags         Equipment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body      request.EquipmentRequest  true  "Data equipment baru"
// @Success      201  {object}  map[string]interface{}  "Aset baru berhasil didaftarkan"
// @Failure      400  {object}  map[string]interface{}  "Validasi gagal / kode alat sudah terdaftar"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /equipment [post]
func CreateEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input request.EquipmentRequest

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if err := validate.Struct(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		var existing models.Equipment
		if err := db.Where("equipment_code = ?", input.EquipmentCode).First(&existing).Error; err == nil {
			c.JSON(400, gin.H{"error": "Kode alat sudah terdaftar"})
			return
		}

		var status models.Status
		if err := db.Where("name = ?", "REGISTERED").First(&status).Error; err != nil {
			c.JSON(400, gin.H{"error": "Kode alat tidak ditemukan"})
			return
		}

		userID := c.GetUint("user_id")
		userNpp := c.GetString("user_npp")

		equipment := models.Equipment{
			UUID:                uuid.New().String(),
			EquipmentCode:       input.EquipmentCode,
			Name:                input.Name,
			ObjectTypeID:        input.ObjectTypeID,
			Plant:               input.Plant,
			PlantDescription:    input.PlantDescription,
			StorageLocationID:   input.StorageLocationID,
			FuncLoc:             input.FuncLoc,
			Vendor:              input.Vendor,
			Year:                input.Year,
			OriginalValue:       input.OriginalValue,
			BookValue:           input.BookValue,
			EstimatedReuseValue: input.EstimatedReuseValue,
			StatusID:            status.ID,
			ConditionID:         input.ConditionID,
			Notes:               input.Notes,
			CreatedBy:           userID,
			CreatedByNPP:        userNpp,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		var idleDeclaration models.IdleDeclaration

		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&equipment).Error; err != nil {
				return err
			}

			idleDeclaration = models.IdleDeclaration{
				EquipmentID:        int(equipment.ID),
				IdleDate:           time.Time{},
				IdleReasonID:       input.IdleReasonId,
				ConditionID:        input.ConditionID,
				PreservationStatus: "",
				StorageLocationID:  input.StorageLocationID,
				Notes:              input.Notes,
				DeclaredBy:         0,
				CreatedAt:          time.Now(),
				UpdatedAt:          time.Now(),
			}

			if err := tx.Create(&idleDeclaration).Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Equipment berhasil diregistrasi",
			"data": gin.H{"id": equipment.ID,
				"uuid":            equipment.UUID,
				"equipment_code":  equipment.EquipmentCode,
				"id_status":       1,
				"idleDeclaration": idleDeclaration.ID,
				"created_by":      userNpp,
				"created_at":      equipment.CreatedAt.Format(time.RFC3339)},
		})

	}
}

// UpdateEquipment godoc
// @Summary      Perbarui data equipment
// @Description  Memperbarui sebagian field equipment (partial update). Hanya untuk role RENDAL_PEMELIHARAAN. Jika equipment punya approval berstatus REVISION_REQUIRED, approval otomatis dikembalikan ke PENDING.
// @Tags         Equipment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id       path      int                             true  "ID Equipment"
// @Param        request  body      request.UpdateEquipmentRequest  true  "Field equipment yang ingin diubah"
// @Success      200  {object}  map[string]interface{}  "Aset berhasil diperbarui"
// @Failure      400  {object}  map[string]interface{}  "Format request tidak valid / tidak ada data yang diubah"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      403  {object}  map[string]interface{}  "Role tidak diizinkan"
// @Failure      404  {object}  map[string]interface{}  "Aset tidak ditemukan"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /equipment/{id} [patch]
func UpdateEquipment(db *gorm.DB) gin.HandlerFunc {
	allowedFields := map[string]string{
		"equipment_code":      "equipment_code",
		"name":                "name",
		"id_object_type":      "object_type_id",
		"plant":               "plant",
		"plant_description":   "plant_description",
		"id_storage_location": "storage_location_id",
		"func_loc":            "func_loc",
		"vendor":              "vendor",
		"year":                "year",
		"original_value":      "original_value",
		"book_value":          "book_value",
		"id_condition":        "condition_id",
		"notes":               "notes",
	}

	return func(c *gin.Context) {
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Format request tidak valid",
			})
			return
		}

		updates := map[string]interface{}{}
		for jsonKey, dbColumn := range allowedFields {
			if val, exists := body[jsonKey]; exists {
				updates[dbColumn] = val
			}
		}

		if len(updates) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Tidak ada data yang diubah",
			})
			return
		}

		equipmentID := c.Param("id")
		var equipment models.Equipment
		if err := db.First(&equipment, equipmentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Aset tidak ditemukan",
			})
			return
		}

		userID := c.GetUint("user_id")
		userNPP := c.GetString("user_npp")
		now := time.Now()
		updates["updated_by"] = userID
		updates["updated_by_npp"] = userNPP
		updates["updated_at"] = now

		// Cek apakah equipment ini punya approval yang sedang REVISION_REQUIRED.
		// Jika ya, perbaikan data oleh Rendal otomatis mengembalikan approval ke PENDING.
		var approval models.ApprovalRequest
		hasRevision := db.Where("equipment_id = ? AND request_type = ? AND approval_status = ?",
			equipment.ID, constants.RequestTypeEquipmentRegistration, constants.ApprovalStatusRevisionRequired).
			First(&approval).Error == nil

		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&equipment).Updates(updates).Error; err != nil {
				return err
			}

			if hasRevision {
				approval.ApprovalStatus = constants.ApprovalStatusPending
				approval.UpdatedBy = userID
				approval.UpdatedAt = now
				if err := tx.Save(&approval).Error; err != nil {
					return err
				}

				if err := tx.Model(&models.ApprovalStep{}).
					Where("approval_request_id = ?", approval.ID).
					Updates(map[string]interface{}{
						"approval_status": constants.ApprovalStatusPending,
						"approval_notes":  "",
						"approval_date":   nil,
						"updated_by":      userID,
					}).Error; err != nil {
					return err
				}
			}
			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal memperbarui data aset",
			})
			return
		}

		message := "Aset berhasil diperbarui"
		if hasRevision {
			message = "Aset berhasil diperbarui, approval dikembalikan ke status menunggu review"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": message,
			"data": gin.H{
				"id":             equipment.ID,
				"uuid":           equipment.UUID,
				"equipment_code": equipment.EquipmentCode,
				"updated_by":     userNPP,
				"updated_at":     now.Format(time.RFC3339),
			},
		})
	}
}

// DeleteEquipment godoc
// @Summary      Hapus equipment
// @Description  Menghapus data equipment berdasarkan ID
// @Tags         Equipment
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "ID Equipment"
// @Success      200  {object}  map[string]interface{}  "Aset berhasil dihapus"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      404  {object}  map[string]interface{}  "Aset tidak ditemukan"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /equipment/{id} [delete]
func DeleteEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		equipmentID := c.Param("id")
		var equipment models.Equipment

		if err := db.Where("id = ?", equipmentID).First(&equipment).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Aset tidak ditemukan",
			})
			return
		}

		if err := db.Delete(&equipment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menghapus data aset",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Aset berhasil dihapus",
		})
	}
}

// ValidateEquipment godoc
// @Summary      Penilaian kelayakan equipment
// @Description  Menilai kelayakan (utilizable) sebuah equipment. Hanya untuk role INSPEKSI_TEKNIK. Jika tidak layak, status equipment menjadi REJECTED. Jika layak, status menjadi VALIDATED dan dibuatkan approval untuk Manajer Rendal.
// @Tags         Equipment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id       path      int                               true  "ID Equipment"
// @Param        request  body      request.ValidateEquipmentRequest  true  "Hasil penilaian kelayakan"
// @Success      200  {object}  map[string]interface{}  "Penilaian kelayakan berhasil disimpan"
// @Failure      400  {object}  map[string]interface{}  "Format request tidak valid / field wajib tidak diisi"
// @Failure      401  {object}  map[string]interface{}  "Unauthorized"
// @Failure      403  {object}  map[string]interface{}  "Role tidak diizinkan"
// @Failure      404  {object}  map[string]interface{}  "Aset tidak ditemukan"
// @Failure      409  {object}  map[string]interface{}  "Approval aset sedang dalam proses review (IN_REVIEW)"
// @Failure      500  {object}  map[string]interface{}  "Kesalahan server"
// @Router       /equipment/{id}/validate [patch]
func ValidateEquipment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var input request.ValidateEquipmentRequest
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Format request tidak valid",
			})
			return
		}

		if input.IsUtilizable == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Field is_utilizable wajib diisi",
			})
			return
		}

		if !*input.IsUtilizable && input.Notes == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Alasan penolakan (notes) wajib diisi jika aset dinilai tidak layak",
			})
			return
		}

		var equipment models.Equipment
		if err := db.First(&equipment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Aset dengan ID tersebut tidak ditemukan",
			})
			return
		}

		// Cegah re-validation pada aset yang statusnya sudah final.
		// Status di-resolve berdasarkan nama, bukan ID hardcoded, agar tetap
		// benar meski urutan seeding berubah (IDLE = final/disetujui Manajer,
		// REJECTED = keputusan penolakan yang sudah final).
		var currentStatus models.Status
		if err := db.First(&currentStatus, equipment.StatusID).Error; err == nil {
			switch currentStatus.Name {
			case "IDLE":
				c.JSON(http.StatusBadRequest, gin.H{
					"status":  "error",
					"message": "Validasi tidak dapat diubah karena aset sudah disetujui Manajer (berstatus IDLE)",
				})
				return
			case "REJECTED":
				c.JSON(http.StatusBadRequest, gin.H{
					"status":  "error",
					"message": "Validasi tidak dapat diubah karena aset sudah ditolak (berstatus REJECTED)",
				})
				return
			}
		}

		// Cegah edit validasi saat approval aset sedang direview Manajer (IN_REVIEW).
		var inReviewApproval models.ApprovalRequest
		if err := db.Where("equipment_id = ? AND approval_status = ?",
			equipment.ID, constants.ApprovalStatusInReview).First(&inReviewApproval).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"status":  "error",
				"message": "Validasi tidak dapat diubah karena approval aset sedang dalam proses review oleh Manajer (IN_REVIEW)",
			})
			return
		}

		userID := c.GetUint("user_id")
		userNPP := c.GetString("user_npp")
		now := time.Now()

		equipment.IsUtilizable = *input.IsUtilizable
		equipment.Notes = input.Notes
		equipment.UpdatedBy = userID
		equipment.UpdatedByNPP = userNPP
		equipment.UpdatedAt = now

		// Equipment tidak layak: cukup set REJECTED, tidak ada approval.
		if !*input.IsUtilizable {
			var rejectedStatus models.Status
			if err := db.Where("name = ?", "REJECTED").First(&rejectedStatus).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"status":  "error",
					"message": "Status REJECTED tidak ditemukan di database",
				})
				return
			}
			equipment.StatusID = rejectedStatus.ID

			if err := db.Save(&equipment).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"status":  "error",
					"message": "Gagal menyimpan penilaian",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"status":  "success",
				"message": "Penilaian kelayakan berhasil disimpan",
				"data": gin.H{
					"id":             equipment.ID,
					"equipment_code": equipment.EquipmentCode,
					"is_utilizable":  equipment.IsUtilizable,
					"status":         equipment.StatusID,
					"notes":          equipment.Notes,
					"updated_by":     userNPP,
					"updated_at":     equipment.UpdatedAt,
				},
			})
			return
		}

		// Equipment layak: set VALIDATED lalu buat approval untuk Manajer Rendal.
		var validatedStatus models.Status
		if err := db.Where("name = ?", "VALIDATED").First(&validatedStatus).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Status VALIDATED tidak ditemukan di database",
			})
			return
		}
		equipment.StatusID = validatedStatus.ID

		var approval models.ApprovalRequest
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Save(&equipment).Error; err != nil {
				return err
			}

			// Hindari duplikasi approval jika equipment ini sudah pernah dibuatkan.
			var existing models.ApprovalRequest
			err := tx.Where("equipment_id = ? AND request_type = ?",
				equipment.ID, constants.RequestTypeEquipmentRegistration).First(&existing).Error
			if err == nil {
				approval = existing
				return nil
			}

			approval = models.ApprovalRequest{
				RequestNumber:  generateApprovalNumber(tx, now),
				RequestType:    constants.RequestTypeEquipmentRegistration,
				ReferenceID:    equipment.ID,
				EquipmentID:    equipment.ID,
				Requester:      equipment.CreatedBy,
				RequestDate:    now,
				Justification:  "Registrasi equipment idle: " + equipment.Name,
				CurrentStep:    "Manajer Rendal",
				ApprovalStatus: constants.ApprovalStatusPending,
				CreatedAt:      now,
				UpdatedAt:      now,
				CreatedBy:      userID,
				UpdatedBy:      userID,
			}
			if err := tx.Create(&approval).Error; err != nil {
				return err
			}

			step := models.ApprovalStep{
				ApprovalRequestId: approval.ID,
				StepOrder:         1,
				ApprovalRole:      "MANAJER_RENDAL",
				ApprovalName:      "Manajer Rendal",
				ApprovalStatus:    constants.ApprovalStatusPending,
				ApprovalDate:      nil,
				CreatedBy:         userID,
				UpdatedBy:         userID,
			}
			return tx.Create(&step).Error
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menyimpan penilaian dan membuat approval",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Penilaian kelayakan berhasil disimpan dan approval dibuat",
			"data": gin.H{
				"id":              equipment.ID,
				"equipment_code":  equipment.EquipmentCode,
				"is_utilizable":   equipment.IsUtilizable,
				"status":          equipment.StatusID,
				"notes":           equipment.Notes,
				"updated_by":      userNPP,
				"updated_at":      equipment.UpdatedAt,
				"approval_id":     approval.ID,
				"approval_number": approval.RequestNumber,
				"approval_status": approval.ApprovalStatus,
			},
		})
	}
}
