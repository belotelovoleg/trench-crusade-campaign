"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress, Button, Avatar, Slider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import styles from '../page.module.css';
import PlanGameDialog from './PlanGameDialog';
import FACTION_AVATARS from '../factionAvatars';
import BattleGameBlock from './BattleGameBlock';

function BattlePageContent() {
  const searchParams = useSearchParams();
  const warbandId = searchParams?.get('warband_id');
  const warbandIdNum = Number(warbandId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(1);
  const [roster, setRoster] = useState<any>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  useEffect(() => {
    if (!warbandIdNum) return;
    fetch(`/api/battle?warband_id=${warbandIdNum}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [warbandIdNum]);

  // --- Додаємо типізацію для ростерів ---
  type WarbandRoster = {
    id: number;
    file_url: string;
    model_count?: number;
    ducats?: number;
    glory_points?: number;
    game_number?: number;
    [key: string]: any;
  };

  // --- Додаємо стани для кешу ростерів ---
  const [rostersCache, setRostersCache] = useState<{[fileUrl: string]: any}>({});

  // --- Додаємо useEffect для завантаження ростера ---
  useEffect(() => {
    // Діагностика
    console.log('loadRoster:', { warbandIdNum, selectedGame });
    setRoster(null);
    setRosterError(null);
    // Перевірка на валідність
    if (!warbandIdNum || !selectedGame || isNaN(selectedGame)) return;
    setRosterLoading(true);
    fetch(`/api/roster?warband_id=${warbandIdNum}&game_number=${selectedGame}`)
      .then(async res => {
        let json;
        try {
          json = await res.json();
        } catch {
          throw new Error('Invalid JSON');
        }
        if (json && json.error) {
          // Покращене повідомлення про помилку
          let msg = 'Не вдалося завантажити ростер';
          if (json.reason === 'db') msg = 'Ростер не знайдено в базі даних для цієї гри.';
          else if (json.reason === 'file') msg = 'Файл ростера відсутній на сервері.';
          else if (json.reason === 'db_file_url') msg = 'У базі даних не вказано файл ростера.';
          else if (json.reason === 'missing_param') msg = 'Некоректний запит: не вказано параметри.';
          else if (json.reason === 'file_read') msg = 'Помилка читання файлу ростера.';
          setRosterError(msg);
          throw new Error(msg);
        }
        return json;
      })
      .then(setRoster)
      .catch((e) => {
        if (!rosterError) setRosterError('Не вдалося завантажити ростер');
      })
      .finally(() => setRosterLoading(false));
  }, [selectedGame, warbandIdNum]);

  const handleDownloadRoster = () => {
    // Підтримка як file_url, так і прямого JSON-об'єкта
    if (roster && roster.file_url) {
      // Якщо є file_url — просто відкриваємо його
      const link = document.createElement('a');
      link.href = roster.file_url;
      link.download = `roster_${warband.name}_${selectedGame}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (roster && roster.roster) {
      // Якщо file_url немає, але є JSON — зберігаємо його як файл
      const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roster_${warband.name}_${selectedGame}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // --- Додаємо стани для попапу планування гри ---
  const [openPlanGame, setOpenPlanGame] = useState(false);

  // --- Додаємо стани та функції для скасування гри ---
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [gameToCancel, setGameToCancel] = useState<any>(null);
  function handleCancelGame(game: any) {
    setCancelDialogOpen(true);
    setGameToCancel(game);
  }
  async function confirmCancelGame() {
    setCancelDialogOpen(false);
    if (!gameToCancel?.id) return;
    try {
      await fetch(`/api/battle/plan?id=${gameToCancel.id}`, { method: 'DELETE' });
      setLoading(true);
      fetch(`/api/battle?warband_id=${warband.id}`)
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    } catch {}
    setGameToCancel(null);
  }
  // --- Почати гру (зараз просто reload, можна додати логіку пізніше) ---
  // --- Додаємо стани для готовності до гри ---
  const [readyLoading, setReadyLoading] = useState(false);
  const [readyState, setReadyState] = useState<'none'|'waiting'|'active'>('none');
  const [lastReadyGameId, setLastReadyGameId] = useState<number|null>(null);

  // --- Почати гру (оновлено: логіка готовності) ---
  async function handleStartGame(game: any) {
    if (!game?.id) return;
    setReadyLoading(true);
    setLastReadyGameId(game.id);
    setReadyState('waiting');
    try {
      const res = await fetch('/api/battle/plan/ready', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id })
      });
      const dataRes = await res.json();
      if (dataRes?.game?.status === 'active') {
        setReadyState('active');
        // Оновити дані гри
        setLoading(true);
        fetch(`/api/battle?warband_id=${warband.id}`)
          .then(res => res.json())
          .then(setData)
          .finally(() => {
            setLoading(false);
            setReadyLoading(false);
            setReadyState('none');
            setLastReadyGameId(null);
          });
      } else {
        // Якщо ще не активна, просто оновити дані (щоб побачити статус опонента)
        setTimeout(() => {
          setLoading(true);
          fetch(`/api/battle?warband_id=${warband.id}`)
            .then(res => res.json())
            .then(setData)
            .finally(() => {
              setLoading(false);
              setReadyLoading(false);
            });
        }, 1000);
      }
    } catch {
      setReadyLoading(false);
      setReadyState('none');
    }
  }

  // --- Додаємо UI для підтвердження/відхилення результату, якщо статус pending_approval ---
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [resultActionError, setResultActionError] = useState<string|null>(null);

  async function handleApproveResult(gameId: number) {
    setApproveLoading(true);
    setResultActionError(null);
    try {
      const res = await fetch('/api/battle/plan/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, action: 'approve' })
      });
      if (!res.ok) throw new Error('Помилка підтвердження результату');
      setLoading(true);
      fetch(`/api/battle?warband_id=${warband.id}`)
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    } catch (e) {
      setResultActionError('Не вдалося підтвердити результат. Спробуйте ще раз.');
    } finally {
      setApproveLoading(false);
    }
  }
  async function handleRejectResult(gameId: number) {
    setRejectLoading(true);
    setResultActionError(null);
    try {
      const res = await fetch('/api/battle/plan/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, action: 'reject' })
      });
      if (!res.ok) throw new Error('Помилка відхилення результату');
      setLoading(true);
      fetch(`/api/battle?warband_id=${warband.id}`)
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    } catch (e) {
      setResultActionError('Не вдалося відхилити результат. Спробуйте ще раз.');
    } finally {
      setRejectLoading(false);
    }
  }

  if (loading) return <Box sx={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><CircularProgress /></Box>;
  if (!data || !data.warband) return (
    <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:2}}>
      <Typography align="center" color="error" variant="h5">Варбанди не знайдено</Typography>
      <Typography align="center" color="text.secondary">Можливо, ви перейшли за некоректним посиланням або варбанда була видалена.</Typography>
      <Button variant="contained" color="primary" href="/">На головну</Button>
    </Box>
  );

  const { warband, games, stories } = data;
  // Визначаємо ігри цієї варбанди з номерами
  const gamesByNumber: Record<number, any> = {};
  (games || []).forEach((g: any) => {
    if (g.warband_1_id === warband.id && g.warband_1_gameNumber) gamesByNumber[g.warband_1_gameNumber] = g;
    if (g.warband_2_id === warband.id && g.warband_2_gameNumber) gamesByNumber[g.warband_2_gameNumber] = g;
  });
  // --- нова логіка для stories ---
  // Визначаємо історії по game_id (battle API)
  const storiesByNumber: Record<number, string> = {};
  (stories || []).forEach((s: any) => { if (typeof s.game_id === 'number') storiesByNumber[s.game_id] = s.text; });
  const currentStory = storiesByNumber[selectedGame - 1] || null;
  const currentGame = gamesByNumber[selectedGame];

  // --- Блок з інформацією про варбанду супротивника для гри (planned, active, pending_approval) ---
  let opponentPlannedBlock: React.ReactNode = null;
  if (
    currentGame &&
    (currentGame.status === 'planned' || currentGame.status === 'active' || currentGame.status === 'pending_approval') &&
    (currentGame.warbands_games_warband_1_idTowarbands || currentGame.warbands_games_warband_2_idTowarbands)
  ) {
    // Визначаємо, хто я: player1 чи player2
    const isPlayer1 = currentGame.player1_id === warband.players.id;
    const oppWarband = isPlayer1
      ? currentGame.warbands_games_warband_2_idTowarbands
      : currentGame.warbands_games_warband_1_idTowarbands;
    const oppPlayer = oppWarband?.players;
    const oppRoster = oppWarband?.rosters && oppWarband.rosters.length > 0 ? oppWarband.rosters[0] : null;
    // Використовуємо напряму з БД, без парсингу JSON
    const modelCount = oppRoster?.model_count ?? 0;
    const ducats = oppRoster?.ducats ?? 0;
    const gloryPoints = oppRoster?.glory_points ?? 0;
    opponentPlannedBlock = (
      <Box sx={{mt:2, mb:1, p:1, border:'1px solid #eee', borderRadius:2, background:'#fafbfc'}}>
        {/* 1. Супротивник (аватар + ім'я) */}
        <Typography variant="subtitle2" sx={{mb:0.5}}>Супротивник:</Typography>
        <Box sx={{display:'flex',alignItems:'center',gap:1,flexWrap:'wrap', mb:1}}>
          <Avatar src={oppPlayer?.avatar_url ? `/api/avatar/${oppPlayer.avatar_url.replace(/^.*[\\/]/, '')}` : undefined} sx={{width:32,height:32}} />
          <span>{oppPlayer?.name || oppPlayer?.login}</span>
        </Box>
        {/* 2. Варбанда (іконка+title) + назва варбанди */}
        <Typography variant="subtitle2" sx={{mb:0.5}}>Варбанда:</Typography>
        <Box sx={{display:'flex',alignItems:'center',gap:1,mt:0.5, mb:1}}>
          {oppWarband?.catalogue_name && FACTION_AVATARS[oppWarband.catalogue_name] && (
            <Tooltip title={oppWarband.catalogue_name} arrow>
              <img src={FACTION_AVATARS[oppWarband.catalogue_name]} alt={oppWarband.catalogue_name} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle',marginRight:4}} />
            </Tooltip>
          )}
          <span>{oppWarband?.name}</span>
        </Box>
        {/* 3. Статистика з іконками та тултіпами */}
        <Box sx={{display:'flex',alignItems:'center',gap:2,mt:0.5}}>
          <Tooltip title="Кількість моделей" arrow>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span role="img" aria-label="models">🧍</span>
              <b>{modelCount}</b>
            </span>
          </Tooltip>
          <Tooltip title="Дукати" arrow>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span role="img" aria-label="ducats">💰</span>
              <b>{ducats}</b>
            </span>
          </Tooltip>
          <Tooltip title="Glory Points" arrow>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span role="img" aria-label="glory">⭐</span>
              <b>{gloryPoints}</b>
            </span>
          </Tooltip>
          {oppRoster && oppRoster.file_url && (
            <Button size="small" variant="outlined" sx={{ml:2}} onClick={()=>{
              const link = document.createElement('a');
              link.href = oppRoster.file_url;
              link.download = `roster_${oppWarband.name}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>Скачати ростер опонента</Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <div className={styles.mainPageRoot}>
      <div className={styles.mainPageTitle}>
        {warband.catalogue_name && FACTION_AVATARS[warband.catalogue_name] ? (
          <Tooltip title={warband.catalogue_name} arrow>
            <img
              src={FACTION_AVATARS[warband.catalogue_name]}
              alt={warband.catalogue_name}
              style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle',marginRight:8}}
            />
          </Tooltip>
        ) : null}
        {warband.name}
      </div>
      {/* Повзунок над обома блоками */}
      <Box sx={{mb:2, px:2}}>
        <Slider
          value={selectedGame}
          min={1}
          max={12}
          step={1}
          marks
          valueLabelDisplay="auto"
          onChange={(_,v)=>setSelectedGame(Number(v))}
          sx={{ minWidth: 300, width: '90%', mx: 'auto' }}
        />
        <Typography align="center" variant="subtitle2" sx={{mt:1}}>Гра {selectedGame}</Typography>
      </Box>
      <div className={styles.mainPageBlocks}>
        <div className={styles.battleAboutBlock}>
          <Paper sx={{p:2,minHeight:120, borderRadius:2, background: 'rgba(255,255,255,0.75)'}}>
            {currentStory ? (
              <div dangerouslySetInnerHTML={{ __html: currentStory }} />
            ) : (
              <Typography color="text.secondary">Історія для цього етапу кампанії ще не написана.</Typography>
            )}
          </Paper>
        </div>
        <div className={styles.battleButtonBlock}>
          <BattleGameBlock
            currentGame={currentGame}
            selectedGame={selectedGame}
            roster={roster}
            rosterLoading={rosterLoading}
            rosterError={rosterError}
            handleDownloadRoster={handleDownloadRoster}
            setOpenPlanGame={setOpenPlanGame}
            opponentPlannedBlock={opponentPlannedBlock}
            handleStartGame={handleStartGame}
            handleCancelGame={handleCancelGame}
            readyLoading={readyLoading}
            readyState={readyState}
            lastReadyGameId={lastReadyGameId}
            currentUserId={warband?.players?.id}
            handleApproveResult={handleApproveResult}
            handleRejectResult={handleRejectResult}
          />
        </div>
      </div>
      <PlanGameDialog
        open={openPlanGame}
        onClose={()=>setOpenPlanGame(false)}
        warband={warband}
        selectedGame={selectedGame}
        onGamePlanned={() => {
          setLoading(true);
          fetch(`/api/battle?warband_id=${warband.id}`)
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
        }}
      />
      <Dialog open={cancelDialogOpen} onClose={()=>setCancelDialogOpen(false)}>
        <DialogTitle>Скасувати гру?</DialogTitle>
        <DialogContent>
          <Typography>Ви дійсно хочете скасувати цю гру? Цю дію не можна буде повернути.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setCancelDialogOpen(false)}>Залишити гру</Button>
          <Button color="error" variant="contained" onClick={confirmCancelGame}>Скасувати гру</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={<Box sx={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><CircularProgress /></Box>}>
      <BattlePageContent />
    </Suspense>
  );
}
