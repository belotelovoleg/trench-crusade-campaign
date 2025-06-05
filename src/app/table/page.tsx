"use client";

// Таблиця результатів Trench Crusade
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import styles from '../page.module.css';
import FACTION_AVATARS from '../factionAvatars';

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
  player: { id: number; name: string; avatar_url?: string };
  games?: GameCell[];
  catalogue_name?: string;
  total_vp?: number;
}

const statusMap: Record<string, string> = {
  active: 'Активна',
  checking: 'На перевірці',
  deleted: 'Видалена',
};

export const dynamic = "force-dynamic";

export default function TablePage() {
  const [warbands, setWarbands] = useState<Warband[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByVP, setSortByVP] = useState(true); // true за замовчуванням

  useEffect(() => {
    fetch('/api/table/warbands')
      .then(res => res.json())
      .then(data => setWarbands(Array.isArray(data.warbands) ? data.warbands : []))
      .finally(() => setLoading(false));
  }, []);

  const sortedWarbands = sortByVP
    ? [...warbands].sort((a, b) => (b.total_vp || 0) - (a.total_vp || 0))
    : warbands;

  return (
    <div className={styles.container}>
      <Box sx={{ maxWidth: '100vw', overflowX: 'auto', mt: 4, p: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Таблиця результатів
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          (warbands.length === 0 || warbands.every(w => !w.games || w.games.length === 0)) ? (
            <Typography variant="h6" align="center" sx={{ mt: 4, mb: 4, fontWeight: 600, color: 'secondary.main' }}>
              Жодна битва ще не сколихнула окопи цієї кампанії.<br/>
              Воїни чекають на перший заклик до бою...
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Warband</TableCell>
                    <TableCell>Фракція</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Гравець</TableCell>
                    <TableCell>Аватар</TableCell>
                    <TableCell
                      style={{ cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => setSortByVP((v) => !v)}
                      title="Сортувати за сумою VP"
                    >
                      Сума VP {sortByVP ? '▼' : ''}
                    </TableCell>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <TableCell key={i}>Гра {i + 1}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedWarbands.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{w.name}</TableCell>
                      <TableCell>
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
                      <TableCell>{statusMap[w.status] || w.status}</TableCell>
                      <TableCell>{w.player?.name || ''}</TableCell>
                      <TableCell>
                        {w.player?.avatar_url ? (
                          <Avatar src={w.player.avatar_url.startsWith('/') ? w.player.avatar_url : '/' + w.player.avatar_url} alt={w.player.name} />
                        ) : null}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700 }}>{w.total_vp ?? 0}</TableCell>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const games = w.games?.filter((g) => g.number === i + 1) || [];
                        if (games.length > 0) {
                          return (
                            <TableCell key={i}>
                              {games.map((game, idx) => (
                                <div key={game.id} style={{fontSize:12, marginBottom: games.length > 1 ? 8 : 0}}>
                                  <b>vs {game.opponent}</b><br/>
                                  VP: <b>{game.vp}</b> / <b>{game.opponent_vp}</b><br/>
                                  GP: <b>{game.gp}</b> / <b>{game.opponent_gp}</b>
                                </div>
                              ))}
                            </TableCell>
                          );
                        }
                        return <TableCell key={i}></TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>
    </div>
  );
}
