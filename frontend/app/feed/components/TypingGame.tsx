"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import axios from "axios";

interface Word {
  word: string;
  image: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

const WORDS: Word[] = [
  { word: "sushi", image: "🍣", difficulty: "easy", points: 10 },
  { word: "pizza", image: "🍕", difficulty: "easy", points: 10 },
  { word: "apple", image: "🍎", difficulty: "easy", points: 10 },
  { word: "bread", image: "🍞", difficulty: "easy", points: 10 },
  { word: "milk", image: "🥛", difficulty: "easy", points: 10 },
  { word: "cake", image: "🎂", difficulty: "easy", points: 10 },
  { word: "fish", image: "🐟", difficulty: "easy", points: 10 },
  { word: "rice", image: "🍚", difficulty: "easy", points: 10 },
  
  { word: "sandwich", image: "🥪", difficulty: "medium", points: 20 },
  { word: "hamburger", image: "🍔", difficulty: "medium", points: 20 },
  { word: "spaghetti", image: "🍝", difficulty: "medium", points: 20 },
  { word: "chocolate", image: "🍫", difficulty: "medium", points: 20 },
  { word: "pineapple", image: "🍍", difficulty: "medium", points: 20 },
  { word: "strawberry", image: "🍓", difficulty: "medium", points: 20 },
  { word: "watermelon", image: "🍉", difficulty: "medium", points: 20 },
  { word: "ice cream", image: "🍦", difficulty: "medium", points: 20 },
  
  { word: "restaurant", image: "🍽️", difficulty: "hard", points: 30 },
  { word: "breakfast", image: "🥐", difficulty: "hard", points: 30 },
  { word: "vegetables", image: "🥗", difficulty: "hard", points: 30 },
  { word: "sandwich", image: "🥙", difficulty: "hard", points: 30 },
  { word: "cucumber", image: "🥒", difficulty: "hard", points: 30 },
  { word: "broccoli", image: "🥦", difficulty: "hard", points: 30 },
  { word: "avocado", image: "🥑", difficulty: "hard", points: 30 },
  { word: "pancakes", image: "🥞", difficulty: "hard", points: 30 },
];

interface DraggableItem {
  id: string;
  word: string;
  image: string;
  x: number;
  y: number;
  isDragging: boolean;
}

export default function TypingGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "all">("all");
  const [draggableItems, setDraggableItems] = useState<DraggableItem[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showGame, setShowGame] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myBestScore, setMyBestScore] = useState<any>(null);
  const [leaderboardTab, setLeaderboardTab] = useState(0);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    if (isPlaying && !isPaused && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isPaused, timeLeft]);

  useEffect(() => {
    if (isPlaying && !currentWord && !gameOver) {
      generateNewWord();
    }
  }, [isPlaying, currentWord, gameOver, difficulty]);

  useEffect(() => {
    if (userInput.toLowerCase().trim() === currentWord?.word.toLowerCase()) {
      handleCorrectAnswer();
    }
  }, [userInput, currentWord]);

  const generateNewWord = () => {
    let availableWords = WORDS;
    if (difficulty !== "all") {
      availableWords = WORDS.filter((w) => w.difficulty === difficulty);
    }
    if (availableWords.length === 0) {
      availableWords = WORDS;
    }
    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(randomWord);
    setUserInput("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCorrectAnswer = () => {
    if (!currentWord) return;

    const points = currentWord.points;
    setScore((prev) => prev + points);

    const newItem: DraggableItem = {
      id: Date.now().toString(),
      word: currentWord.word,
      image: currentWord.image,
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      isDragging: false,
    };

    setDraggableItems((prev) => [...prev, newItem]);

    setTimeout(() => {
      animateToPlate(newItem.id);
    }, 100);

    setTimeout(() => {
      generateNewWord();
    }, 500);
  };

  const animateToPlate = (itemId: string) => {
    if (!plateRef.current || !gameAreaRef.current) return;

    const plateRect = plateRef.current.getBoundingClientRect();
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();

    setDraggableItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            x: plateRect.left - gameAreaRect.left + plateRect.width / 2 - 30,
            y: plateRect.top - gameAreaRect.top + plateRect.height / 2 - 30,
          };
        }
        return item;
      })
    );

    setTimeout(() => {
      setDraggableItems((prev) => prev.filter((item) => item.id !== itemId));
    }, 500);
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setUserInput("");
    setCurrentWord(null);
    setDraggableItems([]);
    generateNewWord();
  };

  const pauseGame = () => {
    setIsPaused(true);
  };

  const resumeGame = () => {
    setIsPaused(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setUserInput("");
    setCurrentWord(null);
    setDraggableItems([]);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  const saveScore = async () => {
    if (score === 0) return Promise.resolve();

    try {
      const token = localStorage.getItem("token");
      const wordsTyped = Math.floor(score / 15);
      const difficultyValue = difficulty === "all" ? "all" : difficulty;

      await axios.post(
        `${API_URL}/api/game/scores`,
        {
          score,
          wordsTyped,
          difficulty: difficultyValue,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return Promise.resolve();
    } catch (error) {
      console.error("Error saving score:", error);
      return Promise.reject(error);
    }
  };

  const fetchLeaderboard = async (difficultyFilter?: string) => {
    setLoadingLeaderboard(true);
    try {
      const token = localStorage.getItem("token");
      const url = difficultyFilter
        ? `${API_URL}/api/game/leaderboard/${difficultyFilter}`
        : `${API_URL}/api/game/leaderboard`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchMyBestScore = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/game/my-best`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyBestScore(response.data);
    } catch (error) {
      setMyBestScore(null);
    }
  };

  useEffect(() => {
    if (gameOver && score > 0) {
      saveScore().then(() => {
        fetchMyBestScore();
        if (showLeaderboard) {
          if (leaderboardTab === 0) {
            fetchLeaderboard();
          } else if (leaderboardTab === 1) {
            fetchLeaderboard("easy");
          } else if (leaderboardTab === 2) {
            fetchLeaderboard("medium");
          } else if (leaderboardTab === 3) {
            fetchLeaderboard("hard");
          }
        }
      });
    }
  }, [gameOver, score]);

  useEffect(() => {
    if (showLeaderboard) {
      if (leaderboardTab === 0) {
        fetchLeaderboard();
      } else if (leaderboardTab === 1) {
        fetchLeaderboard("easy");
      } else if (leaderboardTab === 2) {
        fetchLeaderboard("medium");
      } else if (leaderboardTab === 3) {
        fetchLeaderboard("hard");
      }
      fetchMyBestScore();

      const interval = setInterval(() => {
        if (leaderboardTab === 0) {
          fetchLeaderboard();
        } else if (leaderboardTab === 1) {
          fetchLeaderboard("easy");
        } else if (leaderboardTab === 2) {
          fetchLeaderboard("medium");
        } else if (leaderboardTab === 3) {
          fetchLeaderboard("hard");
        }
        fetchMyBestScore(); // Also refresh user's best score
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [showLeaderboard, leaderboardTab]);

  if (!showGame) {
    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          textAlign: "center",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setShowGame(true)}
          startIcon={<PlayIcon />}
        >
          เล่นเกมพิมคำ
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "background.paper",
          position: "relative",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Header Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                🎮 เกมพิมคำ
              </Typography>
              <Chip
                label="Typing Game"
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              พิมคำภาษาอังกฤษให้เร็วที่สุด!
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowGame(false)}
            size="small"
            sx={{
              ml: 2,
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
                color: "error.main",
              },
            }}
            title="ปิดเกม"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Game Controls */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {!isPlaying ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayIcon />}
                onClick={startGame}
                sx={{ minWidth: 120 }}
              >
                เริ่มเกม
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayIcon />}
                    onClick={resumeGame}
                  >
                    ต่อเกม
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseIcon />}
                    onClick={pauseGame}
                  >
                    หยุด
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon />}
                  onClick={resetGame}
                >
                  รีเซ็ต
                </Button>
              </>
            )}
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<TrophyIcon />}
            onClick={() => {
              setShowLeaderboard(true);
              fetchMyBestScore();
            }}
          >
            Leaderboard
          </Button>
        </Box>

        {!isPlaying && !gameOver && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              เลือกระดับความยาก:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {(["all", "easy", "medium", "hard"] as const).map((diff) => (
                <Chip
                  key={diff}
                  label={
                    diff === "all"
                      ? "ทั้งหมด"
                      : diff === "easy"
                      ? "ง่าย (10 คะแนน)"
                      : diff === "medium"
                      ? "ปานกลาง (20 คะแนน)"
                      : "ยาก (30 คะแนน)"
                  }
                  onClick={() => setDifficulty(diff)}
                  color={difficulty === diff ? "primary" : "default"}
                  variant={difficulty === diff ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>
        )}

        {isPlaying && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                p: 2,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  คะแนน: {score}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  ⏱️ เวลาที่เหลือ: {timeLeft} วินาที
                </Typography>
              </Box>
              {currentWord && (
                <Chip
                  label={`${currentWord.difficulty.toUpperCase()} (+${currentWord.points} คะแนน)`}
                  color="secondary"
                  sx={{
                    bgcolor: "white",
                    color: "primary.main",
                    fontWeight: "bold",
                  }}
                />
              )}
            </Box>

            <LinearProgress
              variant="determinate"
              value={(timeLeft / 60) * 100}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />

            <Box
              ref={gameAreaRef}
              sx={{
                position: "relative",
                minHeight: 300,
                border: "2px dashed",
                borderColor: "primary.main",
                borderRadius: 3,
                p: 3,
                mb: 2,
                bgcolor: "action.hover",
                background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)",
              }}
            >
              {currentWord && !isPaused && (
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    {currentWord.image}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    พิมคำ: {currentWord.word}
                  </Typography>
                </Box>
              )}

              {isPaused && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h4" color="text.secondary">
                    ⏸️ หยุดชั่วคราว
                  </Typography>
                </Box>
              )}

              {draggableItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    position: "absolute",
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    fontSize: "3rem",
                    transition: "all 0.5s ease",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  {item.image}
                </Box>
              ))}

              <Box
                ref={plateRef}
                sx={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  border: "3px solid",
                  borderColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  boxShadow: 3,
                }}
              >
                🍽️
              </Box>
            </Box>

            {!isPaused && currentWord && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  พิมคำภาษาอังกฤษ:
                </Typography>
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (userInput.toLowerCase().trim() === currentWord.word.toLowerCase()) {
                        handleCorrectAnswer();
                      } else {
                        setUserInput("");
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "18px",
                    border: "2px solid #1976d2",
                    borderRadius: "8px",
                    outline: "none",
                  }}
                  placeholder="พิมพ์คำที่นี่..."
                  autoFocus
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  กด Enter เพื่อส่งคำตอบ
                </Typography>
              </Box>
            )}
          </>
        )}

        {gameOver && (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 2,
              bgcolor: "action.hover",
              borderRadius: 3,
              border: "2px solid",
              borderColor: "primary.main",
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              🎉 เกมจบ!
            </Typography>
            <Box sx={{ my: 3 }}>
              <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                {score}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                คะแนนรวม
              </Typography>
              <Typography variant="body1" color="text.secondary">
                คำที่พิมพ์ได้: {Math.floor(score / 15)} คำ
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={startGame}
              sx={{ mt: 2, minWidth: 150 }}
              startIcon={<RefreshIcon />}
            >
              เล่นอีกครั้ง
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={gameOver && score > 0} onClose={() => setGameOver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>เกมจบแล้ว!</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            คะแนนรวม: {score}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            คำที่พิมพ์ได้: {Math.floor(score / 15)} คำ
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGameOver(false)}>ปิด</Button>
          <Button variant="contained" onClick={startGame}>
            เล่นอีกครั้ง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrophyIcon color="primary" />
            <Typography variant="h6">Leaderboard</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {myBestScore && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                🏆 คะแนนสูงสุดของคุณ
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {myBestScore.score} คะแนน
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                คำที่พิมพ์: {myBestScore.wordsTyped} คำ | ระดับ: {myBestScore.difficulty || "ทั้งหมด"}
              </Typography>
            </Paper>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Tabs
              value={leaderboardTab}
              onChange={(e, newValue) => setLeaderboardTab(newValue)}
            >
              <Tab label="ทั้งหมด" />
              <Tab label="ง่าย" />
              <Tab label="ปานกลาง" />
              <Tab label="ยาก" />
            </Tabs>
            <Chip
              label="🔄 อัพเดทอัตโนมัติทุก 5 วินาที"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {loadingLeaderboard ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>กำลังโหลด...</Typography>
            </Box>
          ) : leaderboard.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>อันดับ</TableCell>
                    <TableCell>ผู้เล่น</TableCell>
                    <TableCell align="right">คะแนน</TableCell>
                    <TableCell align="right">คำที่พิมพ์</TableCell>
                    <TableCell>ระดับ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((item, index) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        bgcolor:
                          index === 0
                            ? "rgba(255, 215, 0, 0.1)"
                            : index === 1
                            ? "rgba(192, 192, 192, 0.1)"
                            : index === 2
                            ? "rgba(205, 127, 50, 0.1)"
                            : "inherit",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {index === 0 && "🥇"}
                          {index === 1 && "🥈"}
                          {index === 2 && "🥉"}
                          <Typography fontWeight={index < 3 ? "bold" : "normal"}>
                            {index + 1}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            {item.userName?.charAt(0).toUpperCase() || "?"}
                          </Avatar>
                          <Typography>{item.userName || "Unknown"}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {item.score}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.wordsTyped}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.difficulty || "ทั้งหมด"}
                          size="small"
                          color={
                            item.difficulty === "easy"
                              ? "success"
                              : item.difficulty === "medium"
                              ? "warning"
                              : item.difficulty === "hard"
                              ? "error"
                              : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", p: 3 }}>
              <Typography variant="body1" color="text.secondary">
                ยังไม่มีคะแนน
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaderboard(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

