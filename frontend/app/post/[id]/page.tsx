"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  TextField,
  Button,
  Divider,
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
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userReaction, setUserReaction] = useState<string>("");
  const [showReactions, setShowReactions] = useState(false);
  const [reactionTimeout, setReactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState<Record<string, string>>({});
  const [postMenuAnchor, setPostMenuAnchor] = useState<HTMLElement | null>(null);
  const [viewingPostHistory, setViewingPostHistory] = useState(false);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      fetchUser();
    }
  }, [postId]);

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
    }
  };

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPost(response.data);
      
      const reactionResponse = await axios.get(`${API_URL}/api/posts/${postId}/reactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserReaction(reactionResponse.data.userReaction || "");
    } catch (error) {
      console.error("Error fetching post:", error);
      alert("ไม่พบโพสต์");
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/posts/${postId}/comments`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewComment("");
      fetchComments();
      fetchPost(); // Refresh to update comment count
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("เกิดข้อผิดพลาดในการคอมเมนต์");
    }
  };

  const handleReaction = async (reaction: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/reactions`,
        { reaction },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setUserReaction(response.data.userReaction || "");
      setPost((prev) =>
        prev
          ? {
              ...prev,
              reactions: response.data.reactions,
              userReaction: response.data.userReaction || undefined,
            }
          : null
      );
      
      setShowReactions(false);
    } catch (error) {
      console.error("Error reacting to post:", error);
    }
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditCommentContent((prev) => ({ ...prev, [commentId]: comment.content }));
      setEditingComment(commentId);
    }
  };

  const handleSaveComment = async (commentId: string) => {
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
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...response.data } : c))
      );
      setEditingComment(null);
      setEditCommentContent((prev) => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
      alert("แก้ไขคอมเมนต์สำเร็จ");
      fetchPost(); // Refresh
    } catch (error: any) {
      console.error("Error updating comment:", error);
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขคอมเมนต์");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคอมเมนต์นี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ลบคอมเมนต์สำเร็จ");
      fetchComments();
      fetchPost();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("เกิดข้อผิดพลาดในการลบคอมเมนต์");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("ลบโพสต์สำเร็จ");
      router.push("/feed");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  const fetchPostHistory = async () => {
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

  if (!post) {
    return null;
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
            โพสต์
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
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
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.createdAt).toLocaleString("th-TH")}
                  </Typography>
                </Box>
              </Box>
              {post.author === user?.id && (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setPostMenuAnchor(e.currentTarget);
                    }}
                    title="เมนู"
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={postMenuAnchor}
                    open={Boolean(postMenuAnchor)}
                    onClose={() => setPostMenuAnchor(null)}
                  >
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                      <MenuItem
                        onClick={async () => {
                          await fetchPostHistory();
                          setViewingPostHistory(true);
                          setPostMenuAnchor(null);
                        }}
                      >
                        <ListItemIcon>
                          <HistoryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>ดูประวัติแก้ไข</ListItemText>
                      </MenuItem>
                    )}
                    <MenuItem
                      onClick={() => {
                        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?")) {
                          handleDeletePost();
                        }
                        setPostMenuAnchor(null);
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
                      </ListItemIcon>
                      <ListItemText>ลบโพสต์</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {post.content}
            </Typography>
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
                if (reactionTimeout) {
                  clearTimeout(reactionTimeout);
                }
                setShowReactions(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setShowReactions(false);
                }, 200);
                setReactionTimeout(timeout);
              }}
            >
              {showReactions && (
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
                  }}
                  onMouseEnter={() => {
                    if (reactionTimeout) {
                      clearTimeout(reactionTimeout);
                    }
                    setShowReactions(true);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => {
                      setShowReactions(false);
                    }, 200);
                    setReactionTimeout(timeout);
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
                      onClick={() => handleReaction(reaction.type)}
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

              <IconButton
                size="small"
                onClick={() => {
                  if (userReaction) {
                    handleReaction(userReaction);
                  } else {
                    handleReaction("like");
                  }
                }}
                color={userReaction ? "primary" : "default"}
              >
                <span style={{ fontSize: "20px" }}>
                  {userReaction
                    ? {
                        like: "👍",
                        love: "❤️",
                        haha: "😂",
                        wow: "😮",
                        sad: "😢",
                        angry: "😠",
                      }[userReaction] || "👍"
                    : "👍"}
                </span>
              </IconButton>

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
                          <Typography key={type} variant="body2" sx={{ fontSize: "14px" }}>
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

            <IconButton size="small" color="primary">
              <CommentIcon />
            </IconButton>
            <Typography variant="body2">{post.comments || 0}</Typography>
          </CardActions>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Comments Section */}
        <Typography variant="h6" gutterBottom>
          คอมเมนต์
        </Typography>

        {/* Comment Form */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="เขียนคอมเมนต์..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            endIcon={<SendIcon />}
          >
            ส่ง
          </Button>
        </Box>

        {/* Comments List */}
        {loadingComments ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : comments.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {comments.map((comment) => (
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
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleEditComment(comment.id)}
                            sx={{ width: 20, height: 20 }}
                            title="แก้ไขคอมเมนต์"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteComment(comment.id)}
                            sx={{ width: 20, height: 20 }}
                            title="ลบคอมเมนต์"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
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
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              ยังไม่มีคอมเมนต์
            </Typography>
          </Paper>
        )}
      </Container>

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
            onClick={() => editingComment && handleSaveComment(editingComment)}
            variant="contained"
            disabled={!editingComment || !editCommentContent[editingComment]?.trim()}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post History Dialog */}
      <Dialog
        open={viewingPostHistory}
        onClose={() => {
          setViewingPostHistory(false);
          setPostHistory([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ประวัติการแก้ไขโพสต์</DialogTitle>
        <DialogContent>
          {post && (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewingPostHistory(false);
            setPostHistory([]);
          }}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

