'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import styles from './register.module.css';

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [form, setForm] = useState({ login: '', password: '', name: '', email: '' });
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.login || form.login.length < 4) newErrors.login = 'Мінімум 4 символи';
    if (!form.password || form.password.length < 4) newErrors.password = 'Мінімум 4 символи';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Некоректний email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); // очищення помилки при вводі
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setErrors({});

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await res.json();

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      const errorMap: Record<string, string> = {};
      if (Array.isArray(result.errors)) {
        for (const err of result.errors) {
          errorMap[err.field as string] = err.message;
        }
      }
      setErrors(errorMap);
    }
  };

  return (
    <Box className={styles.container}>
      <Paper
        elevation={6}
        className={styles.paper}
      >
        <Typography variant="h5" gutterBottom align="center" className={styles.title}>
          Реєстрація
        </Typography>
        {status === 'success' ? (
          <>
            <Typography mt={2} align="center" className={styles.success}>Успішно зареєстровано!</Typography>
            <Box mt={2} textAlign="center">
              <Button variant="contained" color="primary" onClick={() => window.location.href = '/'}>
                Повернутись на головну сторінку
              </Button>
            </Box>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Логін"
              name="login"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              error={!!errors.login}
              helperText={errors.login}
              className={styles.input}
            />
            <TextField
              fullWidth
              type="password"
              label="Пароль"
              name="password"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              className={styles.input}
            />
            <TextField
              fullWidth
              label="Ім'я"
              name="name"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              className={styles.input}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              className={styles.input}
            />            <Box mt={2} textAlign="center">
              <Button type="submit" variant="contained" color="primary" disabled={status === 'loading'}>
                {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'Зареєструватися'}
              </Button>
            </Box>            <Box mt={2} textAlign="center">
              <Typography variant="body2" sx={{ color: '#232526' }}>
                Вже маєте акаунт? <a href="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}>Увійти</a>
              </Typography>
            </Box>
          </form>
        )}
        {errors.server && <Typography mt={2} align="center" className={styles.error}>{errors.server}</Typography>}
      </Paper>
    </Box>
  );
}
