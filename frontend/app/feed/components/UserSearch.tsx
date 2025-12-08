"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SearchResult {
  id: string;
  name: string;
  email: string;
  status: "none" | "pending" | "accepted" | "sent";
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500); // Debounce 500ms
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/friends/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      }
      alert("ส่งคำขอเป็นเพื่อนสำเร็จ");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการส่งคำขอเป็นเพื่อน");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/friends/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ยอมรับคำขอเป็นเพื่อนสำเร็จ");
      fetchPendingRequests();
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      }
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/friends/reject/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ปฏิเสธคำขอเป็นเพื่อนแล้ว");
      fetchPendingRequests();
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    if (showPendingRequests) {
      fetchPendingRequests();
    }
  }, [showPendingRequests]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case "accepted":
        return <Chip label="เป็นเพื่อนแล้ว" color="success" size="small" icon={<CheckCircleIcon />} />;
      case "pending":
        return <Chip label="รอการยอมรับ" color="warning" size="small" icon={<HourglassEmptyIcon />} />;
      case "sent":
        return <Chip label="ส่งคำขอแล้ว" color="info" size="small" icon={<HourglassEmptyIcon />} />;
      default:
        return null;
    }
  };

  const getActionButton = (user: SearchResult) => {
    switch (user.status) {
      case "accepted":
        return (
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckCircleIcon />}
            disabled
          >
            เป็นเพื่อนแล้ว
          </Button>
        );
      case "pending":
        return (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<HourglassEmptyIcon />}
            disabled
          >
            รอการยอมรับ
          </Button>
        );
      case "sent":
        return (
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<HourglassEmptyIcon />}
            disabled
          >
            ส่งคำขอแล้ว
          </Button>
        );
      default:
        return (
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => sendFriendRequest(user.id)}
          >
            เพิ่มเพื่อน
          </Button>
        );
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="ค้นหาผู้ใช้ (ชื่อหรืออีเมล)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            onClick={() => setShowPendingRequests(true)}
            startIcon={<PersonIcon />}
          >
            คำขอเป็นเพื่อน
            {pendingRequests.length > 0 && (
              <Chip
                label={pendingRequests.length}
                size="small"
                color="error"
                sx={{ ml: 1, minWidth: 20, height: 20 }}
              />
            )}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && searchResults.length > 0 && (
          <List>
            {searchResults.map((user) => {
              return (
                <ListItem
                  key={user.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  secondaryAction={getActionButton(user)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ cursor: "pointer" }}
                          onClick={() => router.push(`/profile/${user.id}`)}
                        >
                          {user.name}
                        </Typography>
                        {getStatusChip(user.status)}
                      </Box>
                    }
                    secondary={user.email}
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", p: 2 }}>
            ไม่พบผู้ใช้
          </Typography>
        )}

        {searchQuery.trim().length < 2 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", p: 2 }}>
            พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
          </Typography>
        )}
      </Paper>

      {/* Pending Requests Dialog */}
      <Dialog
        open={showPendingRequests}
        onClose={() => setShowPendingRequests(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>คำขอเป็นเพื่อน</DialogTitle>
        <DialogContent>
          {pendingRequests.length > 0 ? (
            <List>
              {pendingRequests.map((request: any) => (
                <ListItem
                  key={request.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                  }}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => acceptFriendRequest(request.id)}
                      >
                        ยอมรับ
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        ปฏิเสธ
                      </Button>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {request.requester.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          router.push(`/profile/${request.requester.id}`);
                          setShowPendingRequests(false);
                        }}
                      >
                        {request.requester.name}
                      </Typography>
                    }
                    secondary={request.requester.email}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", p: 2 }}>
              ไม่มีคำขอเป็นเพื่อน
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPendingRequests(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

