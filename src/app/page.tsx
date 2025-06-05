'use client';
import { useRouter } from 'next/navigation';
import { Button, Typography, CircularProgress } from '@mui/material'; // якщо використовуєш MUI
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import greetings from './greetings';

export const dynamic = "force-dynamic";

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

  // Визначаємо, чи about реально порожній (навіть якщо <p></p> або пробіли)
  const isAboutEmpty = useMemo(() => {
    if (!about) return true;
    // Видаляємо всі теги, пробіси, переноси
    const text = about.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
    return !text;
  }, [about]);

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
          {!isAboutEmpty ? (
            <div dangerouslySetInnerHTML={{ __html: about }} />
          ) : (
            <Typography variant="h6" align="center" sx={{ color: 'primary.main', fontWeight: 600, mt: 4, mb: 4, textShadow: '0 2px 12px #bbb8, 0 0 2px #fff8' }}>
              Вступна історія цієї кампанії ще пишеться у багнюці окопів...<br/>
              Сторінки хронік чекають на перші героїчні вчинки!
            </Typography>
          )}
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
                  {user.warbands.filter((w: any) => w.status !== 'deleted').map((w: any, idx: number) => {
                    let statusIcon: React.ReactNode = null;
                    let statusColor = 'action';
                    let statusTitle = '';
                    if (w.status === 'active') {
                      statusIcon = <span style={{display:'flex',alignItems:'center'}}><span style={{color:'#388e3c'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#C8E6C9"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span></span>;
                      statusColor = 'success.main';
                      statusTitle = 'Активна';
                    } else if (w.status === 'checking') {
                      statusIcon = <span style={{display:'flex',alignItems:'center'}}><span style={{color:'#fbc02d'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#FFF9C4"/><path d="M12 8v4" stroke="#fbc02d" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#fbc02d"/></svg></span></span>;
                      statusColor = 'warning.main';
                      statusTitle = 'На перевірці';
                    } else if (w.status === 'needs_update') {
                      statusIcon = <span style={{display:'flex',alignItems:'center'}}><span style={{color:'#ff9800'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#FFE0B2"/><path d="M12 7v5" stroke="#ff9800" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2" fill="#ff9800"/></svg></span></span>;
                      statusColor = 'warning.dark';
                      statusTitle = 'Потребує оновлення ростеру';
                    } else {
                      statusIcon = <span style={{display:'flex',alignItems:'center'}}><span style={{color:'#bdbdbd'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#eeeeee"/><path d="M8 8l8 8M16 8l-8 8" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round"/></svg></span></span>;
                      statusColor = 'text.disabled';
                      statusTitle = 'Видалена';
                    }
                    return (
                      <div key={w.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', background: '#fafbfc' }}>
                        <span style={{ fontWeight: 500 }}>{w.name}</span>
                        <span style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center' }}>
                          <span title={statusTitle} style={{marginRight:4, display:'flex',alignItems:'center'}}>{statusIcon}</span>
                        </span>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          sx={{ ml: 2, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 1px 4px #4f010122', px: 1.5, py: 0.4, fontSize: 13, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}
                          component={Link}
                          href={`/battle?warband_id=${w.id}`}
                          disabled={w.status === 'checking' || w.status === 'needs_update'}
                          title={w.status === 'checking' ? 'Варбанди на перевірці. Дочекайтесь схвалення.' : w.status === 'needs_update' ? 'Варбанди потребують оновлення ростеру. Оновіть ростер для активації.' : ''}
                        >
                          <img
                            src="/swords.png"
                            alt="Схрещені мечі"
                            style={{
                              width: 18,
                              height: 18,
                              marginRight: 6,
                              verticalAlign: 'middle',
                              filter: w.status === 'checking' || w.status === 'needs_update' ? 'grayscale(1) brightness(1.2) opacity(.5) drop-shadow(0 1px 2px #0003)' : 'drop-shadow(0 1px 2px #0003)'
                            }}
                          /> До бою!
                        </Button>
                      </div>
                    );
                  })}
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
