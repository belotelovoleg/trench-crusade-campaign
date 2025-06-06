'use client';

import React, { useEffect, useState } from 'react';
import adminStyles from '../admin.module.css';
import Image from 'next/image';
import FACTION_AVATARS from '../../factionAvatars';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import GameResultsDialog from '../../battle/GameResultsDialog';
import { CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

interface Player {
  id: number;
  name?: string;
  avatar_url?: string;
}

interface Warband {
  id: number;
  name?: string;
  catalogue_name?: string;
  players: Player;
}

interface Game {
  id: number;
  udt?: string;
  warbands_games_warband_1_idTowarbands: Warband;
  warbands_games_warband_2_idTowarbands: Warband;
  // ...other fields as needed
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'view'|'edit'|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/games')
      .then(res => res.json())
      .then(data => {
        setGames(data.games || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Помилка завантаження ігор');
        setLoading(false);
      });
  }, [refresh]);

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <h2>Адмін: Ігри</h2>
        {loading && <CircularProgress />}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2}>Гравець 1</TableCell>
                  <TableCell colSpan={2}>Варбанд 1</TableCell>
                  <TableCell colSpan={2}>Гравець 2</TableCell>
                  <TableCell colSpan={2}>Варбанд 2</TableCell>
                  <TableCell>UDT</TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {games.map(game => (
                  <TableRow key={game.id}>
                    <TableCell>
                      {game.warbands_games_warband_1_idTowarbands?.players?.avatar_url && (
                        <Image src={`/api/avatar/${game.warbands_games_warband_1_idTowarbands.players.avatar_url.replace(/^.*[\\/]/, '')}`} alt="avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
                      )}
                    </TableCell>
                    <TableCell style={{ minWidth: 120 }}>{game.warbands_games_warband_1_idTowarbands?.players?.name || '—'}</TableCell>
                    <TableCell>
                      {game.warbands_games_warband_1_idTowarbands?.catalogue_name && (
                        <Tooltip title={game.warbands_games_warband_1_idTowarbands.catalogue_name} arrow>
                          <span>
                            <Image src={FACTION_AVATARS[game.warbands_games_warband_1_idTowarbands.catalogue_name] || '/swords.png'} alt="faction" width={32} height={32} style={{ borderRadius: 4 }} />
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell style={{ minWidth: 120 }}>{game.warbands_games_warband_1_idTowarbands?.name || '—'}</TableCell>
                    <TableCell>
                      {game.warbands_games_warband_2_idTowarbands?.players?.avatar_url && (
                        <Image src={`/api/avatar/${game.warbands_games_warband_2_idTowarbands.players.avatar_url.replace(/^.*[\\/]/, '')}`} alt="avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
                      )}
                    </TableCell>
                    <TableCell style={{ minWidth: 120 }}>{game.warbands_games_warband_2_idTowarbands?.players?.name || '—'}</TableCell>
                    <TableCell>
                      {game.warbands_games_warband_2_idTowarbands?.catalogue_name && (
                        <Tooltip title={game.warbands_games_warband_2_idTowarbands.catalogue_name} arrow>
                          <span>
                            <Image src={FACTION_AVATARS[game.warbands_games_warband_2_idTowarbands.catalogue_name] || '/swords.png'} alt="faction" width={32} height={32} style={{ borderRadius: 4 }} />
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell style={{ minWidth: 120 }}>{game.warbands_games_warband_2_idTowarbands?.name || '—'}</TableCell>
                    <TableCell>{game.udt ? new Date(game.udt).toLocaleString('uk-UA') : '—'}</TableCell>
                    <TableCell>
                      <Tooltip title="Переглянути" arrow>
                        <span>
                          <IconButton size="small" onClick={() => { setSelectedGame(game); setDialogMode('view'); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Редагувати" arrow>
                        <span>
                          <IconButton size="small" onClick={() => { setSelectedGame(game); setDialogMode('edit'); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Видалити" arrow>
                        <span>
                          <IconButton size="small" color="error" onClick={() => setDeleteId(game.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Game Results Dialog */}
        <GameResultsDialog
          open={!!selectedGame && !!dialogMode}
          onClose={() => { setSelectedGame(null); setDialogMode(null); }}
          game={selectedGame || {}}
          onResultsSaved={() => { setSelectedGame(null); setDialogMode(null); setRefresh(r => r + 1); }}
          readOnly={dialogMode === 'view'}
          adminViewOnly={dialogMode === 'view'}
          adminEditMode={dialogMode === 'edit'}
        />
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
          <DialogTitle>Видалити гру?</DialogTitle>
          <DialogContent>Ви впевнені, що хочете видалити цю гру? Дія незворотна.</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>Скасувати</Button>
            <Button color="error" variant="contained" disabled={deleteLoading} onClick={async () => {
              setDeleteLoading(true);
              await fetch(`/api/admin/games?id=${deleteId}`, { method: 'DELETE' });
              setDeleteLoading(false);
              setDeleteId(null);
              setRefresh(r => r + 1);
            }}>Видалити</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
