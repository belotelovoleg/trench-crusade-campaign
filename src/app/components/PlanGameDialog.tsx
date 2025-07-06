import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, LinearProgress, List, ListItemAvatar, ListItemText, Avatar, ListItemButton, Tooltip, Box, Collapse, IconButton, Radio } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FACTION_AVATARS from '../factionAvatars';

interface PlayerWithWarbandsProps {
  player: any;
  campaignId: string;
  selectedOpponent: any;
  selectedOpponentWarband: any;
  onPlayerSelect: (player: any) => void;
  onWarbandSelect: (warband: any) => void;
}

const PlayerWithWarbands: React.FC<PlayerWithWarbandsProps> = ({
  player,
  campaignId,
  selectedOpponent,
  selectedOpponentWarband,
  onPlayerSelect,
  onWarbandSelect,
}) => {
  const [warbands, setWarbands] = useState<any[]>([]);
  const [loadingWarbands, setLoadingWarbands] = useState(false);
  const [warbandsError, setWarbandsError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isSelected = selectedOpponent?.id === player.id;

  useEffect(() => {
    if (!isSelected || !campaignId) {
      setWarbands([]);
      setExpanded(false);
      return;
    }
    
    setLoadingWarbands(true);
    setWarbandsError(null);
    setExpanded(true);
    
    fetch(`/api/campaigns/${campaignId}/players/${player.id}/warbands`)
      .then(res => res.json())
      .then(data => {
        setWarbands(data.warbands || []);
      })
      .catch(() => setWarbandsError('Не вдалося завантажити варбанди'))
      .finally(() => setLoadingWarbands(false));
  }, [isSelected, campaignId, player.id]);

  const handlePlayerClick = () => {
    if (isSelected) {
      // If already selected, toggle expansion
      setExpanded(!expanded);
    } else {
      // Select new player
      onPlayerSelect(player);
      onWarbandSelect(null);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handlePlayerClick}
        selected={isSelected}
        sx={{
          borderRadius: '8px',
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          },
        }}
      >
        <ListItemAvatar>
          <Avatar 
            sx={{ width: 32, height: 32 }} 
            src={player.avatar_url ? `/api/avatar/${player.avatar_url}` : '/api/avatar/default'} 
          />
        </ListItemAvatar>
        <ListItemText 
          primary={player.name || player.login}
          primaryTypographyProps={{ fontWeight: isSelected ? 'bold' : 'normal' }}
        />
        <Radio checked={isSelected} />
        {isSelected && (
          <IconButton size="small" sx={{ ml: 1 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </ListItemButton>

      <Collapse in={isSelected && expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 4, pr: 2, pb: 1 }}>
          {loadingWarbands ? (
            <Box sx={{ py: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Завантаження варбанд...
              </Typography>
              <LinearProgress />
            </Box>
          ) : warbandsError ? (
            <Typography color="error" variant="body2" sx={{ py: 1 }}>
              {warbandsError}
            </Typography>
          ) : !warbands.length ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>
              Немає активних варбанд
            </Typography>
          ) : (
            <List dense sx={{ py: 0 }}>
              {warbands.map(warband => (
                <ListItemButton
                  key={warband.id}
                  selected={selectedOpponentWarband?.id === warband.id}
                  onClick={() => onWarbandSelect(warband)}
                  sx={{
                    borderRadius: '6px',
                    mb: 0.5,
                    minHeight: 40,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(76, 175, 80, 0.12)',
                    },
                  }}
                >
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {warband.catalogue_name && FACTION_AVATARS[warband.catalogue_name] && (
                          <Tooltip title={warband.catalogue_name} arrow>
                            <img 
                              src={FACTION_AVATARS[warband.catalogue_name]} 
                              alt={warband.catalogue_name} 
                              style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          </Tooltip>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: selectedOpponentWarband?.id === warband.id ? 'bold' : 'normal' }}>
                          {warband.name}
                        </Typography>
                      </Box>
                    }
                  />
                  <Radio 
                    checked={selectedOpponentWarband?.id === warband.id} 
                    size="small"
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </>
  );
};

interface PlanGameDialogProps {
  open: boolean;
  onClose: () => void;
  warband: any;
  selectedGame: number;
  campaignId: string;
  onGamePlanned: () => void;
}

const PlanGameDialog: React.FC<PlanGameDialogProps> = ({
  open,
  onClose,
  warband,
  selectedGame,
  campaignId,
  onGamePlanned,
}) => {
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [selectedOpponentWarband, setSelectedOpponentWarband] = useState<any>(null);
  const [planGameError, setPlanGameError] = useState<string|null>(null);
  const [planGameLoading, setPlanGameLoading] = useState(false);
  // Load players list
  useEffect(() => {
    if (!open || !campaignId) return;
    setLoadingPlayers(true);
    setPlanGameError(null);
    fetch('/api/me')
      .then(res => res.json())
      .then(me => {
        fetch(`/api/campaigns/${campaignId}/players`)
          .then(res => res.json())
          .then(data => {
            // Filter out self
            const filtered = (data.players||[]).filter((p:any)=>p.id !== me.user.id);
            setPlayersList(filtered);
          })
          .catch(()=>setPlanGameError('Не вдалося завантажити гравців'))
          .finally(()=>setLoadingPlayers(false));
      });
  }, [open, campaignId]);
  // --- Планування гри ---
  async function handlePlanGame() {
    if (!selectedOpponent || !selectedOpponentWarband || !campaignId) return;
    setPlanGameLoading(true);
    setPlanGameError(null);
    try {
      // Дізнаємось свій актуальний roster_id
      const myRosterId = warband.rosters && warband.rosters.length > 0 ? warband.rosters[0].id : null;
      const opponentRosterId = selectedOpponentWarband.rosters && selectedOpponentWarband.rosters.length > 0 ? selectedOpponentWarband.rosters[0].id : null;
      const res = await fetch(`/api/campaigns/${campaignId}/battles/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warband_1_id: warband.id,
          warband_2_id: selectedOpponentWarband.id,
          warband_1_roster_id: myRosterId,
          warband_2_roster_id: opponentRosterId,
          warband_1_gameNumber: selectedGame
        })
      });
      if (!res.ok) {
        let msg = 'Не вдалося створити гру';
        try {
          const err = await res.json();
          if (err && err.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }
      onClose();
      onGamePlanned();
    } catch (e: any) {
      setPlanGameError(e.message || 'Не вдалося створити гру');
    } finally {
      setPlanGameLoading(false);
    }
  }
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth      PaperProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(4px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <DialogTitle>Запланувати гру</DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          margin: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        {loadingPlayers ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Завантаження списку гравців...
            </Typography>
            <LinearProgress />
          </>
        ) : planGameError ? (
          <Typography color="error">{planGameError}</Typography>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{mb:1}}>Оберіть опонента та його варбанду:</Typography>
            {playersList.length === 0 ? (
              <Typography color="text.secondary" sx={{mb:2}}>Немає доступних опонентів для гри.</Typography>
            ) : (
              <List
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginTop: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {playersList.map(player => (
                  <PlayerWithWarbands
                    key={player.id}
                    player={player}
                    campaignId={campaignId}
                    selectedOpponent={selectedOpponent}
                    selectedOpponentWarband={selectedOpponentWarband}
                    onPlayerSelect={(p) => {
                      setSelectedOpponent(p);
                      setSelectedOpponentWarband(null);
                    }}
                    onWarbandSelect={setSelectedOpponentWarband}
                  />
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button disabled={!selectedOpponentWarband || planGameLoading || playersList.length === 0} onClick={handlePlanGame} variant="contained">
          Запропонувати гру
        </Button>
      </DialogActions>
      {/* Info text explaining the confirmation process */}
      <Typography variant="caption" color="text.secondary" sx={{px:3, pb:2, textAlign:'center', display:'block'}}>
        Після пропозиції гри, обидва гравці повинні підтвердити свою готовність перш ніж гра почнеться.
      </Typography>
    </Dialog>
  );
};

export default PlanGameDialog;
