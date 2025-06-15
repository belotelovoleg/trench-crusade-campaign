import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, LinearProgress, RadioGroup, FormControlLabel, Radio, List, ListItemAvatar, ListItemText, Avatar, ListItemButton, Tooltip } from '@mui/material';
import FACTION_AVATARS from '../factionAvatars';

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
  // --- СТАНИ ДІАЛОГУ ---
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [selectedOpponentWarband, setSelectedOpponentWarband] = useState<any>(null);
  const [planGameError, setPlanGameError] = useState<string|null>(null);
  const [planGameLoading, setPlanGameLoading] = useState(false);
  // --- Завантаження списку гравців ---
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
            // Відфільтрувати себе
            const filtered = (data.players||[]).filter((p:any)=>p.id !== me.user.id);
            setPlayersList(filtered);
          })
          .catch(()=>setPlanGameError('Не вдалося завантажити гравців'))
          .finally(()=>setLoadingPlayers(false));
      });
  }, [open, campaignId]);

  // --- СТАНИ ТА ЛОГІКА ВАРБАНД ОПОНЕНТА ---
  const [warbands, setWarbands] = useState<any[]>([]);
  const [loadingWarbands, setLoadingWarbands] = useState(false);
  const [warbandsError, setWarbandsError] = useState<string|null>(null);
  useEffect(() => {
    if (!selectedOpponent || !campaignId) {
      setWarbands([]);
      return;
    }
    setLoadingWarbands(true);
    setWarbandsError(null);
    fetch(`/api/campaigns/${campaignId}/players/${selectedOpponent.id}/warbands`)
      .then(res => res.json())
      .then(data => {
        setWarbands(data.warbands || []);
      })
      .catch(()=>setWarbandsError('Не вдалося завантажити варбанди'))
      .finally(()=>setLoadingWarbands(false));
  }, [selectedOpponent, campaignId]);
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
            <Typography variant="subtitle2" sx={{mb:1}}>Оберіть опонента:</Typography>
            {playersList.length === 0 ? (
              <Typography color="text.secondary" sx={{mb:2}}>Немає доступних опонентів для гри.</Typography>
            ) : (              <RadioGroup 
                value={selectedOpponent?.id||''} 
                onChange={(_,v)=>{
                  const found = playersList.find(p=>p.id==v);
                  setSelectedOpponent(found);
                  setSelectedOpponentWarband(null);
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                {playersList.map(player=>(
                  <FormControlLabel
                    key={player.id}
                    value={player.id}
                    control={<Radio/>}
                    label={
                      <span style={{display:'flex',alignItems:'center',gap:8}}>
                        <Avatar 
                          sx={{width:24,height:24}} 
                          src={player.avatar_url ? `/api/avatar/${player.avatar_url}` : '/api/avatar/default'} 
                        />
                        <span>{player.name||player.login}</span>
                      </span>
                    }
                  />
                ))}
              </RadioGroup>
            )}
            {selectedOpponent && (
              <>
                <Typography variant="subtitle2" sx={{mt:2,mb:1}}>Оберіть варбанду опонента:</Typography>
                {loadingWarbands ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Завантаження варбанд...
                    </Typography>
                    <LinearProgress />
                  </>                ) : warbandsError ? (
                  <Typography color="error">{warbandsError}</Typography>
                ) : !warbands.length ? (
                  <Typography color="text.secondary">Немає активних варбанд</Typography>
                ) : (
                  <List
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      padding: '8px',
                      marginTop: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {warbands.map(warband => (
                      <ListItemButton key={warband.id} selected={selectedOpponentWarband?.id===warband.id} onClick={()=>setSelectedOpponentWarband(warband)}>
                        <ListItemText 
                          primary={
                            <span style={{display:'flex',alignItems:'center',gap:8}}>
                              {warband.catalogue_name && FACTION_AVATARS[warband.catalogue_name] ? (
                                <Tooltip title={warband.catalogue_name} arrow>
                                  <img src={FACTION_AVATARS[warband.catalogue_name]} alt={warband.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                                </Tooltip>
                              ) : null}
                              <span>{warband.name}</span>
                            </span>
                          }
                        />
                        <Radio checked={selectedOpponentWarband?.id===warband.id} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </>
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
