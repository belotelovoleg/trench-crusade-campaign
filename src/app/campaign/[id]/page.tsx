'use client';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, CircularProgress, Tooltip } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from '../../../app/page.module.css';
import greetings from '../../greetings';

export const dynamic = "force-dynamic";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  showFullContent: boolean;
}

export default function CampaignHome() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<string>('');
  const [campaign, setCampaign] = useState<any>(null);
  const [isInCampaign, setIsInCampaign] = useState<boolean>(false);
  const [joinLoading, setJoinLoading] = useState<boolean>(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!campaignId) return;

    Promise.all([
      fetch(`/api/campaigns/${campaignId}/about`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      }).then(res => res.json()),
      fetch(`/api/me?campaignId=${campaignId}`).then(res => res.json()),
      fetch(`/api/campaigns/${campaignId}`).then(res => res.json())
    ])
    .then(([articlesData, userData, campaignData]) => {
      // Check if user account was deactivated
      if (userData.error) {
        alert(userData.error);
        router.push('/login');
        return;
      }
      
      setArticles(articlesData.articles || []);
      setUser(userData.user || null);
      setCampaign(campaignData.campaign || null);
      // Check if user is in this campaign
      if (userData.user) {
        setIsInCampaign(userData.user.is_in_campaign || false);
      }
      
      setArticlesLoading(false);
      setLoading(false);
    })
    .catch(() => {
      setArticlesLoading(false);
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
  const toggleArticleExpansion = (articleId: number) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  if (loading || articlesLoading) {
    return (
      <div className="consistentLoadingContainer">
        <CircularProgress />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="consistentLoadingContainer">
        <Typography variant="h6">Campaign not found</Typography>
      </div>
    );
  }  return (
    <div className="consistentBackgroundContainer">
      <div className={styles.mainPageTitle}>Ласкаво просимо до {campaign.name}</div>
      <div className={styles.mainPageBlocks}>
        <div className={styles.mainPageAboutBlock}>
          {articles.length > 0 ? (
            <div className={styles.articlesContainer}>
              {articles.map((article) => {
                const isExpanded = expandedArticles.has(article.id);
                const shouldShowReadMore = !article.showFullContent && !isExpanded;
                
                return (
                  <article key={article.id} className={styles.articleItem}>
                    <Typography 
                      variant="h5" 
                      component="h2"
                      sx={{ 
                        fontWeight: 700,
                        mb: 1,
                        color: 'primary.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      {article.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        mb: 2,
                        fontSize: '0.875rem'
                      }}
                    >
                      {new Date(article.updatedAt).toLocaleDateString('uk-UA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>

                    {shouldShowReadMore ? (
                      <>
                        <div 
                          dangerouslySetInnerHTML={{ __html: article.excerpt }} 
                          className={styles.articleContent}
                        />
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => toggleArticleExpansion(article.id)}
                          sx={{ mt: 1, p: 0, textTransform: 'none', fontSize: '0.875rem' }}
                        >
                          Читати далі →
                        </Button>
                      </>
                    ) : (
                      <>
                        <div 
                          dangerouslySetInnerHTML={{ __html: article.content }} 
                          className={styles.articleContent}
                        />
                        {!article.showFullContent && (
                          <Button
                            variant="text"
                            color="primary"
                            onClick={() => toggleArticleExpansion(article.id)}
                            sx={{ mt: 1, p: 0, textTransform: 'none', fontSize: '0.875rem' }}
                          >
                            ← Згорнути
                          </Button>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
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
                    {joinLoading ? <CircularProgress size={20} /> : 'Приєднатися до кампанії'}                  </Button>
                  <Button
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
                        </div>                          {w.status === 'needs_update' ? (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            component={Link}
                            href={`/campaign/${campaignId}/battle?warband_id=${w.id}`}
                            sx={{ width: '100%' }}
                          >
                            <span style={{fontSize:18,marginRight:6}}>🛠️</span> Оновити ростер
                          </Button>) : (                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            component={Link}
                            href={`/campaign/${campaignId}/battle?warband_id=${w.id}`}
                            sx={{ width: '100%' }}
                          ><img
                              src="/swords.png"
                              alt="Схрещені мечі"
                              style={{
                                width: 18,
                                height: 18,
                                marginRight: 6,
                                verticalAlign: 'middle',
                                filter: w.status === 'checking' || w.status === 'needs_update' ? 'grayscale(1) brightness(1.2) opacity(.5)' : undefined
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
                color="primary"
                fullWidth
                component={Link}
                href={`/campaign/${campaignId}/players`}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Переглянути гравців кампанії
              </Button>              <Button
                color="primary"
                fullWidth
                component={Link}
                href={`/campaign/${campaignId}/table`}
                sx={{ mb: { xs: 0.5, sm: 0.8 }, py: { xs: 1, sm: 1.2 } }}
              >
                Таблиця результатів
              </Button>
              {/* Кнопка подати ростер тільки якщо не досяг ліміту варбанд */}              {user && campaign && (user.warbands?.filter((w: any) => w.status !== 'deleted').length ?? 0) < (campaign.warband_limit || 2) && (
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
