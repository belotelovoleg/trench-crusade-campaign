'use client';
import { ChangeEvent, FormEvent, useState } from 'react';
import { TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { login?: string; password?: string } = {};
    if (!form.login || form.login.length < 4) newErrors.login = 'Мінімум 4 символи';
    if (!form.password || form.password.length < 4) newErrors.password = 'Мінімум 4 символи';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    if (result.success) {
      setStatus('success');
      setTimeout(() => router.push('/'), 500); // невелика затримка для UX
    } else {
      setStatus(result.error || 'error');
    }
  };
  return (
    <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Вхід</h2>
        <TextField
          name="login"
          label="Логін або email"
          placeholder="Логін або email"
          onChange={handleChange}
          className={styles.input}
          autoComplete="username"
          value={form.login}
          error={!!errors.login}
          helperText={errors.login}
          fullWidth
          margin="normal"
        />
        <TextField
          name="password"
          type="password"
          label="Пароль"
          placeholder="Пароль"
          onChange={handleChange}
          className={styles.input}
          autoComplete="current-password"
          value={form.password}
          error={!!errors.password}
          helperText={errors.password}
          fullWidth
          margin="normal"
        />
        <button type="submit" className={styles.button} disabled={status === 'loading'}>
          {status === 'loading' ? 'Зачекайте...' : 'Увійти'}
        </button>
        {status === 'success' && (
          <p className={`${styles.status} ${styles.success}`}>Вхід успішний!</p>
        )}        {status && status !== 'success' && (
          <p className={`${styles.status} ${styles.error}`}>
            {status === 'error' ? 'Помилка входу.' : status === 'loading' ? 'Зачекайте...' : status}
          </p>
        )}
        <div className={styles.linkContainer}>
          <p>Ще не маєте акаунта? <a href="/register" className={styles.link}>Зареєструватися</a></p>
        </div>
      </form>
    </div>
  );
}
