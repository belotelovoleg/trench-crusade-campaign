"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import adminStyles from '../admin.module.css';
import GameResultView from '../../../../components/GameResultView';
import GameResultEdit from '../../../../components/GameResultEdit';
import Image from 'next/image';
import FACTION_AVATARS from '../../../../factionAvatars';

export const dynamic = "force-dynamic";

interface Game {
  id: number;
  idt: string;
  status: string;
  vp_1: number;
  vp_2: number;
  gp_1: number;
  gp_2: number;
  result_1?: string;
  result_2?: string;
  exp_gained_1?: number;
  exp_gained_2?: number;
  ducats_gained_1?: number;
  ducats_gained_2?: number;
  glory_gained_1?: number;
  glory_gained_2?: number;
  injuries_1?: string;
  injuries_2?: string;
  skills_1?: string;
  skills_2?: string;
  promotion_1?: string;
  promotion_2?: string;
  warbands_games_warband_1_idTowarbands: {
    id: number;
    name: string;
    catalogue_name?: string; // Faction name
    players: {
      name: string;
      login: string;
    };
  };
  warbands_games_warband_2_idTowarbands: {
    id: number;
    name: string;
    catalogue_name?: string; // Faction name
    players: {
      name: string;
      login: string;
    };
  };
}

export default function CampaignGamesAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  useEffect(() => {
    const checkAdminAndLoadGames = async () => {
      try {
        // Check admin status
        const res = await fetch(`/api/me?campaignId=${campaignId}`);
        const data = await res.json();
        if (data.user && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          return;        }

        // Load games for this campaign using the admin API
        const gamesRes = await fetch(`/api/campaigns/${campaignId}/admin/games`);
        const gamesData = await gamesRes.json();
        
        if (gamesData.games) {
          setGames(gamesData.games);
        }
      } catch (err) {
        console.error('Error loading games:', err);
        setError("Не вдалося завантажити дані.");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoadGames();
  }, [campaignId]);
  const handleViewGame = (game: Game) => {
    setSelectedGame(game);
    setViewDialogOpen(true);
  };

  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setEditDialogOpen(true);
  };

  const handleDeleteGame = (game: Game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGame) return;
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/admin/games`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: selectedGame.id })
      });
      
      if (response.ok) {
        setGames(games.filter(g => g.id !== selectedGame.id));
        setDeleteDialogOpen(false);
        setSelectedGame(null);
      } else {
        console.error('Failed to delete game');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };
  const handleGameUpdate = () => {
    // Reload games after update
    window.location.reload();
  };

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!isAdmin) return <Alert severity="error">Доступ лише для адміністратора.</Alert>;

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox} style={{ maxWidth: '1200px' }}>
        <Typography variant="h4" gutterBottom>Керування іграми</Typography>
        
        {games.length === 0 ? (
          <Alert severity="info">Немає ігор у цій кампанії.</Alert>
        ) : (
          <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Загін 1</TableCell>
                  <TableCell>Загін 2</TableCell>
                  <TableCell align="center">Рахунок</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="center">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      {new Date(game.idt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Image
                          src={FACTION_AVATARS[game.warbands_games_warband_1_idTowarbands.catalogue_name || ''] || '/default_avatar.png'}
                          alt={game.warbands_games_warband_1_idTowarbands.catalogue_name || 'Faction'}
                          width={24}
                          height={24}
                          style={{ borderRadius: '50%' }}
                        />
                        <div>
                          <div>{game.warbands_games_warband_1_idTowarbands.name}</div>
                          <small style={{ color: '#666' }}>
                            {game.warbands_games_warband_1_idTowarbands.players.name || 
                             game.warbands_games_warband_1_idTowarbands.players.login}
                          </small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Image
                          src={FACTION_AVATARS[game.warbands_games_warband_2_idTowarbands.catalogue_name || ''] || '/default_avatar.png'}
                          alt={game.warbands_games_warband_2_idTowarbands.catalogue_name || 'Faction'}
                          width={24}
                          height={24}
                          style={{ borderRadius: '50%' }}
                        />
                        <div>
                          <div>{game.warbands_games_warband_2_idTowarbands.name}</div>
                          <small style={{ color: '#666' }}>
                            {game.warbands_games_warband_2_idTowarbands.players.name || 
                             game.warbands_games_warband_2_idTowarbands.players.login}
                          </small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <strong>{game.vp_1} - {game.vp_2}</strong>
                      <br />
                      <small style={{ color: '#666' }}>GP: {game.gp_1} - {game.gp_2}</small>
                    </TableCell>
                    <TableCell>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: game.status === 'approved' ? '#e8f5e8' : 
                                       game.status === 'submitted' ? '#fff3cd' : '#f8f9fa',
                        color: game.status === 'approved' ? '#2e7d32' : 
                               game.status === 'submitted' ? '#856404' : '#495057'
                      }}>
                        {game.status}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Переглянути">
                        <IconButton onClick={() => handleViewGame(game)} size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редагувати">
                        <IconButton onClick={() => handleEditGame(game)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Видалити">
                        <IconButton onClick={() => handleDeleteGame(game)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <button
          type="button"
          onClick={() => router.push(`/campaign/${campaignId}/admin`)}
          className={adminStyles.adminMenuItem}
        >
          Назад
        </button>
      </div>      {/* View Dialog */}
      {selectedGame && (
        <GameResultView
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setSelectedGame(null);
          }}
          game={selectedGame}
          mode="view"
        />
      )}

      {/* Edit Dialog */}
      {selectedGame && (
        <GameResultEdit
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedGame(null);
          }}
          game={selectedGame}
          onResultsSaved={handleGameUpdate}
          isAdmin={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Підтвердити видалення</DialogTitle>
        <DialogContent>
          Ви впевнені, що хочете видалити цю гру? Цю дію неможливо скасувати.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
