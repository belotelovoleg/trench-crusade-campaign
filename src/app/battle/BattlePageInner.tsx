"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress, Button, Avatar, Slider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import styles from '../page.module.css';
import PlanGameDialog from './PlanGameDialog';
import FACTION_AVATARS from '../factionAvatars';
import BattleGameBlock from './BattleGameBlock';

export default function BattlePageInner() {
  const searchParams = useSearchParams();
  const [faction, setFaction] = useState('');
  const [enemyFaction, setEnemyFaction] = useState('');
  const [tactic, setTactic] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warband, setWarband] = useState('');
  const [selectedGame, setSelectedGame] = useState<number>(1);

  useEffect(() => {
    const params = searchParams?.get('params');
    if (params) {
      const { faction, enemyFaction, tactic } = JSON.parse(decodeURIComponent(params));
      setFaction(faction);
      setEnemyFaction(enemyFaction);
      setTactic(tactic);
    }
  }, [searchParams]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePlanGame = async () => {
    setLoading(true);
    setError('');
    try {
      // Your existing logic for handling game planning
    } catch (err) {
      setError('An error occurred while planning the game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h4" gutterBottom>
        Battle Page
      </Typography>
      <Paper elevation={3} className={styles.paper}>
        <Typography variant="h6">Your Faction: {faction}</Typography>
        <Typography variant="h6">Enemy Faction: {enemyFaction}</Typography>
        <Typography variant="h6">Tactic: {tactic}</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Plan Game
        </Button>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
      </Paper>
      <PlanGameDialog 
        open={open} 
        onClose={handleClose} 
        onGamePlanned={handlePlanGame} 
        warband={warband} 
        selectedGame={selectedGame} 
      />
      <BattleGameBlock
        currentGame={null}
        selectedGame={selectedGame}
        roster={null}
        rosterLoading={false}
        rosterError={null}
        handleDownloadRoster={() => {}}
        setOpenPlanGame={() => {}}
        opponentPlannedBlock={null}
        handleStartGame={() => {}}
        handleCancelGame={() => {}}
        readyLoading={false}
        readyState={"none"}
        lastReadyGameId={null}
        currentUserId={undefined}
        handleApproveResult={() => {}}
        handleRejectResult={() => {}}
      />
    </Box>
  );
}
