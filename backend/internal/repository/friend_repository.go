package repository

import (
	"typinggame-api/internal/models"
	"gorm.io/gorm"
)

type FriendRepository interface {
	CreateRequest(request *models.FriendRequest) error
	FindRequest(requesterID, receiverID string) (*models.FriendRequest, error)
	FindRequestByID(requestID string) (*models.FriendRequest, error)
	UpdateRequest(request *models.FriendRequest) error
	DeleteRequest(requesterID, receiverID string) error
	GetPendingRequests(userID string) ([]models.FriendRequest, error)
	GetFriends(userID string) ([]models.User, error)
	SearchUsers(query string, excludeUserID string, limit int) ([]models.User, error)
	IsFriend(userID1, userID2 string) (bool, error)
	BlockUser(userID, blockedUserID string) error
	UnblockUser(userID, blockedUserID string) error
	IsBlocked(userID, blockedUserID string) (bool, error)
	GetBlockedUsers(userID string) ([]models.User, error)
}

type friendRepository struct {
	db *gorm.DB
}

func NewFriendRepository(db *gorm.DB) FriendRepository {
	return &friendRepository{db: db}
}

func (r *friendRepository) CreateRequest(request *models.FriendRequest) error {
	return r.db.Create(request).Error
}

func (r *friendRepository) FindRequest(requesterID, receiverID string) (*models.FriendRequest, error) {
	var request models.FriendRequest
	err := r.db.Where("(requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
		requesterID, receiverID, receiverID, requesterID).
		Preload("Requester").
		Preload("Receiver").
		First(&request).Error
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *friendRepository) FindRequestByID(requestID string) (*models.FriendRequest, error) {
	var request models.FriendRequest
	err := r.db.Preload("Requester").
		Preload("Receiver").
		Where("id = ?", requestID).
		First(&request).Error
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *friendRepository) UpdateRequest(request *models.FriendRequest) error {
	return r.db.Save(request).Error
}

func (r *friendRepository) GetPendingRequests(userID string) ([]models.FriendRequest, error) {
	var requests []models.FriendRequest
	err := r.db.Where("receiver_id = ? AND status = ?", userID, "pending").
		Preload("Requester").
		Order("created_at DESC").
		Find(&requests).Error
	return requests, err
}

func (r *friendRepository) GetFriends(userID string) ([]models.User, error) {
	var friends []models.User
	
	// Use a simpler approach: get all accepted friend requests where user is involved
	var requests []models.FriendRequest
	err := r.db.Where("(requester_id = ? OR receiver_id = ?) AND status = ?", userID, userID, "accepted").
		Preload("Requester").
		Preload("Receiver").
		Find(&requests).Error
	if err != nil {
		return nil, err
	}
	
	// Build friend map
	friendMap := make(map[string]models.User)
	for _, req := range requests {
		if req.RequesterID == userID {
			// User is requester, friend is receiver
			if req.Receiver.ID != "" {
				friendMap[req.Receiver.ID] = req.Receiver
			}
		} else {
			// User is receiver, friend is requester
			if req.Requester.ID != "" {
				friendMap[req.Requester.ID] = req.Requester
			}
		}
	}
	
	// Convert map to slice
	for _, friend := range friendMap {
		friends = append(friends, friend)
	}
	
	return friends, nil
}

func (r *friendRepository) SearchUsers(query string, excludeUserID string, limit int) ([]models.User, error) {
	var users []models.User
	
	// Get all blocked user IDs (both directions: user blocked them OR they blocked user)
	var blockedIDs []string
	
	// Users that excludeUserID has blocked
	var blockedByMe []models.BlockedUser
	r.db.Where("user_id = ?", excludeUserID).Find(&blockedByMe)
	for _, b := range blockedByMe {
		blockedIDs = append(blockedIDs, b.BlockedUserID)
	}
	
	// Users that have blocked excludeUserID
	var blockedMe []models.BlockedUser
	r.db.Where("blocked_user_id = ?", excludeUserID).Find(&blockedMe)
	for _, b := range blockedMe {
		blockedIDs = append(blockedIDs, b.UserID)
	}
	
	// Build query excluding blocked users
	queryBuilder := r.db.Where("(name LIKE ? OR email LIKE ?) AND id != ?", "%"+query+"%", "%"+query+"%", excludeUserID)
	
	// Exclude blocked users if any
	if len(blockedIDs) > 0 {
		queryBuilder = queryBuilder.Where("id NOT IN ?", blockedIDs)
	}
	
	err := queryBuilder.Limit(limit).Find(&users).Error
	return users, err
}

func (r *friendRepository) IsFriend(userID1, userID2 string) (bool, error) {
	var count int64
	err := r.db.Model(&models.FriendRequest{}).
		Where("((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)) AND status = ?",
			userID1, userID2, userID2, userID1, "accepted").
		Count(&count).Error
	return count > 0, err
}

func (r *friendRepository) DeleteRequest(requesterID, receiverID string) error {
	// Delete friend request regardless of status (for accepted friends or rejected requests)
	return r.db.Where("(requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
		requesterID, receiverID, receiverID, requesterID).
		Delete(&models.FriendRequest{}).Error
}

func (r *friendRepository) BlockUser(userID, blockedUserID string) error {
	blocked := models.NewBlockedUser(userID, blockedUserID)
	return r.db.Create(blocked).Error
}

func (r *friendRepository) UnblockUser(userID, blockedUserID string) error {
	return r.db.Where("user_id = ? AND blocked_user_id = ?", userID, blockedUserID).
		Delete(&models.BlockedUser{}).Error
}

func (r *friendRepository) IsBlocked(userID, blockedUserID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.BlockedUser{}).
		Where("(user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)",
			userID, blockedUserID, blockedUserID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *friendRepository) GetBlockedUsers(userID string) ([]models.User, error) {
	var blockedUsers []models.BlockedUser
	err := r.db.Where("user_id = ?", userID).
		Preload("BlockedUser").
		Find(&blockedUsers).Error
	if err != nil {
		return nil, err
	}
	
	var users []models.User
	for _, bu := range blockedUsers {
		if bu.BlockedUser.ID != "" {
			users = append(users, bu.BlockedUser)
		}
	}
	
	return users, nil
}

