package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Ucokgreget/backend-idle/constants"
	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/request"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// generateApprovalNumber membuat nomor request berformat APR-YYYY-NNN.
func generateApprovalNumber(db *gorm.DB, now time.Time) string {
	year := now.Year()
	prefix := fmt.Sprintf("APR-%d-", year)

	var count int64
	db.Model(&models.ApprovalRequest{}).Where("request_number LIKE ?", prefix+"%").Count(&count)

	return fmt.Sprintf("%s%03d", prefix, count+1)
}

// GetApprovals mengembalikan daftar approval request, dengan filter opsional
// via query param: ?status=PENDING&request_type=EQUIPMENT_REGISTRATION
//
// GetApprovals godoc
// @Summary      List approval requests
// @Description  Mengambil daftar approval request, dengan filter opsional status dan request_type
// @Tags         approvals
// @Produce      json
// @Security     BearerAuth
// @Param        status        query  string  false  "Filter status approval, contoh: PENDING"
// @Param        request_type  query  string  false  "Filter tipe request, contoh: EQUIPMENT_REGISTRATION"
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /approvals [get]
func GetApprovals(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var approvals []models.ApprovalRequest

		query := db.Preload("Equipment")
		if status := c.Query("status"); status != "" {
			query = query.Where("approval_status = ?", status)
		}
		if reqType := c.Query("request_type"); reqType != "" {
			query = query.Where("request_type = ?", reqType)
		}

		if err := query.Order("created_at DESC").Find(&approvals).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal mengambil data approval",
			})
			return
		}

		data := make([]gin.H, 0, len(approvals))
		for _, a := range approvals {
			data = append(data, gin.H{
				"id":              a.ID,
				"request_number":  a.RequestNumber,
				"request_type":    a.RequestType,
				"reference_id":    a.ReferenceID,
				"equipment_id":    a.EquipmentID,
				"equipment_code":  a.Equipment.EquipmentCode,
				"current_step":    a.CurrentStep,
				"approval_status": a.ApprovalStatus,
				"status_label":    constants.ApprovalStatusLabel(a.ApprovalStatus),
				"request_date":    a.RequestDate,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   data,
		})
	}
}

// GetApproval mengembalikan detail satu approval request beserta tahapan (steps).
//
// GetApprovalById godoc
// @Summary      Get approval detail
// @Description  Mengambil detail satu approval request beserta tahapan (steps)
// @Tags         approvals
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Approval Request ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /approvals/{id} [get]
func GetApprovalById(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var approval models.ApprovalRequest
		if err := db.Preload("Equipment").First(&approval, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Approval tidak ditemukan",
			})
			return
		}

		var steps []models.ApprovalStep
		db.Where("approval_request_id = ?", approval.ID).Order("step_order ASC").Find(&steps)

		stepData := make([]gin.H, 0, len(steps))
		for _, s := range steps {
			stepData = append(stepData, gin.H{
				"id":              s.ID,
				"step_order":      s.StepOrder,
				"approval_role":   s.ApprovalRole,
				"approval_name":   s.ApprovalName,
				"approval_status": s.ApprovalStatus,
				"status_label":    constants.ApprovalStatusLabel(s.ApprovalStatus),
				"approval_date":   s.ApprovalDate,
				"approval_notes":  s.ApprovalNotes,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data": gin.H{
				"id":              approval.ID,
				"request_number":  approval.RequestNumber,
				"request_type":    approval.RequestType,
				"reference_id":    approval.ReferenceID,
				"equipment_id":    approval.EquipmentID,
				"equipment_code":  approval.Equipment.EquipmentCode,
				"justification":   approval.Justification,
				"current_step":    approval.CurrentStep,
				"approval_status": approval.ApprovalStatus,
				"status_label":    constants.ApprovalStatusLabel(approval.ApprovalStatus),
				"request_date":    approval.RequestDate,
				"steps":           stepData,
			},
		})
	}
}

// ReviewApproval memproses keputusan Manajer Rendal terhadap approval request.
// action=APPROVE  -> step & request APPROVED, equipment jadi IDLE
// action=REVISION -> step & request REVISION_REQUIRED (notes wajib)
//
// ReviewApproval godoc
// @Summary      Review approval request
// @Description  Memproses keputusan Manajer Rendal terhadap approval request (APPROVE atau REVISION). Jika APPROVE, equipment terkait otomatis berubah menjadi IDLE.
// @Tags         approvals
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id       path  int                              true  "Approval Request ID"
// @Param        request  body  request.ReviewApprovalRequest    true  "Review decision"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /approvals/{id}/review [patch]
func ReviewApproval(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var input request.ReviewApprovalRequest
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Format request tidak valid",
			})
			return
		}

		if input.Action != "APPROVE" && input.Action != "REVISION" {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Action harus APPROVE atau REVISION",
			})
			return
		}

		if input.Action == "REVISION" && input.Notes == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Catatan revisi (notes) wajib diisi",
			})
			return
		}

		var approval models.ApprovalRequest
		if err := db.First(&approval, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Approval tidak ditemukan",
			})
			return
		}

		if approval.ApprovalStatus == constants.ApprovalStatusApproved {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Approval sudah disetujui, tidak dapat direview ulang",
			})
			return
		}

		userID := c.GetUint("user_id")
		userNPP := c.GetString("user_npp")
		now := time.Now()

		var newStatus string
		if input.Action == "APPROVE" {
			newStatus = constants.ApprovalStatusApproved
		} else {
			newStatus = constants.ApprovalStatusRevisionRequired
		}

		err := db.Transaction(func(tx *gorm.DB) error {
			// Update step aktif (step terakhir / step_order tertinggi untuk workflow ini)
			var step models.ApprovalStep
			if err := tx.Where("approval_request_id = ?", approval.ID).
				Order("step_order DESC").First(&step).Error; err != nil {
				return err
			}

			step.ApprovalStatus = newStatus
			step.ApprovalNotes = input.Notes
			step.ApprovalDate = &now
			step.UpdatedBy = userID
			if err := tx.Save(&step).Error; err != nil {
				return err
			}

			// Update request
			approval.ApprovalStatus = newStatus
			approval.UpdatedBy = userID
			approval.UpdatedAt = now
			if input.Action == "APPROVE" {
				approval.CurrentStep = "Completed"
			}
			if err := tx.Save(&approval).Error; err != nil {
				return err
			}

			// Jika disetujui, equipment menjadi IDLE
			if input.Action == "APPROVE" {
				var idleStatus models.Status
				if err := tx.Where("name = ?", "IDLE").First(&idleStatus).Error; err != nil {
					return err
				}

				var equipment models.Equipment
				if err := tx.First(&equipment, approval.EquipmentID).Error; err != nil {
					return err
				}
				equipment.StatusID = idleStatus.ID
				equipment.IdleSince = &now
				equipment.UpdatedBy = userID
				equipment.UpdatedByNPP = userNPP
				equipment.UpdatedAt = now
				if err := tx.Save(&equipment).Error; err != nil {
					return err
				}
			}

			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal memproses approval",
			})
			return
		}

		message := "Approval berhasil disetujui, equipment berubah menjadi IDLE"
		if input.Action == "REVISION" {
			message = "Approval dikembalikan untuk revisi"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": message,
			"data": gin.H{
				"id":              approval.ID,
				"request_number":  approval.RequestNumber,
				"approval_status": approval.ApprovalStatus,
				"status_label":    constants.ApprovalStatusLabel(approval.ApprovalStatus),
				"reviewed_by":     userNPP,
			},
		})
	}
}

// StartReview mengupdate status approval menjadi IN_REVIEW (Sedang Direview)
func StartReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var approval models.ApprovalRequest
		if err := db.First(&approval, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{ "status": "error", "message": "Approval tidak ditemukan" })
			return
		}
		approval.ApprovalStatus = constants.ApprovalStatusInReview
		approval.UpdatedBy = c.GetUint("user_id")
		approval.UpdatedAt = time.Now()
		if err := db.Save(&approval).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{ "status": "error", "message": "Gagal memulai review" })
			return
		}
		c.JSON(http.StatusOK, gin.H{ "status": "success", "message": "Review dimulai" })
	}
}
