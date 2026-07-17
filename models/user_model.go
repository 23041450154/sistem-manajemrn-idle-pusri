package models

import "time"

type User struct {
	Id        int       `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	NPP       string    `json:"npp" gorm:"uniqueIndex" validate:"required"`
	Password  string    `json:"password"`
	Role      string    `json:"role" gorm:"type:varchar(255);default:'UNIT_KERJA_OPERASI'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
