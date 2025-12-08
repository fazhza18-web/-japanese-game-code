package models

import (
	"time"

	"github.com/google/uuid"
)

type FriendRequest struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	RequesterID string  `gorm:"type:varchar(36);not null;index" json:"requesterId"`
	Requester   User    `gorm:"foreignKey:RequesterID" json:"requester"`
	ReceiverID  string  `gorm:"type:varchar(36);not null;index" json:"receiverId"`
	Receiver    User    `gorm:"foreignKey:ReceiverID" json:"receiver"`
	Status      string  `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, accepted, rejected
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (FriendRequest) TableName() string {
	return "friend_requests"
}

func NewFriendRequest(requesterID, receiverID string) *FriendRequest {
	return &FriendRequest{
		ID:          uuid.New().String(),
		RequesterID: requesterID,
		ReceiverID:  receiverID,
		Status:      "pending",
	}
}

type BlockedUser struct {
	ID          string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID      string    `gorm:"type:varchar(36);not null;index" json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"user"`
	BlockedUserID string  `gorm:"type:varchar(36);not null;index" json:"blockedUserId"`
	BlockedUser   User    `gorm:"foreignKey:BlockedUserID" json:"blockedUser"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (BlockedUser) TableName() string {
	return "blocked_users"
}

func NewBlockedUser(userID, blockedUserID string) *BlockedUser {
	return &BlockedUser{
		ID:            uuid.New().String(),
		UserID:        userID,
		BlockedUserID: blockedUserID,
	}
}

