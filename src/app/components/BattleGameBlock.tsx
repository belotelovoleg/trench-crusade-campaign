import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress, Button, Avatar, Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import GameResultView from './GameResultView';
import GameResultEdit from './GameResultEdit';
import FACTION_AVATARS from '../factionAvatars';

interface BattleGameBlockProps {
  currentGame: any;
  selectedGame: number;
  roster: any;
  rosterLoading: boolean;
  rosterError: string | null;
  handleDownloadRoster: () => void;
  setOpenPlanGame: (open: boolean) => void;
  opponentPlannedBlock: React.ReactNode;
  handleStartGame: (game: any) => void;
  handleCancelGame: (game: any) => void;
  readyLoading?: boolean;
  readyState?: 'none'|'waiting'|'active';
  lastReadyGameId?: number|null;
  currentUserId?: number;  handleApproveResult: (gameId: number) => void;
  handleRejectResult: (gameId: number) => void;
  warband?: any; // Add warband prop to access status
  campaignId?: string; // Add campaignId prop for navigation
  isAdmin?: boolean; // Add isAdmin prop for admin actions
}

const BattleGameBlock: React.FC<BattleGameBlockProps> = ({
  currentGame,
  selectedGame,
  roster,
  rosterLoading,
  rosterError,
  handleDownloadRoster,
  setOpenPlanGame,
  opponentPlannedBlock,
  handleStartGame,
  handleCancelGame,
  readyLoading,
  readyState,
  lastReadyGameId,
  currentUserId,
  warband,
  campaignId,
  isAdmin = false
}) => {const [gameResultViewOpen, setGameResultViewOpen] = useState(false);  const [gameResultEditOpen, setGameResultEditOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'approve' | 'ownResult'>('view');
  const [isAdminEdit, setIsAdminEdit] = useState(false);

  // Helper function to render a player row
  const renderPlayerRow = (warband: any, vp: number, gp: number) => {
    const player = warband?.players;
    const factionName = warband?.catalogue_name;
    const factionAvatar = factionName && FACTION_AVATARS[factionName];
    
    return (
      <Box sx={{ display:'flex', gap:2, alignItems:'center' }}>
        {/* Faction avatar */}
        {factionAvatar && (
          <Tooltip title={factionName} arrow>
            <img 
              src={factionAvatar} 
              alt={factionName} 
              style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} 
            />
          </Tooltip>
        )}
        {/* Player avatar */}
        <Avatar 
          src={player?.avatar_url ? `/api/avatar/${player.avatar_url}` : '/api/avatar/default'} 
          sx={{ width: 32, height: 32 }}
        />
        {/* Player info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
            {warband?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({player?.name})
          </Typography>
        </Box>
        {/* Scores */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Переможні бали (VP)" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {vp}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Слава (GP)" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MilitaryTechIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {gp}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    );
  };
  const [confirmMode, setConfirmMode] = useState<'approve'|'reject'|null>(null);

  // Determine readiness state for UI
  let myIsReady = false;
  let opponentIsReady = false;
  let isPlayer1 = false;
  let isSelfVsSelf = false;
  if (currentGame && currentGame.player1_isReady !== undefined && currentGame.player2_isReady !== undefined) {
    const player1Id = currentGame.player1_id;
    const player2Id = currentGame.player2_id;
    if (player1Id && player2Id && player1Id === player2Id && currentUserId && player1Id === currentUserId) {
      // Both warbands belong to the same user
      isSelfVsSelf = true;
      isPlayer1 = true; // Arbitrary, both are 'me'
      myIsReady = currentGame.player1_isReady && currentGame.player2_isReady;
      opponentIsReady = currentGame.player1_isReady && currentGame.player2_isReady;
    } else {
      // Use player1_id/player2_id to determine which player is 'me'
      if (currentUserId && player1Id === currentUserId) {
        isPlayer1 = true;
      } else if (currentUserId && player2Id === currentUserId) {
        isPlayer1 = false;
      } else if (roster && roster.warband_id) {
        // fallback to warband id if user id is not available
        isPlayer1 = currentGame.warband_1_id === roster.warband_id;
      }
      myIsReady = isPlayer1 ? currentGame.player1_isReady : currentGame.player2_isReady;
      opponentIsReady = isPlayer1 ? currentGame.player2_isReady : currentGame.player1_isReady;
    }
  }

  return (
    <>
      <Paper sx={{p:2,mb:2, borderRadius: 2, background: 'rgba(255,255,255,0.75)'}}>
        <Typography variant="subtitle1" sx={{mb:1}}>Ростер варбанди</Typography>
        {rosterLoading ? (
          <CircularProgress size={20} />
        ) : roster ? (
          <>
            <Button  onClick={handleDownloadRoster} sx={{mb:1}}>
              Скачати JSON
            </Button>
            {/* Коротка інфа про ростер (кількість моделей і загальна ціна в дукатах) */}
            {(() => {
              // Використовуємо напряму з БД, якщо є
              if (typeof roster.model_count === 'number' && typeof roster.ducats === 'number') {
                return (
                  <Typography variant="body2" color="text.secondary">
                    Моделей у ростері: {roster.model_count}<br/>
                    Загальна ціна ростера: {roster.ducats} дукатів<br/>
                    Glory Points: {roster.glory_points ?? 0}
                  </Typography>
                );
              }
              return null;
            })()}
          </>
        ) : rosterError ? (
          <Typography color="error" variant="body2">{rosterError}</Typography>
        ) : (
          <Typography color="text.secondary" variant="body2">Ростер не знайдено</Typography>
        )}
      </Paper>
      <Paper sx={{p:2, borderRadius: 2, background: 'rgba(255,255,255,0.75)'}}>
        {currentGame ? (
          currentGame.status === 'finished' ? (            <>              <Typography variant="subtitle1" sx={{mb:1}}>
                Гра {selectedGame} 
                <Typography component="span" variant="caption" color="text.secondary" sx={{ml:1}}>
                  (клікніть на результат для деталей)
                </Typography>
              </Typography>

              {/* Single clickable container for entire game result */}
              <Box 
                sx={{
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  '&:hover': { 
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => {
                  setViewMode('view');
                  setGameResultViewOpen(true);
                }}
              >
                {/* Player 1 */}
                <Box sx={{ mb: 1 }}>
                  {renderPlayerRow(
                    currentGame.warbands_games_warband_1_idTowarbands,
                    currentGame.vp_1,
                    currentGame.gp_1
                  )}
                </Box>

                {/* Player 2 */}
                {renderPlayerRow(
                  currentGame.warbands_games_warband_2_idTowarbands,
                  currentGame.vp_2,
                  currentGame.gp_2
                )}
              </Box>
            </>
          ) : (
            <>
              <Typography>Статус гри: {currentGame.status === 'planned' ? 'Запланована' : currentGame.status === 'active' ? 'Триває' : currentGame.status === 'cancelled' ? 'Скасована' : currentGame.status}</Typography>
              {opponentPlannedBlock}
              {/* Кнопка скачування ростера супротивника */}              {/* Status indicator for planned games */}
              {currentGame.status === 'planned' && (
                <Box sx={{mt:2, mb:1, display:'flex', alignItems:'center', gap:1}}>
                  <Typography color={opponentIsReady ? "success.main" : "warning.main"}>
                    {myIsReady 
                      ? (opponentIsReady ? "Обидва гравці готові! Натисніть 'Почати гру'" : "Ви готові, очікуємо на опонента")
                      : (opponentIsReady ? "Опонент готовий, підтвердіть свою готовність" : "Очікуємо підтвердження від обох гравців")}
                  </Typography>
                </Box>
              )}
                
              {/* Start game button */}
              {currentGame.status === 'planned' && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  sx={{mt:2, mr:2}}
                  onClick={()=>handleStartGame(currentGame)}
                  disabled={readyLoading && lastReadyGameId === currentGame.id || myIsReady}
                >
                  {readyLoading && lastReadyGameId === currentGame.id ? <CircularProgress size={18} sx={{mr:1}}/> : null}
                  {myIsReady ? 'Ви підтвердили готовність' : 'Підтвердити готовність'}
                </Button>
              )}
              {/* Start active game button - only appears when both players are ready */}
              {currentGame.status === 'planned' && myIsReady && opponentIsReady && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  sx={{mt:2, ml:2}}
                  onClick={()=>handleStartGame(currentGame)}
                >
                  Почати активну гру
                </Button>
              )}
              {/* Якщо гра стала активною */}
              {currentGame.status === 'active' && (readyState === 'active' && lastReadyGameId === currentGame.id) && (
                <Typography color="success.main" sx={{mt:1}}>
                  Гра почалася!
                </Typography>
              )}              {currentGame.status === 'active' && (
                <Button size="small" variant="contained" color="primary" sx={{mt:2}}
                  onClick={() => {
                    setIsAdminEdit(false);
                    setGameResultEditOpen(true);
                  }}                >
                  Завершити гру (ввести результати)
                </Button>
              )}

              {/* Admin edit button - available for any status except 'planned' */}
              {isAdmin && currentGame.status !== 'planned' && (
                <Button 
                  size="small" 
                   
                  color="warning" 
                  sx={{mt:1}}
                  onClick={() => {
                    setIsAdminEdit(true);
                    setGameResultEditOpen(true);
                  }}
                >
                  🛡️ Редагувати (адмін)
                </Button>
              )}

              {/* Додаємо блок для pending_approval */}
              {currentGame.status === 'pending_approval' && (
                <>
                  <Typography color="warning.main" sx={{mt:2}}>Очікується підтвердження результату обома гравцями</Typography>
                  {/* Якщо я ще не підтвердив */}
                  {((isPlayer1 && !currentGame.player1_isApprovedResult) || (!isPlayer1 && !currentGame.player2_isApprovedResult)) && (
                    <Box sx={{display:'flex',gap:2,mt:2}}>                      <Button variant="contained" color="success" onClick={() => {
                        setViewMode('approve');
                        setGameResultViewOpen(true);
                      }}>
                        Подивитись результат
                      </Button>
                    </Box>
                  )}
                  {/* Якщо інший гравець вніс зміни і я ще не підтвердив */}
                  {((isPlayer1 && !currentGame.player1_isApprovedResult && currentGame.player2_isApprovedResult) || 
                    (!isPlayer1 && !currentGame.player2_isApprovedResult && currentGame.player1_isApprovedResult)) && (
                    <Typography color="info.main" sx={{mt:1}}>
                      Опонент вніс зміни до результату гри. Будь ласка, перегляньте та підтвердіть новий результат.
                    </Typography>
                  )}                  {/* Якщо я вже підтвердив */}
                  {((isPlayer1 && currentGame.player1_isApprovedResult) || (!isPlayer1 && currentGame.player2_isApprovedResult)) && (
                    <>
                      <Typography color="text.secondary" sx={{mt:2}}>Ви підтвердили результат. Очікуємо на опонента.</Typography>
                      <Box sx={{display:'flex',gap:2,mt:1}}>                        <Button 
                           
                          color="primary" 
                          size="small"
                          onClick={() => {
                            setViewMode('ownResult');
                            setGameResultViewOpen(true);
                          }}
                        >
                          Переглянути мій результат
                        </Button>
                      </Box>
                    </>
                  )}{/* Remove dialogs from here - they'll be at the bottom */}
                </>
              )}{/* Cancel game button */}
              {currentGame.status === 'planned' && (
                <Button 
                  size="small" 
                   
                  color="error" 
                  sx={{mt:2}}
                  onClick={() => handleCancelGame(currentGame)}
                >
                  Скасувати пропозицію гри
                </Button>
              )}
            </>
          )        ) : (          <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <Typography color="text.secondary" variant="body2">
              {warband?.status === 'checking' 
                ? 'Варбанда на перевірці. Ви можете замінити ростер, якщо завантажили неправильний файл.'
                : warband?.status === 'needs_update' 
                ? 'Спочатку оновіть ростер варбанди, а потім запросіть опонента для нової гри.'
                : 'Гра ще не запланована. Ви можете запросити опонента для нової гри.'
              }
            </Typography>
            {warband?.status === 'checking' ? (              <Button 
                variant="contained" 
                color="info" 
                sx={{mt:2, fontWeight: 700}} 
                onClick={() => {
                  if (campaignId && warband?.id) {
                    window.location.href = `/campaign/${campaignId}/warband-apply?warband_id=${warband.id}&replace=true`;
                  }
                }}
              >
                <span style={{fontSize:18,marginRight:6}}>🔄</span> Замінити ростер
              </Button>
            ) : warband?.status === 'needs_update' ? (
              <Button 
                variant="contained" 
                color="warning" 
                sx={{mt:2, fontWeight: 700}} 
                onClick={() => {
                  if (campaignId && warband?.id) {
                    window.location.href = `/campaign/${campaignId}/warband-apply?warband_id=${warband.id}`;
                  }
                }}
              >
                <span style={{fontSize:18,marginRight:6}}>🛠️</span> Оновити ростер
              </Button>
            ) : (
              <Button variant="contained" color="primary" sx={{mt:2}} onClick={()=>setOpenPlanGame(true)}>
                Запланувати гру
              </Button>
            )}</Box>
        )}
      </Paper>

      {/* Dialogs - rendered unconditionally, controlled by open props */}
      <GameResultView
        open={gameResultViewOpen}
        onClose={() => setGameResultViewOpen(false)}
        game={currentGame}
        mode={viewMode}        onAction={async (action) => {
          if (action === 'edit') {
            setGameResultViewOpen(false);
            setIsAdminEdit(false);
            setGameResultEditOpen(true);
          } else if (action === 'approve') {
            try {
              const res = await fetch('/api/campaigns/'+currentGame.campaign_id+'/battles/plan/results', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: currentGame.id, action: 'approve' })
              });
              if (!res.ok) throw new Error('Не вдалося підтвердити результат');
              setGameResultViewOpen(false);
              if (typeof window !== 'undefined') window.location.reload();
            } catch (error) {
              console.error('Error approving result:', error);
              // You might want to show an error message to the user here
            }
          } else if (action === 'reject') {
            try {
              const res = await fetch('/api/campaigns/'+currentGame.campaign_id+'/battles/plan/results', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: currentGame.id, action: 'reject' })
              });
              if (!res.ok) throw new Error('Не вдалося відхилити результат');
              setGameResultViewOpen(false);
              if (typeof window !== 'undefined') window.location.reload();
            } catch (error) {
              console.error('Error rejecting result:', error);
              // You might want to show an error message to the user here
            }
          }
        }}
      />

      <GameResultEdit
        open={gameResultEditOpen}
        onClose={() => setGameResultEditOpen(false)}
        game={currentGame}
        isAdmin={isAdminEdit}
        onResultsSaved={() => {
          setGameResultEditOpen(false);
          if (typeof window !== 'undefined') window.location.reload();
        }}
      />
    </>
  );
};

export default BattleGameBlock;
