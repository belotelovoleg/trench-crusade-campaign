import React, { useState } from 'react';
import { Paper, Typography, CircularProgress, Button, Avatar, Box } from '@mui/material';
import GameResultsDialog from './GameResultsDialog';

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
  currentUserId?: number; // <-- add this prop
  handleApproveResult: (gameId: number) => void;
  handleRejectResult: (gameId: number) => void;
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
  handleApproveResult,
  handleRejectResult
}) => {
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
          currentGame.status === 'finished' ? (
            <>
              <Typography variant="subtitle1">Гра {selectedGame}</Typography>
              <Box sx={{display:'flex',gap:2,alignItems:'center',mb:1}}>
                <Avatar src={currentGame.warbands_games_warband_1_idTowarbands.players.avatar_url ? `/api/avatar/${currentGame.warbands_games_warband_1_idTowarbands.players.avatar_url}` : undefined} />
                <span>{currentGame.warbands_games_warband_1_idTowarbands.name}</span>
                <span>({currentGame.warbands_games_warband_1_idTowarbands.players.name})</span>
                <b>VP: {currentGame.vp_1}</b>
                <b>GP: {currentGame.gp_1}</b>
              </Box>
              <Box sx={{display:'flex',gap:2,alignItems:'center'}}>
                <Avatar src={currentGame.warbands_games_warband_2_idTowarbands.players.avatar_url ? `/api/avatar/${currentGame.warbands_games_warband_2_idTowarbands.players.avatar_url}` : undefined} />
                <span>{currentGame.warbands_games_warband_2_idTowarbands.name}</span>
                <span>({currentGame.warbands_games_warband_2_idTowarbands.players.name})</span>
                <b>VP: {currentGame.vp_2}</b>
                <b>GP: {currentGame.gp_2}</b>
              </Box>
            </>
          ) : (
            <>
              <Typography>Статус гри: {currentGame.status === 'planned' ? 'Запланована' : currentGame.status === 'active' ? 'Триває' : currentGame.status === 'cancelled' ? 'Скасована' : currentGame.status}</Typography>
              {opponentPlannedBlock}
              {/* Кнопка скачування ростера супротивника */}
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
                  {myIsReady ? 'Очікуємо на опонента' : 'Почати гру'}
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
              )}
              {/* Додаємо блок для pending_approval */}
              {currentGame.status === 'pending_approval' && (
                <>
                  <Typography color="warning.main" sx={{mt:2}}>Очікується підтвердження результату обома гравцями</Typography>
                  {/* Якщо я ще не підтвердив */}
                  {((isPlayer1 && !currentGame.player1_isApprovedResult) || (!isPlayer1 && !currentGame.player2_isApprovedResult)) && (
                    <Box sx={{display:'flex',gap:2,mt:2}}>
                      <Button variant="contained" color="success" onClick={() => setConfirmDialogOpen(true)}>
                        Передивитись результат
                      </Button>
                    </Box>
                  )}
                  {/* Якщо я вже підтвердив */}
                  {((isPlayer1 && currentGame.player1_isApprovedResult) || (!isPlayer1 && currentGame.player2_isApprovedResult)) && (
                    <Typography color="text.secondary" sx={{mt:2}}>Ви підтвердили результат. Очікуємо на опонента.</Typography>
                  )}
                  {/* Діалог підтвердження/відхилення результату */}
                  <GameResultsDialog
                    open={confirmDialogOpen}
                    onClose={() => setConfirmDialogOpen(false)}
                    game={currentGame}
                    onResultsSaved={() => {
                      setConfirmDialogOpen(false);
                      if (typeof window !== 'undefined') window.location.reload();
                    }}
                    readOnly
                  />
                </>
              )}
              <GameResultsDialog
                open={resultsDialogOpen}
                onClose={() => setResultsDialogOpen(false)}
                game={currentGame}
                onResultsSaved={() => {
                  setResultsDialogOpen(false);
                  // Оновити дані після збереження результатів
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              />
              {currentGame.status === 'planned' && (
                <Button size="small" variant="outlined" color="error" sx={{mt:2}}
                  onClick={() => handleCancelGame(currentGame)}
                >
                  Скасувати гру
                </Button>
              )}
            </>
          )
        ) : (
          <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <Typography color="text.secondary" variant="body2">
              Гра ще не запланована. Ви можете запросити опонента для нової гри.
            </Typography>
            <Button variant="contained" color="primary" sx={{mt:2}} onClick={()=>setOpenPlanGame(true)}>
              Запланувати гру
            </Button>
          </Box>
        )}
      </Paper>
    </>
  );
};

export default BattleGameBlock;
