"use client";

// Таблиця результатів Trench Crusade
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import styles from '../../../page.module.css';
import FACTION_AVATARS from '../../../factionAvatars';
import GameResultView from '../../../components/GameResultView';

interface GameCell {
  id: number;
  number: number;
  status: string;
  opponent: string;
  vp: number;
  gp: number;
  opponent_vp: number;
  opponent_gp: number;
}

interface Warband {
  id: number;
  name: string;
  status: string;
  players: { id: number; name: string; avatar_url?: string };
  games?: GameCell[];
  catalogue_name?: string;
  total_vp?: number;
}

const statusMap: Record<string, string> = {
  active: 'Активна',
  checking: 'На перевірці',
  deleted: 'Видалена',
};

const gameStatusMap: Record<string, string> = {
  planned: 'Запланована',
  active: 'Триває',
  pending_approval: 'Очікує підтвердження',
  finished: 'Завершена',
  cancelled: 'Скасована',
};

export const dynamic = "force-dynamic";

export default function TablePage() {
  const [warbands, setWarbands] = useState<Warband[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByVP, setSortByVP] = useState(true); // true за замовчуванням
  const [gameViewOpen, setGameViewOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameLoading, setGameLoading] = useState(false);
  const params = useParams();
  const campaignId = params.id as string;useEffect(() => {
    if (!campaignId) return;
    
    fetch(`/api/campaigns/${campaignId}/warbands`)
      .then(res => res.json())
      .then(data => {
        console.log('API response:', data);
        setWarbands(Array.isArray(data.warbands) ? data.warbands : []);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);
  const sortedWarbands = sortByVP
    ? [...warbands].sort((a, b) => (b.total_vp || 0) - (a.total_vp || 0))
    : warbands;

  // Handle clicking on a finished game cell
  const handleGameClick = async (gameId: number) => {
    if (!gameId) return;
    
    setGameLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/games/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedGame(data.game);
        setGameViewOpen(true);
      } else {
        console.error('Failed to fetch game data');
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setGameLoading(false);
    }
  };

  const handleCloseGameView = () => {
    setGameViewOpen(false);
    setSelectedGame(null);
  };
  // Create render functions to avoid JSX whitespace issues
  const renderGameCells = (w: Warband) => {
    return Array.from({ length: 12 }).map((_, i) => {
      const games = w.games?.filter((g) => g.number === i + 1) || [];
      if (games.length > 0) {
        return (
          <TableCell key={i}>
            {games.map((game) => (
              <div 
                key={game.id} 
                style={{
                  fontSize: 12, 
                  marginBottom: games.length > 1 ? 8 : 0,
                  cursor: game.status === 'finished' ? 'pointer' : 'default',
                  padding: '4px',
                  borderRadius: '4px',
                  border: game.status === 'finished' ? '1px solid transparent' : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (game.status === 'finished') {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#ddd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (game.status === 'finished') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
                onClick={() => {
                  if (game.status === 'finished') {
                    handleGameClick(game.id);
                  }
                }}
                title={game.status === 'finished' ? 'Натисніть, щоб переглянути результат гри' : ''}
              >                <div style={{fontWeight: 500, color: '#666', marginBottom: 2}}>
                  {gameStatusMap[game.status] || game.status}
                </div>
                <b>vs {game.opponent}</b><br/>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                  <Tooltip title="Переможні бали (VP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <StarIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {game.vp}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Typography variant="caption">/</Typography>
                  <Tooltip title="Переможні бали (VP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <StarIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {game.opponent_vp}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Tooltip title="Слава (GP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <MilitaryTechIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {game.gp}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Typography variant="caption">/</Typography>
                  <Tooltip title="Слава (GP)" arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <MilitaryTechIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {game.opponent_gp}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </div>
            ))}
          </TableCell>
        );
      }
      return <TableCell key={i}></TableCell>;
    });
  };
  const renderTableRow = (w: Warband) => {
    return (
      <TableRow key={w.id}>
        <TableCell sx={{ padding: '6px 8px !important' }}>{w.name}</TableCell>
        <TableCell sx={{ padding: '6px 8px !important', textAlign: 'center' }}>
          {w.catalogue_name && FACTION_AVATARS[w.catalogue_name] ? (
            <Tooltip title={w.catalogue_name} arrow>
              <img
                src={FACTION_AVATARS[w.catalogue_name]}
                alt={w.catalogue_name}
                style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}}
              />
            </Tooltip>
          ) : null}
        </TableCell>
        <TableCell sx={{ padding: '6px 8px !important' }}>{w.players?.name || ''}</TableCell>
        <TableCell sx={{ padding: '6px 8px !important', textAlign: 'center' }}>
          {w.players?.avatar_url ? (
            <Avatar src={`/api/avatar/${w.players.avatar_url}`} alt={w.players.name} sx={{ width: 32, height: 32 }} />
          ) : (
            <Avatar src="/api/avatar/default" alt={w.players?.name} sx={{ width: 32, height: 32 }} />
          )}
        </TableCell>
        <TableCell style={{ fontWeight: 700 }}>{w.total_vp ?? 0}</TableCell>
        {renderGameCells(w)}
      </TableRow>
    );
  };

  const renderGameHeaders = () => {
    return Array.from({ length: 12 }).map((_, i) => (
      <TableCell key={i}>Гра {i + 1}</TableCell>
    ));
  };  return (
    <div className="consistentBackgroundContainer">
      <Box sx={{ maxWidth: '100vw', overflowX: 'auto', mt: 4, p: 2, width: '100%' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Таблиця результатів
        </Typography>        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          (warbands.length === 0 || warbands.every(w => !w.games || w.games.length === 0)) ? (
            <Typography variant="h6" align="center" sx={{ mt: 4, mb: 4, fontWeight: 600, color: 'secondary.main' }}>
              Жодна битва ще не сколихнула окопи цієї кампанії.<br/>
              Воїни чекають на перший заклик до бою...
            </Typography>
          ) : (            <TableContainer component={Paper}>
              <Table size="small" sx={{
                '& .MuiTableCell-root': {
                  '&:nth-of-type(-n+4)': {
                    padding: '6px 8px', // Reduced padding for first 4 columns
                    maxWidth: 'fit-content',
                  },
                  '&:nth-of-type(1)': { // Warband column
                    minWidth: '120px',
                    maxWidth: '150px',
                  },
                  '&:nth-of-type(2)': { // Faction column
                    minWidth: '60px',
                    maxWidth: '80px',
                    textAlign: 'center',
                  },
                  '&:nth-of-type(3)': { // Player column
                    minWidth: '100px',
                    maxWidth: '120px',
                  },
                  '&:nth-of-type(4)': { // Avatar column
                    minWidth: '60px',
                    maxWidth: '80px',
                    textAlign: 'center',
                  },
                }
              }}>                <TableHead>
                  <TableRow>
                    <TableCell sx={{ padding: '6px 8px !important', fontWeight: 'bold' }}>Warband</TableCell>
                    <TableCell sx={{ padding: '6px 8px !important', fontWeight: 'bold', textAlign: 'center' }}>Фракція</TableCell>
                    <TableCell sx={{ padding: '6px 8px !important', fontWeight: 'bold' }}>Гравець</TableCell>
                    <TableCell sx={{ padding: '6px 8px !important', fontWeight: 'bold', textAlign: 'center' }}>Аватар</TableCell>
                    <TableCell
                      style={{ cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => setSortByVP((v) => !v)}
                      title="Сортувати за сумою VP"
                    >
                      Сума VP {sortByVP ? '▼' : ''}
                    </TableCell>
                    {renderGameHeaders()}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedWarbands.map(renderTableRow)}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>

      {/* Game Result View Dialog */}
      <GameResultView
        open={gameViewOpen}
        onClose={handleCloseGameView}
        game={selectedGame}
        mode="view"
      />

      {/* Loading dialog for fetching game data */}
      {gameLoading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 9999
        }}>
          <CircularProgress />
        </Box>
      )}
    </div>
  );
}
