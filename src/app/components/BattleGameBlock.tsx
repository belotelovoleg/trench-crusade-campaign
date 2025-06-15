import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress, Button, Avatar, Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import GameResultsDialog from './GameResultsDialog';
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
  currentUserId?: number;
  handleApproveResult: (gameId: number) => void;
  handleRejectResult: (gameId: number) => void;
  warband?: any; // Add warband prop to access status
  campaignId?: string; // Add campaignId prop for navigation
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
  campaignId
}) => {
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editResultsDialogOpen, setEditResultsDialogOpen] = useState(false);
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
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
            <Button variant="outlined" onClick={handleDownloadRoster} sx={{mb:1}}>
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

              <Box 
                sx={{
                  display:'flex',
                  gap:2,
                  alignItems:'center',
                  mb:1,
                  p:1,
                  borderRadius:1,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  '&:hover': { 
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }
                }}                
                onClick={() => setResultsDialogOpen(true)}
              >
                {/* Player 1 faction avatar */}
                {currentGame.warbands_games_warband_1_idTowarbands.catalogue_name &&
                 FACTION_AVATARS[currentGame.warbands_games_warband_1_idTowarbands.catalogue_name] && (
                  <Tooltip title={currentGame.warbands_games_warband_1_idTowarbands.catalogue_name} arrow>
                    <img 
                      src={FACTION_AVATARS[currentGame.warbands_games_warband_1_idTowarbands.catalogue_name]} 
                      alt={currentGame.warbands_games_warband_1_idTowarbands.catalogue_name} 
                      style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} 
                    />
                  </Tooltip>
                )}
                {/* Player 1 avatar */}
                <Avatar 
                  src={currentGame.warbands_games_warband_1_idTowarbands.players.avatar_url ? 
                    `/api/avatar/${currentGame.warbands_games_warband_1_idTowarbands.players.avatar_url}` : 
                    '/api/avatar/default'} 
                  sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                    {currentGame.warbands_games_warband_1_idTowarbands.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({currentGame.warbands_games_warband_1_idTowarbands.players.name})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="Переможні бали (VP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentGame.vp_1}
                      </Typography>
                    </Box>
                  </Tooltip>                  <Tooltip title="Слава (GP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MilitaryTechIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentGame.gp_1}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>              <Box 
                sx={{
                  display:'flex',
                  gap:2,
                  alignItems:'center',
                  p:1,
                  borderRadius:1,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  '&:hover': { 
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Clicked on result - opening dialog');
                  setResultsDialogOpen(true);
                }}
              >
                {/* Player 2 faction avatar */}
                {currentGame.warbands_games_warband_2_idTowarbands.catalogue_name && 
                 FACTION_AVATARS[currentGame.warbands_games_warband_2_idTowarbands.catalogue_name] && (
                  <Tooltip title={currentGame.warbands_games_warband_2_idTowarbands.catalogue_name} arrow>
                    <img 
                      src={FACTION_AVATARS[currentGame.warbands_games_warband_2_idTowarbands.catalogue_name]} 
                      alt={currentGame.warbands_games_warband_2_idTowarbands.catalogue_name} 
                      style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} 
                    />
                  </Tooltip>
                )}
                {/* Player 2 avatar */}
                <Avatar 
                  src={currentGame.warbands_games_warband_2_idTowarbands.players.avatar_url ? 
                    `/api/avatar/${currentGame.warbands_games_warband_2_idTowarbands.players.avatar_url}` : 
                    '/api/avatar/default'} 
                  sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                    {currentGame.warbands_games_warband_2_idTowarbands.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({currentGame.warbands_games_warband_2_idTowarbands.players.name})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="Переможні бали (VP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentGame.vp_2}
                      </Typography>
                    </Box>
                  </Tooltip>                  <Tooltip title="Слава (GP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MilitaryTechIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentGame.gp_2}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
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
              )}
              {currentGame.status === 'active' && (
                <Button size="small" variant="contained" color="primary" sx={{mt:2}}
                  onClick={() => setResultsDialogOpen(true)}
                >
                  Завершити гру (ввести результати)
                </Button>
              )}              {/* Додаємо блок для pending_approval */}
              {currentGame.status === 'pending_approval' && (
                <>
                  <Typography color="warning.main" sx={{mt:2}}>Очікується підтвердження результату обома гравцями</Typography>
                  {/* Якщо я ще не підтвердив */}
                  {((isPlayer1 && !currentGame.player1_isApprovedResult) || (!isPlayer1 && !currentGame.player2_isApprovedResult)) && (
                    <Box sx={{display:'flex',gap:2,mt:2}}>
                      <Button variant="contained" color="success" onClick={() => setConfirmDialogOpen(true)}>
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
                  )}
                  {/* Якщо я вже підтвердив */}
                  {((isPlayer1 && currentGame.player1_isApprovedResult) || (!isPlayer1 && currentGame.player2_isApprovedResult)) && (
                    <Typography color="text.secondary" sx={{mt:2}}>Ви підтвердили результат. Очікуємо на опонента.</Typography>
                  )}                  {/* Діалог підтвердження/відхилення результату */}
                  <GameResultsDialog
                    open={confirmDialogOpen}
                    onClose={() => setConfirmDialogOpen(false)}
                    game={currentGame}
                    onResultsSaved={(action) => {
                      setConfirmDialogOpen(false);
                      if (action === 'edit') {
                        // Якщо користувач натиснув "Змінити результат", відкриваємо діалог редагування
                        setEditResultsDialogOpen(true);
                      } else if (action === 'approve') {
                        // Якщо користувач підтвердив результат
                        if (typeof window !== 'undefined') window.location.reload();
                      }
                    }}
                    readOnly={true}
                    confirmMode="approve"
                  />                  {/* Діалог редагування результату */}
                  <GameResultsDialog
                    open={editResultsDialogOpen}
                    onClose={() => setEditResultsDialogOpen(false)}
                    game={currentGame}
                    onResultsSaved={(action) => {
                      setEditResultsDialogOpen(false);
                      if (typeof window !== 'undefined') window.location.reload();
                    }}
                  />
                </>
              )}                <GameResultsDialog
                open={resultsDialogOpen}
                onClose={() => setResultsDialogOpen(false)}
                game={currentGame}
                onResultsSaved={(action) => {
                  setResultsDialogOpen(false);
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              />

              {/* View-only dialog for finished games */}
              <GameResultsDialog
                open={viewResultsDialogOpen}
                onClose={() => setViewResultsDialogOpen(false)}
                game={currentGame}
                onResultsSaved={() => setViewResultsDialogOpen(false)}
                readOnly={true}
                adminViewOnly={true}
              />

              {/* Cancel game button */}
              {currentGame.status === 'planned' && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  sx={{mt:2}}
                  onClick={() => handleCancelGame(currentGame)}
                >
                  Скасувати пропозицію гри
                </Button>
              )}
            </>
          )        ) : (
          <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <Typography color="text.secondary" variant="body2">
              Гра ще не запланована. {warband?.status === 'needs_update' ? 'Спочатку оновіть ростер варбанди, а потім запросіть опонента для нової гри.' : 'Ви можете запросити опонента для нової гри.'}
            </Typography>
            {warband?.status === 'needs_update' ? (
              <Button 
                variant="contained" 
                color="warning" 
                sx={{mt:2, fontWeight: 700}} 
                onClick={() => {
                  if (campaignId && warband?.id) {
                    window.location.href = `/campaign/${campaignId}/warband-apply?warband_id=${warband.id}&warband_name=${encodeURIComponent(warband.name || '')}`;
                  }
                }}
              >
                <span style={{fontSize:18,marginRight:6}}>🛠️</span> Оновити ростер
              </Button>
            ) : (
              <Button variant="contained" color="primary" sx={{mt:2}} onClick={()=>setOpenPlanGame(true)}>
                Запланувати гру
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </>
  );
};

export default BattleGameBlock;
