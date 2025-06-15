"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Alert, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Select, MenuItem, FormControl, InputLabel, Tooltip, Box, TableSortLabel } from "@mui/material";
import adminStyles from '../admin.module.css';
import FACTION_AVATARS from '../../../../factionAvatars';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

export const dynamic = "force-dynamic";

interface WarbandRow {
  id: number;
  name: string | null;
  status: string;
  player: { id: number; login: string; name: string | null; avatar_url?: string | null };
  players?: { id: number; login: string; name: string | null; avatar_url?: string | null };
  catalogue_name?: string | null;
  rosters: { 
    id: number; 
    file_url: string | null; 
    ducats?: number | null; 
    game_number?: number;
    model_count?: number;
    glory_points?: number;
  }[];
  total_vp?: number;
  total_games?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  win_rate?: number;
}

export default function CampaignWarbandsAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [warbands, setWarbands] = useState<WarbandRow[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, warbandId: number|null}>({open: false, warbandId: null});  const [selectedRosterId, setSelectedRosterId] = useState<{[key: number]: string | null}>({});
  const [deleteRosterDialog, setDeleteRosterDialog] = useState<{open: boolean, warband?: WarbandRow, roster?: any}>({open: false});
  const [replaceError, setReplaceError] = useState<string>("");
  const [replaceSuccessDialog, setReplaceSuccessDialog] = useState(false);  const [sortBy, setSortBy] = useState<'player' | 'warband' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  useEffect(() => {
    const checkAdminAndLoadWarbands = async () => {
      try {
        // Check admin status
        const res = await fetch(`/api/me?campaignId=${campaignId}`);
        const data = await res.json();
        if (data.user && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          return;
        }

        // Load warbands
        const warbandsRes = await fetch(`/api/campaigns/${campaignId}/admin/warbands`);
        if (!warbandsRes.ok) {
          let msg = `Помилка завантаження (код ${warbandsRes.status})`;
          try {
            const err = await warbandsRes.json();
            if (err && err.error) msg += `: ${err.error}`;
          } catch {}
          setError(msg);
          setLoading(false);
          return;
        }        const warbandsData = await warbandsRes.json();
        const warbandList = warbandsData.warbands || [];
        
        // Initialize selectedRosterId with the latest roster for each warband immediately
        const initialSelectedRosters: {[key: number]: string | null} = {};
        warbandList.forEach((wb: WarbandRow) => {
          if (wb.rosters && wb.rosters.length > 0) {
            // Sort by game_number in descending order (highest game number first)
            const sortedRosters = [...wb.rosters].sort((a, b) => {
              const gameNumberA = typeof a.game_number === 'number' ? a.game_number : 0;
              const gameNumberB = typeof b.game_number === 'number' ? b.game_number : 0;
              return gameNumberB - gameNumberA;
            });
            
            // Get the latest roster ID
            const latestRoster = sortedRosters[0];
            const rosterId = latestRoster.file_url ? 
              latestRoster.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
              String(latestRoster.id);
            
            initialSelectedRosters[wb.id] = rosterId;
          }
        });
        
        setSelectedRosterId(initialSelectedRosters);
        setWarbands(warbandList);
      } catch (e: any) {
        setError("Не вдалося завантажити дані: " + (e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoadWarbands();  }, [campaignId]);
  const handleDeactivate = async (id: number) => {
    await fetch(`/api/campaigns/${campaignId}/warbands/${id}/deactivate`, { method: "POST" });
    setWarbands(wb => wb.map(w => w.id === id ? { ...w, status: "deleted" } : w));
  };
  const handleSort = (column: 'player' | 'warband' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  const sortedWarbands = [...warbands].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aValue = '';
    let bValue = '';
    
    if (sortBy === 'player') {
      aValue = (a.player?.name || a.player?.login || a.players?.name || a.players?.login || '').toLowerCase();
      bValue = (b.player?.name || b.player?.login || b.players?.name || b.players?.login || '').toLowerCase();
    } else if (sortBy === 'warband') {
      aValue = (a.name || '').toLowerCase();
      bValue = (b.name || '').toLowerCase();
    } else if (sortBy === 'status') {
      aValue = a.status.toLowerCase();
      bValue = b.status.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleDelete = async (id: number) => {
    setDeleteDialog({open: false, warbandId: null});
    await fetch(`/api/campaigns/${campaignId}/warbands/${id}/delete`, { method: "POST" });
    setWarbands(wb => wb.filter(w => w.id !== id));
  };

  const handleDownload = (rosterId: number) => {
    window.open(`/api/roster?roster_id=${rosterId}`, "_blank");
  };

  // Функція для emoji-статусу
  function warbandStatusIcon(status: string) {
    if (status === 'active') return '🟢';
    if (status === 'checking') return '👁️';
    if (status === 'needs_update') return '⚠️';
    if (status === 'deleted') return '💀';
    return '';
  }  // Helper function to get the latest roster based on game_number
  const getLatestRosterId = (rosters: any[]) => {
    if (!rosters || rosters.length === 0) return null;
    
    // Sort by game_number in descending order (highest game number first)
    const sortedRosters = [...rosters].sort((a, b) => {
      const gameNumberA = typeof a.game_number === 'number' ? a.game_number : 0;
      const gameNumberB = typeof b.game_number === 'number' ? b.game_number : 0;
      return gameNumberB - gameNumberA; // Descending order
    });
    
    // For roster with file_url, use that
    if (sortedRosters[0].file_url) {
      return sortedRosters[0].file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '');
    }
    // For roster without file_url, use id as string
    return String(sortedRosters[0].id);
  };
  if (loading) return (
    <div className={adminStyles.adminContainer}>
        <div className={adminStyles.loadingCenterBox}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!isAdmin) return <Alert severity="error">Доступ лише для адміністратора.</Alert>;
  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h5" sx={{mb:2}}>Керування загонами кампанії</Typography>
        {replaceError && (
          <Alert severity="error" sx={{ mb: 2 }}>{replaceError}</Alert>
        )}
        {warbands.length === 0 ? (
          <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              У кампанії поки що немає загонів
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Коли гравці створять свої загони, вони з'являться тут
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'player'}
                      direction={sortBy === 'player' ? sortOrder : 'asc'}
                      onClick={() => handleSort('player')}
                    >
                      Гравець
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'warband'}
                      direction={sortBy === 'warband' ? sortOrder : 'asc'}
                      onClick={() => handleSort('warband')}
                    >
                      Варбанда
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'status'}
                      direction={sortBy === 'status' ? sortOrder : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Статус
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Ростери</TableCell>
                  <TableCell>Оповідання</TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>              <TableBody>
                {sortedWarbands.map((w, idx) => (
                <TableRow key={w.id}>                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* Try to use player field first, then fall back to players */}
                      {(w.player || w.players) && (
                        <img 
                          src={(w.player?.avatar_url || w.players?.avatar_url) ? 
                            `/api/avatar/${w.player?.avatar_url || w.players?.avatar_url}` : 
                            '/api/avatar/default'} 
                          alt="avatar" 
                          style={{width:32, height:32, borderRadius:'50%', marginRight: '4px'}} 
                        />
                      )}
                      <span>
                        {w.player ? (w.player.name || w.player.login) : 
                         w.players ? (w.players.name || w.players.login) : '—'}
                      </span>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {w.catalogue_name && FACTION_AVATARS[w.catalogue_name] ? (
                        <Tooltip title={w.catalogue_name} arrow>
                          <img
                            src={FACTION_AVATARS[w.catalogue_name]}
                            alt={w.catalogue_name || ''}
                            style={{width:32, height:32, borderRadius:'50%', objectFit:'cover', marginRight: '4px'}}
                          />
                        </Tooltip>
                      ) : null}
                      <span>{w.name}</span>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={w.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await fetch(`/api/campaigns/${campaignId}/warbands/${w.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: newStatus })
                        });
                        setWarbands((prev) => prev.map((wb, i) => i === idx ? { ...wb, status: newStatus } : wb));
                      }}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="active">Активна</MenuItem>
                      <MenuItem value="checking">На перевірці</MenuItem>
                      <MenuItem value="needs_update">Потребує оновлення ростеру</MenuItem>
                      <MenuItem value="deleted">Видалена</MenuItem>
                    </Select>
                    <span style={{ marginLeft: 8, fontSize: '1.2em' }}>
                      {warbandStatusIcon(w.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id={`roster-select-label-${w.id}`}>Ростери</InputLabel>
                        <Select
                          labelId={`roster-select-label-${w.id}`}
                          value={selectedRosterId[w.id] || ''}
                          label="Ростери"
                          onChange={(e) => {
                            setSelectedRosterId((prev) => ({ ...prev, [w.id]: e.target.value }));
                          }}
                          // Make sure the value is initialized properly on mount and on open
                          onOpen={() => {
                            if (!selectedRosterId[w.id] && w.rosters?.length > 0) {
                              const latestId = getLatestRosterId(w.rosters);
                              if (latestId) {
                                setSelectedRosterId((prev) => ({ ...prev, [w.id]: latestId }));
                              }
                            }                          }}
                          displayEmpty
                          disabled={!w.rosters || w.rosters.length === 0}
                          size="small"
                          sx={{ minWidth: 220 }}
                        >{w.rosters && w.rosters.map((r, i) => {
                            // Calculate the value consistently
                            const itemValue = r.file_url ? 
                              r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
                              String(r.id);
                            
                            return (
                              <MenuItem key={r.id} value={itemValue} dense>
                                {typeof r.game_number === 'number' ? `Гра: ${r.game_number}` : i+1}
                                {' '}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, marginLeft: 4 }}>
                                  <span role="img" aria-label="models">🧍</span>
                                  <span>{typeof r.model_count === 'number' ? r.model_count : '?'}</span>
                                  <span role="img" aria-label="ducats" style={{ marginLeft: 4 }}>💰</span>
                                  <span>{typeof r.ducats === 'number' ? r.ducats : '?'}</span>
                                  <span role="img" aria-label="glory" style={{ marginLeft: 4 }}>⭐</span>
                                  <span>{typeof r.glory_points === 'number' ? r.glory_points : '0'}</span>
                                </span>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      <Tooltip title="Завантажити ростер" arrow>
                        <span>
                          <Button                            
                            color="primary"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}
                            disabled={!selectedRosterId[w.id]}onClick={() => {
                              // Only use the roster ID from the select
                              const selectedId = selectedRosterId[w.id];
                              if (!selectedId) {
                                // If nothing selected, do nothing
                                return;
                              }
                              
                              // Find the roster that matches this ID
                              const selectedRoster = w.rosters.find(r => {
                                const rosterValue = r.file_url ? 
                                  r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
                                  String(r.id);
                                return rosterValue === selectedId;
                              });
                              
                              // Only proceed if we found a matching roster
                              if (selectedRoster) {
                                window.open(`/api/roster?roster_id=${selectedRoster.id}`, '_blank');
                              }
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <rect x="4" y="18" width="16" height="2" rx="1" fill="#1976d2"/>
                            </svg>
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Замінити ростер" arrow>
                        <span>
                          <Button                            
                            color="secondary"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}
                            disabled={!selectedRosterId[w.id]}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.json,application/json';                              input.onchange = async (e: any) => {
                                setReplaceError(""); // Clear previous error
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                // Only use the roster ID from the select
                                const selectedId = selectedRosterId[w.id];
                                if (!selectedId) {
                                  // If nothing selected, do nothing
                                  setReplaceError("Спочатку виберіть ростер для заміни");
                                  return;
                                }
                                
                                // Find the roster that matches this ID
                                const selectedRoster = w.rosters.find(r => {
                                  const rosterValue = r.file_url ? 
                                    r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
                                    String(r.id);
                                  return rosterValue === selectedId;
                                });
                                
                                // Only proceed if we found a matching roster
                                if (!selectedRoster) {
                                  setReplaceError("Не вдалося знайти вибраний ростер");
                                  return;
                                }
                                
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch(`/api/campaigns/${campaignId}/rosters/${selectedRoster.id}/replace`, {
                                  method: 'POST',
                                  body: formData
                                });
                                if (res.ok) {
                                  setReplaceSuccessDialog(true);
                                  setReplaceError("");
                                } else {
                                  let msg = 'Не вдалося замінити ростер';
                                  try {
                                    const err = await res.json();
                                    if (err && err.userMessage) msg = err.userMessage;
                                  } catch {}
                                  setReplaceError(msg);
                                }
                              };
                              input.click();
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="#ffa726" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <rect x="4" y="18" width="16" height="2" rx="1" fill="#ffa726"/>
                              <rect x="8" y="2" width="8" height="2" rx="1" fill="#ffa726"/>
                            </svg>
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Видалити ростер" arrow>
                        <span>
                          <Button                            
                            color="error"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}                            disabled={!selectedRosterId[w.id]}                            onClick={() => {
                              // Only use the roster ID from the select
                              const selectedId = selectedRosterId[w.id];
                              if (!selectedId) {
                                // If nothing selected, do nothing
                                return;
                              }
                              
                              // Find the roster that matches this ID
                              const selectedRoster = w.rosters.find(r => {
                                const rosterValue = r.file_url ? 
                                  r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
                                  String(r.id);
                                return rosterValue === selectedId;
                              });
                              
                              // Only proceed if we found a matching roster
                              if (selectedRoster) {
                                setDeleteRosterDialog({ open: true, warband: w, roster: selectedRoster });
                              }
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 6l12 12M6 18L18 6" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button  color="primary" onClick={() => router.push(`/campaign/${campaignId}/admin/warbands/stories?id=${w.id}`)}>
                      Оповідання
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Видалити" arrow>
                      <span>
                        <IconButton color="error" size="small" onClick={()=>setDeleteDialog({open:true, warbandId:w.id})}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>          </Table>
        </TableContainer>
        )}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={() => router.push(`/campaign/${campaignId}/admin`)}
            sx={{ marginRight: '10px' }}
          >
            Назад
          </Button>
        </div>
        
        <Dialog open={deleteDialog.open} onClose={()=>setDeleteDialog({open:false,warbandId:null})}>
          <DialogTitle>Підтвердіть видалення</DialogTitle>
          <DialogContent>
            <DialogContentText>Видалити цю варбанду разом з усіма її ростерами та файлами? Це незворотньо.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDeleteDialog({open:false,warbandId:null})} color="inherit" >Скасувати</Button>
            <Button color="error" variant="contained" onClick={()=>handleDelete(deleteDialog.warbandId!)}>Видалити</Button>
          </DialogActions>
        </Dialog>
        
        {/* Діалог видалення ростера */}
        <Dialog open={deleteRosterDialog.open} onClose={()=>setDeleteRosterDialog({open:false})}>          <DialogTitle>
            Підтвердіть видалення ростера {deleteRosterDialog.roster && typeof deleteRosterDialog.roster.game_number === 'number' ? `(Гра: ${deleteRosterDialog.roster.game_number})` : ''}
          </DialogTitle>
          <DialogContent>            <DialogContentText>
              Ви дійсно хочете видалити ростер <b>{deleteRosterDialog.roster && typeof deleteRosterDialog.roster.game_number === 'number' ? `Гра: ${deleteRosterDialog.roster.game_number}` : (deleteRosterDialog.roster ? deleteRosterDialog.roster.id : '?')}</b> варбанди <b>{deleteRosterDialog.warband?.name}</b>?
              {deleteRosterDialog.warband?.rosters?.length === 1 && (
                <><br/><br/><strong>Увага:</strong> Це останній ростер цієї варбанди. Після видалення ростера варбанда також буде видалена.</>
              )}
              <br/><br/>Це незворотньо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDeleteRosterDialog({open:false})} color="inherit" >Скасувати</Button>            <Button color="error" variant="contained" onClick={async()=>{
              if (!deleteRosterDialog.roster?.id) return;
              await fetch(`/api/campaigns/${campaignId}/rosters/${deleteRosterDialog.roster.id}/delete`, { method: 'POST' });
              
              // Check if this was the last roster for the warband
              const warband = deleteRosterDialog.warband;
              if (warband && warband.rosters.length === 1) {
                // This was the last roster, delete the entire warband from DB
                await fetch(`/api/campaigns/${campaignId}/warbands/${warband.id}/delete`, { method: 'POST' });
                
                // Remove the entire warband from state
                setWarbands(wb => wb.filter(w => w.id !== warband.id));
                
                // Clear selected roster for this warband
                setSelectedRosterId(prev => {
                  const updated = { ...prev };
                  delete updated[warband.id];
                  return updated;
                });
              } else {
                // Update warbands state by removing just the roster
                setWarbands(wb => {
                  return wb.map(w => {
                    if (w.id === deleteRosterDialog.warband?.id) {
                      const updatedRosters = w.rosters.filter(r => r.id !== deleteRosterDialog.roster.id);
                      return { ...w, rosters: updatedRosters };
                    }
                    return w;
                  });
                });
              }
              
              setDeleteRosterDialog({open:false});
            }}>Видалити</Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={replaceSuccessDialog} onClose={()=>{
          setReplaceSuccessDialog(false);
          router.refresh();
        }}>
          <DialogTitle>Ростер замінено</DialogTitle>
          <DialogContent>
            <DialogContentText>Ростер успішно замінено. Натисніть OK для оновлення сторінки.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              window.location.reload();
            }} autoFocus>OK</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
