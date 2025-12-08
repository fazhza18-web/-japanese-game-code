"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

const registerSchema = z
  .object({
    name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      router.push("/login");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            สมัครสมาชิก
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="ชื่อ"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="อีเมล"
              type="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="รหัสผ่าน"
              type="password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="ยืนยันรหัสผ่าน"
              type="password"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>

            <Typography align="center">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login"
                sx={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/login");
                }}
              >
                เข้าสู่ระบบ
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

