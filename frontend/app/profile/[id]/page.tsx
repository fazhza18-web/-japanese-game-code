"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileUserId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  
  const isOwnProfile = currentUser && currentUser.id === profileUserId;

  useEffect(() => {
    if (profileUserId) {
      fetchCurrentUser();
      fetchProfileUser(profileUserId);
      fetchUserPosts(profileUserId);
    }
  }, [profileUserId]);

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
    } catch (error) {
      console.error("Error fetching current user:", error);
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
      fetchUserPosts(profileUserId);
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
      fetchUserPosts(profileUserId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("เกิดข้อผิดพลาดในการลบคอมเมนต์");
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

  if (!profileUser) {
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
              {profileUser?.name?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {profileUser?.name || "ผู้ใช้"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profileUser?.email || ""}
            </Typography>
          </Box>
        </Paper>

        {/* Posts Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            โพสต์
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
                        </Typography>
                      </Box>
                      {isOwnProfile && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePost(post.id)}
                          title="ลบโพสต์"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
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
    </>
  );
}


