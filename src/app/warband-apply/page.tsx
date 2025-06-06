"use client";

import React, { useState, Suspense } from 'react';
import { Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import styles from '../page.module.css';
import { useRouter, useSearchParams } from 'next/navigation';

function WarbandApplyContent() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const warbandId = searchParams?.get('warband_id');
  const warbandName = searchParams?.get('warband_name');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setInfo('');
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setError('');
    setInfo('');
    if (!file) {
      setError('Оберіть файл для завантаження.');
      return;
    }
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Можна завантажити лише JSON-файл.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('roster', file);
    if (warbandId) formData.append('warband_id', warbandId);
    try {
      const res = await fetch('/api/warband-apply' + (warbandId ? `?warband_id=${encodeURIComponent(warbandId)}` : ''), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Помилка завантаження.');
      setSuccess(true);
      setInfo(data.message || 'Ростер успішно завантажено!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Box className={styles.centerBox}>
        <Typography variant="h5" className={styles.title} gutterBottom>
          {warbandId ? `Оновити ростер для варбанди ${warbandName || ''}` : 'Подати ростер нової варбанди на участь у кампанії'}
        </Typography>
        <Typography
          sx={{ mb: 2, color: '#333', fontSize: 16, textAlign: 'center' }}
          dangerouslySetInnerHTML={
            warbandId
              ? { __html: `Подайте змінений ростер для варбанди ${warbandName || ''}. Після завантаження новий ростер буде відправлено на перевірку.` }
              : { __html: `Ростер потрібно створити у <b>New Recruit</b> (<a href="https://www.newrecruit.eu/" target="_blank" rel="noopener noreferrer">newrecruit.eu</a>),
                експортувати як <b>JSON-файл</b> і завантажити сюди для валідації.<br/>
                1. Створи ростер у New Recruit.<br/>
                2. Експортуй його як JSON.<br/>
                3. Завантаж цей файл для подачі заявки.` }
          }
        />
        {!success && (
          <>
            <Button
              variant="contained"
              component="label"
              color="primary"
              fullWidth
              sx={{ mb: 2 }}
              startIcon={<span style={{fontSize:20}}>📤</span>}
            >
              Обрати JSON-файл
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handleUpload}
              disabled={loading || !file}
              sx={{ }}
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <span style={{fontSize:20}}>✅</span>}
            >
              {loading ? 'Завантаження...' : 'Завантажити JSON-ростер'}
            </Button>
          </>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mt: 2 }}>{info}</Alert>}
        {success && (
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={() => router.push('/')}>На головну</Button>
        )}
      </Box>
    </div>
  );
}

export default function WarbandApplyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WarbandApplyContent />
    </Suspense>
  );
}
