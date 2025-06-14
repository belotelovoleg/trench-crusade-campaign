'use client';
import { useRouter } from 'next/navigation';
import { Button, Typography, CircularProgress, Tooltip } from '@mui/material'; // якщо використовуєш MUI
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
    fetch('/api/about', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
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
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <CircularProgress />
      </main>
    );
  }

  return (
    <div className={styles.mainPageRoot}>
      <div className={styles.mainPageTitle}>Ласкаво просимо до Trench Crusade</div>
      <div className={styles.mainPageBlocks}>
        <div className={styles.mainPageAboutBlock}>          {!isAboutEmpty ? (
            <div 
              dangerouslySetInnerHTML={{ __html: about }} 
              className={styles.aboutContent}
            />
          ) : (
            <Typography 
              variant="h6" 
              align="center" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 600, 
                mt: { xs: 2, md: 4 }, 
                mb: { xs: 2, md: 4 }, 
                px: { xs: 1, md: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                lineHeight: 1.5,
                textShadow: '0 2px 12px #bbb8, 0 0 2px #fff8' 
              }}
            >
              Вступна історія цієї кампанії ще пишеться у багнюці окопів...<br/>
              Сторінки хронік чекають на перші героїчні вчинки!
            </Typography>
          )}
        </div>
        <div className={styles.mainPageButtonBlock}>
          {user ? (
            <>
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                {greeting} {user.name || 'друже'}!
              </Typography>              {user.is_admin && (
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => location.href = '/admin'}
                  sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                >
                  Перейти до адмін-частини
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => location.href = '/profile'}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Редагувати профіль
              </Button>
              {/* Перелік варбанд користувача */}              {user && Array.isArray(user.warbands) && user.warbands.length > 0 && (
                <div style={{ marginBottom: 16, width: '100%' }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1.5, 
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      textAlign: 'center',
                      borderBottom: '1px solid #e0e0e0',
                      paddingBottom: '8px'
                    }}
                  >
                    Ваші варбанди:
                  </Typography>
                  {user.warbands.filter((w: any) => w.status !== 'deleted').map((w: any, idx: number) => {
                    let statusIcon: React.ReactNode = null;
                    let statusColor = 'action';
                    let statusTitle = '';
                    if (w.status === 'active') {
                      statusIcon = <span style={{fontSize: '1.2em'}} role="img" aria-label="Готова">🟢</span>;
                      statusColor = 'success.main';
                      statusTitle = 'Активна';
                    } else if (w.status === 'checking') {
                      statusIcon = <span style={{fontSize: '1.2em'}} role="img" aria-label="На перевірці">👁️</span>;
                      statusColor = 'warning.main';
                      statusTitle = 'На перевірці';
                    } else if (w.status === 'needs_update') {
                      statusIcon = <span style={{fontSize: '1.2em'}} role="img" aria-label="Потребує оновлення">⚠️</span>;
                      statusColor = 'warning.dark';
                      statusTitle = 'Потребує оновлення ростеру';
                    } else {
                      statusIcon = <span style={{fontSize: '1.2em'}} role="img" aria-label="Видалена">💀</span>;
                      statusColor = 'text.disabled';
                      statusTitle = 'Видалена';
                    }
                    return (                      <div key={w.name + idx} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start',                        marginBottom: 8, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 8, 
                        padding: '8px', 
                        background: '#fafbfc',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%',
                          marginBottom: 8
                        }}>
                          <Tooltip title={statusTitle} arrow placement="top">
                            <span style={{ fontWeight: 600, cursor: 'help', fontSize: '1.05rem' }}>{w.name}</span>
                          </Tooltip>
                          <Tooltip title={statusTitle} arrow placement="top">
                            <span style={{fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', marginLeft: 8}}>
                              {statusIcon}
                            </span>
                          </Tooltip>
                        </div>
                        
                        {w.status === 'needs_update' ? (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            sx={{ 
                              fontWeight: 700, 
                              letterSpacing: 0.5, 
                              boxShadow: '0 1px 4px #4f010122', 
                              px: 1.5, 
                              py: 0.4, 
                              fontSize: 13, 
                              textTransform: 'uppercase', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              width: '100%'
                            }}
                            component={Link}
                            href={`/warband-apply?warband_id=${w.id}&warband_name=${encodeURIComponent(w.name)}`}
                          >
                            <span style={{fontSize:18,marginRight:6}}>🛠️</span> Оновити ростер
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            sx={{ 
                              fontWeight: 700, 
                              letterSpacing: 0.5, 
                              boxShadow: '0 1px 4px #4f010122', 
                              px: 1.5, 
                              py: 0.4, 
                              fontSize: 13, 
                              textTransform: 'uppercase', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              width: '100%'
                            }}
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Кнопка таблиці результатів */}              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component={Link}
                href="/players"
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Переглянути гравців кампанії
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component={Link}
                href="/table"
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Таблиця результатів
              </Button>
              {/* Кнопка подати ростер тільки якщо не більше 1 не видаленої варбанди */}              {user && (user.warbands?.filter((w: any) => w.status !== 'deleted').length ?? 0) < 2 && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  component={Link}
                  href="/warband-apply"
                  sx={{ mt: { xs: 0.5, sm: 0.8 }, mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                >
                  Подати ростер на участь у кампанії
                </Button>
              )}
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth 
                onClick={handleLogout}
                sx={{ py: { xs: 1, sm: 1.2 } }}
              >
                Вийти
              </Button>
            </>
          ) : (            <>              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => location.href = '/login'}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1.2, sm: 1.5 }, fontSize: { xs: '1rem', sm: '1.1rem' } }}
              >
                Увійти
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth 
                onClick={() => location.href = '/register'}
                sx={{ py: { xs: 1.2, sm: 1.5 }, fontSize: { xs: '1rem', sm: '1.1rem' } }}
              >
                Зареєструватися
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
