"use client";
import { useEffect, useState } from "react";
import { Button, Avatar, Typography, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemAvatar, ListItemText, Paper, Box, Chip, CircularProgress, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import FACTION_AVATARS from '../factionAvatars';
import Slider from '@mui/material/Slider';

export default function PlayersPage() {    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notesDialog, setNotesDialog] = useState<{ open: boolean, notes: string, player: string }>({ open: false, notes: '', player: '' });
    const [statusFilter, setStatusFilter] = useState<string>('all');
    // Track slider value per warband (by warband id)
    const [sliderValue, setSliderValue] = useState<{ [warbandId: number]: number }>({});

    useEffect(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => {
                setPlayers(data.players || []);
                // Set default slider value for each warband to last roster
                const sliderDefaults: { [warbandId: number]: number } = {};
                (data.players || []).forEach((player: any) => {
                    (player.warbands || []).forEach((wb: any) => {
                        if (wb.rosters && wb.rosters.length > 0) {
                            sliderDefaults[wb.id] = wb.rosters.length - 1;
                        }
                    });
                });
                setSliderValue(sliderDefaults);
            })
            .finally(() => setLoading(false));    }, []);

    // Filter players and warbands based on selected status
    const filteredPlayers = players.filter(player => {
        if (statusFilter === 'all') return true;
        // Show player only if they have at least one warband with the selected status
        return player.warbands?.some((wb: any) => wb.status === statusFilter);
    }).map(player => ({
        ...player,
        warbands: statusFilter === 'all' 
            ? player.warbands 
            : player.warbands?.filter((wb: any) => wb.status === statusFilter) || []
    }));

if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;

return (
    <Box sx={{ maxWidth: 900, margin: '32px auto', padding: 2 }}>        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Гравці кампанії</Typography>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', padding: '8px', borderRadius: '8px' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Статус варбанди</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Статус варбанди"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="all">Усі статуси</MenuItem>
                        <MenuItem value="active">Активна</MenuItem>
                        <MenuItem value="checking">На перевірці</MenuItem>
                        <MenuItem value="needs_update">Потребує оновлення ростеру</MenuItem>
                        <MenuItem value="deleted">Видалена</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </Box><List>
            {filteredPlayers.map(player => (
                <Paper key={player.id} sx={{ mb: 3, p: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          src={player.avatar_url ? `/api/avatar/${player.avatar_url}` : '/api/avatar/default'} 
                          sx={{ width: 56, height: 56 }} 
                        />
                        <Box>
                            <Typography variant="h6">{player.name || player.login}</Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<InfoIcon />}
                                sx={{ mt: 1, mb: 1 }}
                                onClick={() => setNotesDialog({ open: true, notes: player.notes || '', player: player.name || player.login })}
                                disabled={!player.notes}
                            >
                                Переглянути нотатки
                            </Button>
                        </Box>
                    </Box>
                    {player.warbands && player.warbands.length > 0 && (
                        <Box sx={{ mt: 2, ml: 7 }}>
                            {player.warbands.map((wb: any) => {
                                const rosterCount = wb.rosters?.length || 0;
                                const value = sliderValue[wb.id] ?? 0;
                                const marks = (wb.rosters || []).map((r: any, idx: number) => ({
                                    value: idx,
                                    label: r.game_number ? `Гра: ${r.game_number}` : `${idx + 1}`
                                }));
                                const rosterToShow = wb.rosters && wb.rosters.length > 0 ? wb.rosters[value] : null;
                                return (
                                    <Paper key={wb.id} sx={{ mb: 2, p: 2, background: '#f7f7fa' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {wb.catalogue_name && FACTION_AVATARS[wb.catalogue_name] && (
                                                <Tooltip title={wb.catalogue_name} arrow>
                                                    <Avatar src={FACTION_AVATARS[wb.catalogue_name]} sx={{ width: 32, height: 32 }} />
                                                </Tooltip>
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{wb.name}</Typography>
                                            {(() => {
                                                let statusIcon: React.ReactNode = null;
                                                let statusColor: string = 'action';
                                                let statusTitle = '';
                                                if (wb.status === 'active') {
                                                    statusIcon = <span style={{ fontSize: '1.2em' }} role="img" aria-label="Готова">🟢</span>;
                                                    statusColor = 'success.main';
                                                    statusTitle = 'Активна';
                                                } else if (wb.status === 'checking') {
                                                    statusIcon = <span style={{ fontSize: '1.2em' }} role="img" aria-label="На перевірці">👁️</span>;
                                                    statusColor = 'warning.main';
                                                    statusTitle = 'На перевірці';
                                                } else if (wb.status === 'needs_update') {
                                                    statusIcon = <span style={{ fontSize: '1.2em' }} role="img" aria-label="Потребує оновлення">⚠️</span>;
                                                    statusColor = 'warning.dark';
                                                    statusTitle = 'Потребує оновлення ростеру';
                                                } else {
                                                    statusIcon = <span style={{ fontSize: '1.2em' }} role="img" aria-label="Видалена">💀</span>;
                                                    statusColor = 'text.disabled';
                                                    statusTitle = 'Видалена';
                                                }
                                                return (
                                                    <Tooltip title={statusTitle} arrow placement="top">
                                                        <span style={{ fontWeight: 500, cursor: 'help', marginLeft: 8, color: `var(--mui-palette-${statusColor.replace('.', '-')})`, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            {statusIcon}
                                                            <span style={{ fontSize: 13 }}>{statusTitle}</span>
                                                        </span>
                                                    </Tooltip>
                                                );
                                            })()}
                                        </Box>
                                        {wb.rosters && wb.rosters.length > 0 && (
                                            <Box sx={{ mt: 2, ml: 5 }}>
                                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Ростер:</Typography>
                                                {rosterCount > 1 && (
                                                    <Slider
                                                        min={0}
                                                        max={rosterCount - 1}
                                                        step={1}
                                                        value={value}
                                                        marks={marks}
                                                        onChange={(_, v) => setSliderValue(s => ({ ...s, [wb.id]: v as number }))}
                                                        sx={{ maxWidth: Math.max(200, rosterCount * 40), mb: 2 }}
                                                    />
                                                )}
                                                {rosterToShow && (
                                                    <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, minWidth: 180 }}>
                                                        <Tooltip title="Кількість моделей" arrow>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span role="img" aria-label="models">🧍</span>
                                                                <b>{rosterToShow.model_count}</b>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Дукати" arrow>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span role="img" aria-label="ducats">💰</span>
                                                                <b>{rosterToShow.ducats}</b>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Glory Points" arrow>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span role="img" aria-label="glory">⭐</span>
                                                                <b>{rosterToShow.glory_points}</b>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Завантажити ростер" arrow>
                                                            <IconButton size="small" color="primary" onClick={() => window.open(`/api/roster?roster_id=${rosterToShow.id}`, '_blank')}>
                                                                <DownloadIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Paper>
                                                )}
                                            </Box>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            ))}
        </List>
        <Dialog open={notesDialog.open} onClose={() => setNotesDialog({ open: false, notes: '', player: '' })}>
            <DialogTitle>Нотатки гравця: {notesDialog.player}</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{notesDialog.notes}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setNotesDialog({ open: false, notes: '', player: '' })}>Закрити</Button>
            </DialogActions>
        </Dialog>
    </Box>
);
}
