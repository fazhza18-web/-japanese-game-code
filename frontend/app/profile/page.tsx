"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Chat from "../components/Chat";
import {
  Container,
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  PersonRemove as PersonRemoveIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState<Record<string, string>>({});
  const [editCommentContent, setEditCommentContent] = useState<Record<string, string>>({});
  const [postMenuAnchor, setPostMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [viewingPostHistory, setViewingPostHistory] = useState<string | null>(null);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [friendsTab, setFriendsTab] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const isOwnProfile = !params?.id;
  const displayUser = currentUser;

  useEffect(() => {
    fetchCurrentUser();
    fetchMyPosts();
  }, []);

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      fetchFriends();
      fetchBlockedUsers();
    }
  }, [isOwnProfile, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
      setName(response.data.name);
    } catch (error) {
      console.error("Error fetching current user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileUser(response.data);
    } catch (error) {
      console.error("Error fetching profile user:", error);
      alert("ไม่พบผู้ใช้");
      router.push("/feed");
    }
  };

  const fetchUserPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPosts(response.data || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleUpdate = async () => {
    if (!isOwnProfile) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/user/me`,
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentUser(response.data);
      alert("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setUpdating(false);
    }
  };

  const fetchMyPosts = async () => {
    setLoadingPosts(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/posts/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPosts(response.data || []);
    } catch (error) {
      console.error("Error fetching my posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ลบโพสต์สำเร็จ");
      fetchMyPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        await fetchComments(postId);
      }
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => ({ ...prev, [postId]: response.data || [] }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคอมเมนต์นี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ลบคอมเมนต์สำเร็จ");
      fetchComments(postId);
      fetchMyPosts(); // Refresh to update comment count
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("เกิดข้อผิดพลาดในการลบคอมเมนต์");
    }
  };

  const handleEditPost = (postId: string) => {
    const post = myPosts.find((p) => p.id === postId);
    if (post) {
      setEditPostContent((prev) => ({ ...prev, [postId]: post.content }));
      setEditingPost(postId);
    }
  };

  const handleSavePost = async (postId: string) => {
    const content = editPostContent[postId]?.trim();
    if (!content) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/posts/${postId}`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMyPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...response.data } : p))
      );
      setEditingPost(null);
      setEditPostContent((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
      alert("แก้ไขโพสต์สำเร็จ");
    } catch (error: any) {
      console.error("Error updating post:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขโพสต์");
    }
  };

  const handleEditComment = (commentId: string, postId: string) => {
    const comment = comments[postId]?.find((c: any) => c.id === commentId);
    if (comment) {
      setEditCommentContent((prev) => ({ ...prev, [commentId]: comment.content }));
      setEditingComment(commentId);
    }
  };

  const handleSaveComment = async (commentId: string, postId: string) => {
    const content = editCommentContent[commentId]?.trim();
    if (!content) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/comments/${commentId}`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c: any) =>
          c.id === commentId ? { ...c, ...response.data } : c
        ),
      }));
      setEditingComment(null);
      setEditCommentContent((prev) => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
      alert("แก้ไขคอมเมนต์สำเร็จ");
      fetchMyPosts(); // Refresh to update
    } catch (error: any) {
      console.error("Error updating comment:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขคอมเมนต์");
    }
  };

  const fetchPostHistory = async (postId: string) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/${postId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching post history:", error);
      setPostHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(response.data || []);
    } catch (error: any) {
      console.error("Error fetching friends:", error);
      console.error("Error response:", error.response?.data);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/friends/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Blocked users API response:", response.data);
      setBlockedUsers(response.data || []);
    } catch (error: any) {
      console.error("Error fetching blocked users:", error);
      console.error("Error response:", error.response?.data);
      setBlockedUsers([]);
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเพื่อนคนนี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ลบเพื่อนสำเร็จ");
      fetchFriends();
    } catch (error: any) {
      console.error("Error deleting friend:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการลบเพื่อน");
    }
  };

  const handleBlockFriend = async (friendId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการบล็อคเพื่อนคนนี้? การบล็อคจะลบความสัมพันธ์เพื่อนด้วย")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/friends/block/${friendId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("บล็อคผู้ใช้สำเร็จ");
      fetchFriends();
      fetchBlockedUsers();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการบล็อค");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/friends/unblock/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ยกเลิกการบล็อคสำเร็จ");
      fetchBlockedUsers();
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push("/feed")}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            โปรไฟล์
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: 40,
                mb: 2,
              }}
            >
              {displayUser?.name?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {displayUser?.name || "ผู้ใช้"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayUser?.email || ""}
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
              <TextField
                fullWidth
                label="ชื่อ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="อีเมล"
                value={displayUser?.email || ""}
                disabled
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdate}
                disabled={updating || name === displayUser?.name}
              >
                {updating ? "กำลังอัปเดต..." : "อัปเดตข้อมูล"}
              </Button>
            </Box>
        </Paper>

        {/* Friends Section - Only show on own profile */}
        {isOwnProfile && (
          <Paper sx={{ p: 3, mb: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              เพื่อนของฉัน
            </Typography>
            <Tabs value={friendsTab} onChange={(e, newValue) => setFriendsTab(newValue)} sx={{ mb: 2 }}>
              <Tab label={`เพื่อน (${friends.length})`} />
              <Tab label={`ผู้ใช้ที่บล็อค (${blockedUsers.length})`} />
            </Tabs>

            {friendsTab === 0 && (
              <Box>
                {loadingFriends ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : friends.length > 0 ? (
                  <List>
                    {friends.map((friend) => {
                      return (
                        <ListItem
                          key={friend.id}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            mb: 1,
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                          secondaryAction={
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<PersonRemoveIcon />}
                                onClick={() => handleDeleteFriend(friend.id)}
                              >
                                ลบเพื่อน
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<BlockIcon />}
                                onClick={() => handleBlockFriend(friend.id)}
                              >
                                บล็อค
                              </Button>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              {friend.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <MuiListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => router.push(`/profile/${friend.id}`)}
                                >
                                  {friend.name}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => {
                                    if ((window as any).startChatWithUser) {
                                      (window as any).startChatWithUser(friend.id);
                                    }
                                  }}
                                >
                                  แชท
                                </Button>
                              </Box>
                            }
                            secondary={friend.email}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", p: 3 }}>
                    ยังไม่มีเพื่อน
                  </Typography>
                )}
              </Box>
            )}

            {friendsTab === 1 && (
              <Box>
                {loadingFriends ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : blockedUsers.length > 0 ? (
                  <List>
                    {blockedUsers.map((user) => {
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
                          secondaryAction={
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleUnblockUser(user.id)}
                            >
                              ยกเลิกการบล็อค
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "error.main" }}>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <MuiListItemText
                            primary={user.name}
                            secondary={user.email}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", p: 3 }}>
                    ไม่มีผู้ใช้ที่บล็อค
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}

        {/* My Posts Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            โพสต์ของฉัน
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loadingPosts ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : myPosts.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {myPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="a"
                          href={`/post/${post.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/post/${post.id}`);
                          }}
                          sx={{
                            cursor: "pointer",
                            textDecoration: "none",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {new Date(post.createdAt).toLocaleString("th-TH")}
                          {post.updatedAt && post.updatedAt !== post.createdAt && (
                            <span style={{ color: "#1976d2", fontSize: "0.75rem", marginLeft: "4px", display: "block" }}>
                              ✏️ แก้ไขเมื่อ {new Date(post.updatedAt).toLocaleString("th-TH")}
                            </span>
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPost(post.id)}
                          title="แก้ไขโพสต์"
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePost(post.id)}
                          title="ลบโพสต์"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body1">{post.content}</Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" color="error">
                      <FavoriteIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      {post.reactions
                        ? Object.values(post.reactions).reduce(
                            (sum: number, count: any) => sum + count,
                            0
                          )
                        : 0}
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <CommentIcon />
                    </IconButton>
                    <Typography variant="body2">{post.comments || 0}</Typography>
                  </CardActions>

                  {expandedPost === post.id && (
                    <Box sx={{ p: 2, pt: 0, borderTop: "1px solid", borderColor: "divider" }}>
                      {comments[post.id] && comments[post.id].length > 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
                          {comments[post.id].map((comment: any) => (
                            <Box
                              key={comment.id}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                                gap: 1,
                                p: 1.5,
                                bgcolor: "action.hover",
                                borderRadius: 1,
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {comment.authorName}
                                </Typography>
                                <Typography variant="body2">{comment.content}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.createdAt).toLocaleString("th-TH")}
                                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                    <span style={{ color: "#1976d2", fontSize: "0.7rem", marginLeft: "4px", display: "block" }}>
                                      ✏️ แก้ไขเมื่อ {new Date(comment.updatedAt).toLocaleString("th-TH")}
                                    </span>
                                  )}
                                </Typography>
                              </Box>
                              {comment.authorId === currentUser?.id && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteComment(comment.id, post.id)}
                                  title="ลบคอมเมนต์"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                          ยังไม่มีคอมเมนต์
                        </Typography>
                      )}
                    </Box>
                  )}
                </Card>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ยังไม่มีโพสต์
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Edit Post Dialog */}
      <Dialog
        open={editingPost !== null}
        onClose={() => {
          setEditingPost(null);
          if (editingPost) {
            setEditPostContent((prev) => {
              const newState = { ...prev };
              delete newState[editingPost];
              return newState;
            });
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>แก้ไขโพสต์</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editingPost ? editPostContent[editingPost] || "" : ""}
            onChange={(e) => {
              if (editingPost) {
                setEditPostContent((prev) => ({
                  ...prev,
                  [editingPost]: e.target.value,
                }));
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingPost(null);
              if (editingPost) {
                setEditPostContent((prev) => {
                  const newState = { ...prev };
                  delete newState[editingPost];
                  return newState;
                });
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={() => editingPost && handleSavePost(editingPost)}
            variant="contained"
            disabled={!editingPost || !editPostContent[editingPost]?.trim()}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog
        open={editingComment !== null}
        onClose={() => {
          setEditingComment(null);
          if (editingComment) {
            setEditCommentContent((prev) => {
              const newState = { ...prev };
              delete newState[editingComment];
              return newState;
            });
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>แก้ไขคอมเมนต์</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editingComment ? editCommentContent[editingComment] || "" : ""}
            onChange={(e) => {
              if (editingComment) {
                setEditCommentContent((prev) => ({
                  ...prev,
                  [editingComment]: e.target.value,
                }));
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingComment(null);
              if (editingComment) {
                setEditCommentContent((prev) => {
                  const newState = { ...prev };
                  delete newState[editingComment];
                  return newState;
                });
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              if (editingComment) {
                const postId = Object.keys(comments).find((pid) =>
                  comments[pid].some((c: any) => c.id === editingComment)
                );
                if (postId) {
                  handleSaveComment(editingComment, postId);
                }
              }
            }}
            variant="contained"
            disabled={!editingComment || !editCommentContent[editingComment]?.trim()}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post History Dialog */}
      <Dialog
        open={viewingPostHistory !== null}
        onClose={() => {
          setViewingPostHistory(null);
          setPostHistory([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ประวัติการแก้ไขโพสต์</DialogTitle>
        <DialogContent>
          {viewingPostHistory && (() => {
            const post = myPosts.find((p) => p.id === viewingPostHistory);
            if (!post) return null;
            
            return (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  สร้างเมื่อ: {new Date(post.createdAt).toLocaleString("th-TH")}
                </Typography>
                
                {loadingHistory ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : postHistory.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      ประวัติการแก้ไข ({postHistory.length} ครั้ง)
                    </Typography>
                    {postHistory.map((history, index) => (
                      <Box
                        key={history.id}
                        sx={{
                          mb: 3,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          bgcolor: "action.hover",
                        }}
                      >
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          ครั้งที่ {postHistory.length - index} - {new Date(history.createdAt).toLocaleString("th-TH")}
                        </Typography>
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" color="error" gutterBottom>
                            เดิม:
                          </Typography>
                          <Paper
                            sx={{
                              p: 1.5,
                              mb: 1.5,
                              bgcolor: "background.paper",
                              borderLeft: "3px solid",
                              borderColor: "error.main",
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {history.oldContent || "(เนื้อหาเริ่มต้น)"}
                            </Typography>
                          </Paper>
                          <Typography variant="body2" color="success.main" gutterBottom>
                            เปลี่ยนเป็น:
                          </Typography>
                          <Paper
                            sx={{
                              p: 1.5,
                              bgcolor: "background.paper",
                              borderLeft: "3px solid",
                              borderColor: "success.main",
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {history.newContent}
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    ยังไม่เคยแก้ไข
                  </Typography>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewingPostHistory(null);
            setPostHistory([]);
          }}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Component */}
      <Chat />
    </>
  );
}

