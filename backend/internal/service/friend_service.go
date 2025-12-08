package service

import (
	"errors"
	"typinggame-api/internal/models"
	"typinggame-api/internal/repository"
)

type FriendService interface {
	SendFriendRequest(requesterID, receiverID string) error
	AcceptFriendRequest(requestID, userID string) error
	RejectFriendRequest(requestID, userID string) error
	DeleteFriend(userID1, userID2 string) error
	GetPendingRequests(userID string) ([]models.FriendRequest, error)
	GetFriends(userID string) ([]models.User, error)
	SearchUsers(query string, excludeUserID string, limit int) ([]models.User, error)
	GetFriendStatus(userID1, userID2 string) (string, error) // "none", "pending", "accepted", "sent"
	BlockUser(userID, blockedUserID string) error
	UnblockUser(userID, blockedUserID string) error
	IsBlocked(userID1, userID2 string) (bool, error)
	GetBlockedUsers(userID string) ([]models.User, error)
}

type friendService struct {
	friendRepo repository.FriendRepository
}

func NewFriendService(friendRepo repository.FriendRepository) FriendService {
	return &friendService{friendRepo: friendRepo}
}

func (s *friendService) SendFriendRequest(requesterID, receiverID string) error {
	if requesterID == receiverID {
		return errors.New("cannot send friend request to yourself")
	}

	// Check if request already exists
	existing, err := s.friendRepo.FindRequest(requesterID, receiverID)
	if err == nil && existing != nil {
		if existing.Status == "pending" {
			return errors.New("friend request already pending")
		}
		if existing.Status == "accepted" {
			return errors.New("already friends")
		}
		// If status is "rejected", delete the old request and create a new one
		if existing.Status == "rejected" {
			// Delete the rejected request
			if err := s.friendRepo.DeleteRequest(requesterID, receiverID); err != nil {
				return err
			}
		}
	}

	request := models.NewFriendRequest(requesterID, receiverID)
	return s.friendRepo.CreateRequest(request)
}

func (s *friendService) AcceptFriendRequest(requestID, userID string) error {
	request, err := s.friendRepo.FindRequestByID(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if request.ReceiverID != userID {
		return errors.New("unauthorized")
	}

	if request.Status != "pending" {
		return errors.New("request already processed")
	}

	request.Status = "accepted"
	return s.friendRepo.UpdateRequest(request)
}

func (s *friendService) RejectFriendRequest(requestID, userID string) error {
	request, err := s.friendRepo.FindRequestByID(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if request.ReceiverID != userID {
		return errors.New("unauthorized")
	}

	request.Status = "rejected"
	return s.friendRepo.UpdateRequest(request)
}

func (s *friendService) GetPendingRequests(userID string) ([]models.FriendRequest, error) {
	return s.friendRepo.GetPendingRequests(userID)
}

func (s *friendService) GetFriends(userID string) ([]models.User, error) {
	return s.friendRepo.GetFriends(userID)
}

func (s *friendService) SearchUsers(query string, excludeUserID string, limit int) ([]models.User, error) {
	return s.friendRepo.SearchUsers(query, excludeUserID, limit)
}

func (s *friendService) GetFriendStatus(userID1, userID2 string) (string, error) {
	// Check if blocked
	blocked, err := s.friendRepo.IsBlocked(userID1, userID2)
	if err == nil && blocked {
		return "blocked", nil
	}

	request, err := s.friendRepo.FindRequest(userID1, userID2)
	if err != nil {
		return "none", nil // No request exists
	}

	if request.Status == "accepted" {
		return "accepted", nil
	}

	// If status is rejected, return "none" so user can send request again
	if request.Status == "rejected" {
		return "none", nil
	}

	if request.RequesterID == userID1 {
		return "sent", nil
	}

	if request.ReceiverID == userID1 {
		return "pending", nil
	}

	return "none", nil
}

func (s *friendService) DeleteFriend(userID1, userID2 string) error {
	// Verify they are friends
	isFriend, err := s.friendRepo.IsFriend(userID1, userID2)
	if err != nil {
		return err
	}
	if !isFriend {
		return errors.New("not friends")
	}
	// DeleteRequest now deletes regardless of status, which is fine for deleting friends
	return s.friendRepo.DeleteRequest(userID1, userID2)
}

func (s *friendService) BlockUser(userID, blockedUserID string) error {
	if userID == blockedUserID {
		return errors.New("cannot block yourself")
	}
	// Delete friend relationship if exists
	s.friendRepo.DeleteRequest(userID, blockedUserID)
	return s.friendRepo.BlockUser(userID, blockedUserID)
}

func (s *friendService) UnblockUser(userID, blockedUserID string) error {
	return s.friendRepo.UnblockUser(userID, blockedUserID)
}

func (s *friendService) IsBlocked(userID1, userID2 string) (bool, error) {
	return s.friendRepo.IsBlocked(userID1, userID2)
}

func (s *friendService) GetBlockedUsers(userID string) ([]models.User, error) {
	return s.friendRepo.GetBlockedUsers(userID)
}

