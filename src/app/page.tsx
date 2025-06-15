'use client';
import { useEffect, useState } from 'react';
import { Button, Typography, CircularProgress, Card, CardContent, CardMedia, Box, Fab, IconButton, Alert, Snackbar, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import styles from './page.module.css';
import { getRandomGreeting } from './trenchGreetings';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  created_at: string;
  _count: {
    players_campaigns: number;
    warbands: number;
  };
}

export default function CampaignSelectionPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);  const [user, setUser] = useState<any>(null);
  const [greeting] = useState<string>(getRandomGreeting());
  const [joiningCampaign, setJoiningCampaign] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  
  useEffect(() => {
    // Fetch campaigns and user info
    Promise.all([
      fetch('/api/campaigns').then(res => res.json()),
      fetch('/api/me').then(res => res.json())
    ])    .then(([campaignsData, userData]) => {      // If user is not authenticated
      if (!userData.user) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }
      
      setCampaigns(campaignsData.campaigns || []);
      setUser(userData.user || null);
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
      // If there's an error (like 401), redirect to login
      router.push('/login');
    })
    .finally(() => setLoading(false));
  }, [router]);
  const handleCampaignSelect = (campaignId: number) => {
    router.push(`/campaign/${campaignId}`);
  };
  const handleJoinCampaign = async (campaignId: number) => {
    setJoiningCampaign(campaignId);
    setError('');
    setShowError(false);
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - redirect to campaign
        router.push(`/campaign/${campaignId}`);
      } else {
        // Error - show user-friendly message
        setError(data.error || 'Не вдалося приєднатися до кампанії');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      setError('Помилка з\'єднання. Спробуйте ще раз.');
      setShowError(true);
    } finally {
      setJoiningCampaign(null);
    }
  };
  const handleCreateCampaign = () => {
    router.push('/create-campaign');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };    if (loading) {
    return (
      <div className="consistentLoadingContainer">
        <CircularProgress />
      </div>
    );
  }

  // If not authenticated after loading, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }  return (
    <div className="consistentBackgroundContainer">
      <div className={styles.campaignSelectionHeader}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 700, 
          textAlign: 'center',
          mb: 2,
          color: 'primary.main',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {greeting}
        </Typography>
        <Typography variant="h6" sx={{ 
          textAlign: 'center',
          color: 'text.secondary',
          mb: 4
        }}>
          Оберіть кампанію, щоб приєднатися до битви
        </Typography>
      </div><div className={styles.campaignGrid}>
        {campaigns.map((campaign) => (
          <Card 
            key={campaign.id}
            className={styles.campaignCard}
            onClick={() => handleCampaignSelect(campaign.id)}
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            {campaign.image && (
              <CardMedia
                component="img"
                height="200"
                image={campaign.image}
                alt={campaign.name}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                {campaign.name}
              </Typography>
              {campaign.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {campaign.description}
                </Typography>
              )}              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Гравці" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography variant="body2">{campaign._count.players_campaigns}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Варбанди" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SecurityIcon fontSize="small" color="secondary" />
                      <Typography variant="body2">{campaign._count.warbands}</Typography>
                    </Box>
                  </Tooltip>                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {user?.is_super_admin && (
                    <Tooltip title="Редагувати кампанію" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/edit-campaign/${campaign.id}`);
                        }}
                        sx={{ 
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2)' }
                        }}
                      >
                        <EditIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Button 
                    variant="contained" 
                    size="small"
                    disabled={joiningCampaign === campaign.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinCampaign(campaign.id);
                    }}
                  >
                    {joiningCampaign === campaign.id ? <CircularProgress size={16} /> : 'Приєднатися'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}      </div>

      {campaigns.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Поки що немає доступних кампаній
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {user?.is_super_admin ? 'Створіть першу кампанію, щоб розпочати!' : 'Перевірте пізніше наявність нових кампаній'}
          </Typography>
        </Box>
      )}

      {/* Logout button in bottom left corner to avoid navbar overlap */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 100,
        }}
      >
        Вийти
      </Button>

      {user?.is_super_admin && (
        <Fab
          color="primary"
          aria-label="create campaign"
          onClick={handleCreateCampaign}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>      )}

      {/* Error message */}
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}
