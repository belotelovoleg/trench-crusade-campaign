'use client';
import { useRouter } from 'next/navigation';
import { Button, Typography, CircularProgress } from '@mui/material'; // якщо використовуєш MUI
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import greetings from './greetings';

export default function Home() {
  const router = useRouter();
  const [about, setAbout] = useState<string>('');
  const [aboutLoading, setAboutLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then(data => setAbout(data.content || ''))
      .finally(() => setAboutLoading(false));
    fetch('/api/me')
      .then(res => res.json())
      .then(data => setUser(data.user || null))
      .finally(() => setLoading(false));
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null); // Очистити дані користувача на клієнті
      router.push('/'); // Можна перенаправити або оновити сторінку
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  if (loading || aboutLoading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </main>
    );
  }

  return (
    <div className={styles.mainPageRoot}>
      <div className={styles.mainPageTitle}>Ласкаво просимо до Trench Crusade</div>
      <div className={styles.mainPageBlocks}>
        <div className={styles.mainPageAboutBlock}>
          <div dangerouslySetInnerHTML={{ __html: about }} />
        </div>
        <div className={styles.mainPageButtonBlock}>
          {user ? (
            <>
              <Typography variant="h6" align="center">{greeting} {user.name || 'друже'}!</Typography>
              {user.is_admin && (
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => location.href = '/admin'}
                  sx={{ mb: 2 }}
                >
                  Перейти до адмін-частини
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => location.href = '/profile'}
                sx={{ mb: 2 }}
              >
                Редагувати профіль
              </Button>
              {/* Перелік варбанд користувача */}
              {user && Array.isArray(user.warbands) && user.warbands.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Ваші варбанди:</Typography>
                  {user.warbands.filter((w: any) => w.status !== 'deleted').map((w: any, idx: number) => (
                    <div key={w.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{w.name}</span>
                      <span style={{ fontSize: 13, color: '#666' }}>— {w.status === 'active' ? 'Активна' : w.status === 'checking' ? 'На перевірці' : w.status === 'deleted' ? 'Видалена' : w.status}</span>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ ml: 2 }}
                        component={Link}
                        href={`/battle?warband_id=${w.id}`}
                        disabled={w.status === 'checking'}
                        title={w.status === 'checking' ? 'Варбанди на перевірці. Дочекайтесь схвалення.' : ''}
                      >
                        До бою!
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {/* Кнопка таблиці результатів */}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component={Link}
                href="/table"
                sx={{ mb: 2 }}
              >
                Таблиця результатів
              </Button>
              {/* Кнопка подати ростер тільки якщо не більше 1 не видаленої варбанди */}
              {user && (user.warbands?.filter((w: any) => w.status !== 'deleted').length ?? 0) < 2 && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  component={Link}
                  href="/warband-apply"
                  sx={{ mt: 2 }}
                >
                  Подати ростер на участь у кампанії
                </Button>
              )}
              <Button variant="contained" color="secondary" fullWidth onClick={handleLogout}>
                Вийти
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" color="primary" fullWidth onClick={() => location.href = '/login'}>
                Увійти
              </Button>
              <Button variant="outlined" color="secondary" fullWidth onClick={() => location.href = '/register'}>
                Зареєструватися
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
