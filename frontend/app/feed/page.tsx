"use client";

import { useState, useEffect } from "react";
import TypingGame from "./components/TypingGame";
import UserSearch from "./components/UserSearch";
import Chat from "../components/Chat";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Send as SendIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Post {
  id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  comments: number;
  reactions?: Record<string, number>;
  userReaction?: string;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [showReactions, setShowReactions] = useState<Record<string, boolean>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [reactionTimeouts, setReactionTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState<Record<string, string>>({});
  const [editCommentContent, setEditCommentContent] = useState<Record<string, string>>({});
  const [postMenuAnchor, setPostMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [viewingPostHistory, setViewingPostHistory] = useState<string | null>(null);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchUser();

    const interval = setInterval(() => {
      fetchPostsSilently();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 seconds timeout
      });
      if (Array.isArray(response.data)) {
        setPosts(response.data);
        response.data.forEach((post: Post) => {
          fetchReactions(post.id);
        });
      } else {
        console.warn("API response is not an array:", response.data);
        setPosts([]);
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.error("Backend server might not be running. Please check if backend is running on", API_URL);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend กำลังรันอยู่ที่ " + API_URL);
      }
      setPosts([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsSilently = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      const response = await axios.get(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 seconds timeout
      });
      if (Array.isArray(response.data)) {
        const newPostIds = response.data.map((p: Post) => p.id).join(",");
        const currentPostIds = posts.map((p) => p.id).join(",");
        
        if (newPostIds !== currentPostIds) {
          setPosts(response.data);
          response.data.forEach((post: Post) => {
            fetchReactions(post.id);
          });
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/posts`,
        { content: newPost },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPosts([response.data, ...(posts || [])]);
      setNewPost("");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("เกิดข้อผิดพลาดในการโพสต์");
    }
  };

  const handleReaction = async (postId: string, reaction: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/reactions`,
        { reaction },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setUserReactions((prev) => ({
        ...prev,
        [postId]: response.data.userReaction || "",
      }));
      
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: response.data.reactions,
                userReaction: response.data.userReaction || undefined,
              }
            : post
        )
      );
      
      setTimeout(() => {
        setShowReactions((prev) => ({ ...prev, [postId]: false }));
      }, 100);
    } catch (error: any) {
      console.error("Error reacting to post:", error);
      if (error.response?.status === 404) {
        alert("API endpoint ไม่พบ กรุณา restart backend server");
      } else {
        alert("เกิดข้อผิดพลาดในการส่ง reaction");
      }
    }
  };

  const fetchReactions = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/${postId}/reactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUserReactions((prev) => ({
        ...prev,
        [postId]: response.data.userReaction || "",
      }));
      
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: response.data.reactions,
                userReaction: response.data.userReaction || undefined,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error fetching reactions:", error);
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
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => ({ ...prev, [postId]: response.data || [] }));
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      if (error.response?.status === 404) {
        setComments((prev) => ({ ...prev, [postId]: [] }));
      } else {
        alert("เกิดข้อผิดพลาดในการโหลดคอมเมนต์");
      }
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/comments`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data],
      }));
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts(); // Refresh to update comment count
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("เกิดข้อผิดพลาดในการคอมเมนต์");
    }
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
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
      setPosts((prev) =>
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
    const comment = comments[postId]?.find((c) => c.id === commentId);
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
        [postId]: (prev[postId] || []).map((c) =>
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
    } catch (error: any) {
      console.error("Error updating comment:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขคอมเมนต์");
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
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Social Feed
          </Typography>
          <IconButton color="inherit" onClick={() => router.push("/profile")}>
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <UserSearch />
        <TypingGame />
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              🔄 อัปเดตอัตโนมัติทุก 5 วินาที
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="คุณกำลังคิดอะไรอยู่?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleCreatePost}
            disabled={!newPost.trim()}
          >
            โพสต์
          </Button>
        </Paper>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {posts && Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
            <Card key={post.id}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {post.authorName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        component="a"
                        href={`/profile/${post.author}`}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/profile/${post.author}`);
                        }}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "none",
                          color: "inherit",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {post.authorName}
                      </Typography>
                      <Typography
                        variant="caption"
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
                          display: "block",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {new Date(post.createdAt).toLocaleString("th-TH")}
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <span style={{ color: "#1976d2", fontSize: "0.75rem", marginLeft: "4px" }}>
                            ✏️ แก้ไขเมื่อ {new Date(post.updatedAt).toLocaleString("th-TH")}
                          </span>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  {post.author === user?.id && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditPost(post.id)}
                      title="แก้ไขโพสต์"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body1">{post.content}</Typography>
              </CardContent>
              <CardActions>
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    mr: 2,
                  }}
                  onMouseEnter={() => {
                    if (reactionTimeouts[post.id]) {
                      clearTimeout(reactionTimeouts[post.id]);
                    }
                    setShowReactions((prev) => ({ ...prev, [post.id]: true }));
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => {
                      setShowReactions((prev) => ({ ...prev, [post.id]: false }));
                    }, 200);
                    setReactionTimeouts((prev) => ({ ...prev, [post.id]: timeout }));
                  }}
                >
                  {/* Reactions Picker */}
                  {showReactions[post.id] && (
                    <Paper
                      sx={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        mb: 1,
                        p: 0.5,
                        display: "flex",
                        gap: 0.5,
                        borderRadius: 3,
                        boxShadow: 3,
                        zIndex: 1000,
                        pointerEvents: "auto",
                      }}
                      onMouseEnter={() => {
                        if (reactionTimeouts[post.id]) {
                          clearTimeout(reactionTimeouts[post.id]);
                        }
                        setShowReactions((prev) => ({ ...prev, [post.id]: true }));
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => {
                          setShowReactions((prev) => ({ ...prev, [post.id]: false }));
                        }, 200);
                        setReactionTimeouts((prev) => ({ ...prev, [post.id]: timeout }));
                      }}
                    >
                      {[
                        { type: "like", emoji: "👍", label: "Like" },
                        { type: "love", emoji: "❤️", label: "Love" },
                        { type: "haha", emoji: "😂", label: "Haha" },
                        { type: "wow", emoji: "😮", label: "Wow" },
                        { type: "sad", emoji: "😢", label: "Sad" },
                        { type: "angry", emoji: "😠", label: "Angry" },
                      ].map((reaction) => (
                        <IconButton
                          key={reaction.type}
                          size="small"
                          onClick={() => handleReaction(post.id, reaction.type)}
                          sx={{
                            fontSize: "24px",
                            width: 40,
                            height: 40,
                            "&:hover": {
                              transform: "scale(1.3)",
                              transition: "transform 0.2s",
                            },
                          }}
                          title={reaction.label}
                        >
                          {reaction.emoji}
                        </IconButton>
                      ))}
                    </Paper>
                  )}

                  {/* Reaction Button */}
                  <IconButton
                    size="small"
                    onClick={() => {
                      const currentReaction = post.userReaction || userReactions[post.id];
                      if (currentReaction) {
                        // Remove reaction
                        handleReaction(post.id, currentReaction);
                      } else {
                        // Default to like
                        handleReaction(post.id, "like");
                      }
                    }}
                    color={
                      post.userReaction || userReactions[post.id]
                        ? "primary"
                        : "default"
                    }
                    sx={{
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {(() => {
                      const reaction = post.userReaction || userReactions[post.id];
                      const reactions = {
                        like: "👍",
                        love: "❤️",
                        haha: "😂",
                        wow: "😮",
                        sad: "😢",
                        angry: "😠",
                      };
                      // Always show emoji, default to like if no reaction
                      return (
                        <span style={{ fontSize: "20px" }}>
                          {reaction
                            ? reactions[reaction as keyof typeof reactions]
                            : "👍"}
                        </span>
                      );
                    })()}
                  </IconButton>

                  {/* Reactions Summary */}
                  <Box sx={{ ml: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                    {post.reactions && Object.keys(post.reactions).length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        {Object.entries(post.reactions)
                          .filter(([_, count]) => count > 0)
                          .slice(0, 3)
                          .map(([type, count]) => {
                            const reactions = {
                              like: "👍",
                              love: "❤️",
                              haha: "😂",
                              wow: "😮",
                              sad: "😢",
                              angry: "😠",
                            };
                            return (
                              <Typography
                                key={type}
                                variant="body2"
                                sx={{ fontSize: "14px" }}
                              >
                                {reactions[type as keyof typeof reactions]}
                              </Typography>
                            );
                          })}
                        <Typography variant="body2">
                          {Object.values(post.reactions).reduce(
                            (sum, count) => sum + count,
                            0
                          )}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">0</Typography>
                    )}
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleToggleComments(post.id)}
                >
                  <CommentIcon />
                </IconButton>
                <Typography variant="body2">{post.comments}</Typography>
              </CardActions>

              {expandedPost === post.id && (
                <Box sx={{ p: 2, pt: 0, borderTop: "1px solid", borderColor: "divider" }}>
                  {/* Comment Form */}
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="เขียนคอมเมนต์..."
                      value={newComments[post.id] || ""}
                      onChange={(e) =>
                        setNewComments((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                    >
                      ส่ง
                    </Button>
                  </Box>

                  {/* Comments List */}
                  {loadingComments[post.id] ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {comments[post.id] && comments[post.id].length > 0 ? (
                        comments[post.id].map((comment) => (
                          <Box
                            key={comment.id}
                            sx={{
                              display: "flex",
                              gap: 1,
                              p: 1.5,
                              bgcolor: "action.hover",
                              borderRadius: 1,
                            }}
                          >
                            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                              {comment.authorName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {comment.authorName}
                                  </Typography>
                                  {comment.authorId === user?.id && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditComment(comment.id, post.id)}
                                      sx={{ width: 20, height: 20 }}
                                      title="แก้ไขคอมเมนต์"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
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
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                          ยังไม่มีคอมเมนต์
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Card>
          ))
          ) : (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ยังไม่มีโพสต์ เริ่มต้นโพสต์ข้อความแรกของคุณเลย!
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
                  comments[pid].some((c) => c.id === editingComment)
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
        onClose={() => setViewingPostHistory(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ประวัติการแก้ไขโพสต์</DialogTitle>
        <DialogContent>
          {viewingPostHistory && (() => {
            const post = posts.find((p) => p.id === viewingPostHistory);
            if (!post) return null;
            return (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  สร้างเมื่อ:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(post.createdAt).toLocaleString("th-TH")}
                </Typography>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      แก้ไขล่าสุดเมื่อ:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {new Date(post.updatedAt).toLocaleString("th-TH")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      จำนวนครั้งที่แก้ไข: 1 ครั้ง
                    </Typography>
                  </>
                )}
                {(!post.updatedAt || post.updatedAt === post.createdAt) && (
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่เคยแก้ไข
                  </Typography>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingPostHistory(null)}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Component */}
      <Chat />
    </>
  );
}

