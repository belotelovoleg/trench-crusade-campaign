'use client';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, CircularProgress, Tooltip } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from '../../../app/page.module.css';
import greetings from '../../greetings';

export const dynamic = "force-dynamic";

export default function CampaignHome() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const [about, setAbout] = useState<string>('');
  const [aboutLoading, setAboutLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);  const [greeting, setGreeting] = useState<string>('');
  const [campaign, setCampaign] = useState<any>(null);
  const [isInCampaign, setIsInCampaign] = useState<boolean>(false);
  const [joinLoading, setJoinLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!campaignId) return;

    Promise.all([
      fetch(`/api/campaigns/${campaignId}/about`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      }).then(res => res.json()),
      fetch(`/api/me?campaignId=${campaignId}`).then(res => res.json()),
      fetch(`/api/campaigns/${campaignId}`).then(res => res.json())
    ])    .then(([aboutData, userData, campaignData]) => {
      setAbout(aboutData.content || '');
      setUser(userData.user || null);
      setCampaign(campaignData.campaign || null);
        // Check if user is in this campaign
      if (userData.user) {
        setIsInCampaign(userData.user.is_in_campaign || false);
      }
      
      setAboutLoading(false);
      setLoading(false);
    })
    .catch(() => {
      setAboutLoading(false);
      setLoading(false);
    });

    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, [campaignId]);  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };  const handleJoinCampaign = async () => {
    if (!campaignId) return;
    
    setJoinLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        // Refresh user data to show they're now in the campaign
        const userData = await fetch(`/api/me?campaignId=${campaignId}`).then(res => res.json());
        setUser(userData.user || null);
        setIsInCampaign(true);
      } else {
        console.error('Failed to join campaign:', responseData.error);
        alert(`Failed to join campaign: ${responseData.error}`);
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      alert('Error joining campaign. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading || aboutLoading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <CircularProgress />
      </main>
    );
  }

  if (!campaign) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <Typography variant="h6">Campaign not found</Typography>
      </main>    );
  }  // Визначаємо, чи about реально порожній (навіть якщо <p></p> або пробіли)
  let isAboutEmpty = true;
  if (about) {
    // Видаляємо всі теги, пробіси, переноси
    const text = about.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
    isAboutEmpty = !text;
  }

  return (
    <div className={styles.mainPageRoot}>
      <div className={styles.mainPageTitle}>Ласкаво просимо до {campaign.name}</div>
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
        </div>        <div className={styles.mainPageButtonBlock}>
          {user ? (
            <>
              {!isInCampaign ? (
                // User is logged in but not in this campaign
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
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleJoinCampaign}
                    disabled={joinLoading}
                    sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                  >
                    {joinLoading ? <CircularProgress size={20} /> : 'Приєднатися до кампанії'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => location.href = `/profile`}
                    sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                  >
                    Редагувати профіль
                  </Button>
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
              ) : (
                // User is in this campaign
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
                  </Typography>{user.is_admin && (
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => location.href = `/campaign/${campaignId}/admin`}
                  sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                >
                  Перейти до адмін-частини
                </Button>
              )}              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => location.href = `/profile`}
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
                            href={`/campaign/${campaignId}/warband-apply?warband_id=${w.id}&warband_name=${encodeURIComponent(w.name)}`}
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
                            href={`/campaign/${campaignId}/battle?warband_id=${w.id}`}
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
                href={`/campaign/${campaignId}/players`}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Переглянути гравців кампанії
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component={Link}
                href={`/campaign/${campaignId}/table`}
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
                  href={`/campaign/${campaignId}/warband-apply`}
                  sx={{ mt: { xs: 0.5, sm: 0.8 }, mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
                >                  Подати ростер на участь у кампанії
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
              )}
            </>
          ) : (<>              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => location.href = `/campaign/${campaignId}/login`}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1.2, sm: 1.5 }, fontSize: { xs: '1rem', sm: '1.1rem' } }}
              >
                Увійти
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth 
                onClick={() => location.href = `/campaign/${campaignId}/register`}
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
