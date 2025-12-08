"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Badge,
  Button,
  Divider,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  updatedAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const interval = setInterval(() => {
        fetchMessages(selectedConversation, true);
      }, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/conversations/${conversationId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data || []);
      
      if (response.data && response.data.length > 0) {
        markAsRead(conversationId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/conversations/${conversationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/api/conversations/start/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedConversation(response.data.id);
      setIsOpen(true);
      setIsMinimized(false);
      fetchConversations();
    } catch (error: any) {
      alert(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    (window as any).startChatWithUser = handleStartConversation;
    return () => {
      delete (window as any).startChatWithUser;
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/conversations/${selectedConversation}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      fetchConversations(); // Update unread counts
    } catch (error: any) {
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            width: 56,
            height: 56,
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <Badge badgeContent={totalUnread} color="error">
            <ChatIcon />
          </Badge>
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: isMinimized ? 300 : 400,
        height: isMinimized ? 60 : 600,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
            แชท
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsMinimized(!isMinimized)}
            sx={{ color: "white" }}
          >
            {isMinimized ? "□" : "−"}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
              setSelectedConversation(null);
            }}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {!isMinimized && (
          <>
            {!selectedConversation ? (
              <Box sx={{ flex: 1, overflow: "auto" }}>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : conversations.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีแชท
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {conversations.map((conv) => (
                      <ListItem
                        key={conv.id}
                        button
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          markAsRead(conv.id);
                        }}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="subtitle2">
                                {conv.otherUser.name}
                              </Typography>
                              {conv.unreadCount > 0 && (
                                <Badge badgeContent={conv.unreadCount} color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {new Date(conv.updatedAt).toLocaleString("th-TH")}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ) : (
              <>
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setSelectedConversation(null)}
                  >
                    ←
                  </IconButton>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {selectedConv?.otherUser.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    {selectedConv?.otherUser.name}
                  </Typography>
                </Box>

                {/* Messages */}
                <Box
                  ref={messagesContainerRef}
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    p: 2,
                    bgcolor: "grey.50",
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser?.id;
                        return (
                          <Box
                            key={msg.id}
                            sx={{
                              display: "flex",
                              justifyContent: isOwn ? "flex-end" : "flex-start",
                              mb: 1,
                            }}
                          >
                            <Paper
                              elevation={1}
                              sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                bgcolor: isOwn ? "primary.main" : "white",
                                color: isOwn ? "white" : "text.primary",
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="body2">{msg.content}</Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  mt: 0.5,
                                  opacity: 0.7,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </Box>

                {/* Input */}
                <Box
                  sx={{
                    p: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="พิมพ์ข้อความ..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? <CircularProgress size={20} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

