"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Alert, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Select, MenuItem, FormControl, InputLabel, Tooltip, Box } from "@mui/material";
import adminStyles from '../admin.module.css';
import FACTION_AVATARS from '../../factionAvatars';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

interface WarbandRow {
  id: number;
  name: string | null;
  status: string;
  player: { id: number; login: string; name: string | null; avatar_url?: string | null };
  catalogue_name?: string | null;
  rosters: { 
    id: number; 
    file_url: string | null; 
    ducats?: number | null; 
    game_number?: number;
    model_count?: number;
    glory_points?: number;
  }[];
}

export const dynamic = "force-dynamic";

export default function AdminWarbands() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [warbands, setWarbands] = useState<WarbandRow[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, warbandId: number|null}>({open: false, warbandId: null});
  const [selectedRosterId, setSelectedRosterId] = useState<{[key: number]: string | null}>({});
  const [deleteRosterDialog, setDeleteRosterDialog] = useState<{open: boolean, warband?: WarbandRow, roster?: any}>({open: false});
  const [replaceError, setReplaceError] = useState<string>("");
  const [replaceSuccessDialog, setReplaceSuccessDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (!data.user || !data.user.is_admin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        // Завантажити всі варбанди
        const wbRes = await fetch("/api/admin/warbands");
        if (!wbRes.ok) {
          let msg = `Помилка завантаження (код ${wbRes.status})`;
          try {
            const err = await wbRes.json();
            if (err && err.error) msg += `: ${err.error}`;
          } catch {}
          setError(msg);
          setLoading(false);
          return;
        }        const wbData = await wbRes.json();
        const warbandList = wbData.warbands || [];
        
        // Initialize selectedRosterId with the latest roster for each warband
        const initialSelectedRosters: {[key: number]: string | null} = {};
        warbandList.forEach((wb: WarbandRow) => {
          if (wb.rosters && wb.rosters.length > 0) {
            initialSelectedRosters[wb.id] = getLatestRosterId(wb.rosters);
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
    checkAdminAndLoad();
  }, []);

  const handleDeactivate = async (id: number) => {
    await fetch(`/api/admin/warbands/${id}/deactivate`, { method: "POST" });
    setWarbands(wb => wb.map(w => w.id === id ? { ...w, status: "deleted" } : w));
  };

  const handleDelete = async (id: number) => {
    setDeleteDialog({open: false, warbandId: null});
    await fetch(`/api/admin/warbands/${id}/delete`, { method: "POST" });
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
  }

  // Helper function to get the latest roster based on game_number
  const getLatestRosterId = (rosters: any[]) => {
    if (!rosters || rosters.length === 0) return null;
    
    // Sort by game_number in descending order
    const sortedRosters = [...rosters].sort((a, b) => {
      const gameNumberA = typeof a.game_number === 'number' ? a.game_number : 0;
      const gameNumberB = typeof b.game_number === 'number' ? b.game_number : 0;
      return gameNumberB - gameNumberA; // Descending order
    });
    
    // Return the file_url of the latest roster
    return sortedRosters[0].file_url ? 
      sortedRosters[0].file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : 
      '';
  };

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!isAdmin) return <Alert severity="error">Доступ лише для адміністратора.</Alert>;

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h5" sx={{mb:2}}>Всі варбанди</Typography>
        {replaceError && (
          <Alert severity="error" sx={{ mb: 2 }}>{replaceError}</Alert>
        )}
        <TableContainer component={Paper}>
          <Table size="small">            <TableHead>
              <TableRow>
                <TableCell>Гравець</TableCell>
                <TableCell>Варбанда</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Ростери</TableCell>
                <TableCell>Оповідання</TableCell>
                <TableCell>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warbands.map((w, idx) => (                <TableRow key={w.id}>                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {w.player && (
                        <img 
                          src={w.player.avatar_url ? `/api/avatar/${w.player.avatar_url}` : '/api/avatar/default'} 
                          alt="avatar" 
                          style={{width:32, height:32, borderRadius:'50%', marginRight: '4px'}} 
                        />
                      )}
                      <span>{w.player ? (w.player.name || w.player.login) : '—'}</span>
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
                        await fetch(`/api/admin/warbands/${w.id}/status`, {
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
                  <TableCell>                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id={`roster-select-label-${w.id}`}>Ростери</InputLabel>
                        <Select
                          labelId={`roster-select-label-${w.id}`}
                          value={selectedRosterId[w.id] || getLatestRosterId(w.rosters)}
                          label="Ростери"
                          onChange={(e) => {
                            setSelectedRosterId((prev) => ({ ...prev, [w.id]: e.target.value }));                          }}
                          disabled={!w.rosters || w.rosters.length === 0}
                          size="small"
                          sx={{ minWidth: 220 }}
                        >{w.rosters && w.rosters.map((r, i) => (
                            <MenuItem key={r.id} value={r.file_url ? r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : ''} dense>
                              {typeof r.game_number === 'number' ? `Гра: ${r.game_number}` : i+1}
                              {' '}                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, marginLeft: 4 }}>
                                <span role="img" aria-label="models">🧍</span>
                                <span>{typeof r.model_count === 'number' ? r.model_count : '?'}</span>
                                <span role="img" aria-label="ducats" style={{ marginLeft: 4 }}>💰</span>
                                <span>{typeof r.ducats === 'number' ? r.ducats : '?'}</span>
                                <span role="img" aria-label="glory" style={{ marginLeft: 4 }}>⭐</span>
                                <span>{typeof r.glory_points === 'number' ? r.glory_points : '0'}</span>
                              </span>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tooltip title="Завантажити ростер" arrow>
                        <span>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}
                            disabled={!(w.rosters && w.rosters.length > 0 && (selectedRosterId[w.id] || w.rosters[0]?.id))}
                            onClick={() => {
                              // Знаходимо id ростера для завантаження
                              const selected = w.rosters.find(r => String(r.file_url ? r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : r.id) === String(selectedRosterId[w.id]));
                              const rosterId = selected ? selected.id : w.rosters[0]?.id;
                              if (rosterId) {
                                window.open(`/api/roster?roster_id=${rosterId}`, '_blank');
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
                            variant="outlined"
                            color="secondary"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}
                            disabled={!(w.rosters && w.rosters.length > 0 && (selectedRosterId[w.id] || w.rosters[0]?.id))}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.json,application/json';
                              input.onchange = async (e: any) => {
                                setReplaceError(""); // Clear previous error
                                const file = e.target.files[0];
                                if (!file) return;
                                const selected = w.rosters.find(r => String(r.file_url ? r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : r.id) === String(selectedRosterId[w.id]));
                                const roster = selected || w.rosters[0];
                                if (!roster) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch(`/api/admin/rosters/${roster.id}/replace`, {
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
                            variant="outlined"
                            color="error"
                            size="small"
                            sx={{ minWidth: 40, padding: '4px 8px' }}
                            disabled={!(w.rosters && w.rosters.length > 0 && (selectedRosterId[w.id] || w.rosters[0]?.id))}
                            onClick={() => {
                              const selected = w.rosters.find(r => String(r.file_url ? r.file_url.replace(/^\/rosters\//, '').replace(/\.json$/, '') : r.id) === String(selectedRosterId[w.id]));
                              const roster = selected || w.rosters[0];
                              if (roster) {
                                setDeleteRosterDialog({ open: true, warband: w, roster });
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
                    <Button variant="outlined" color="primary" onClick={() => router.push(`/admin/warbands/stories?id=${w.id}`)}>
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
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={deleteDialog.open} onClose={()=>setDeleteDialog({open:false,warbandId:null})}>
          <DialogTitle>Підтвердіть видалення</DialogTitle>
          <DialogContent>
            <DialogContentText>Видалити цю варбанду разом з усіма її ростерами та файлами? Це незворотньо.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDeleteDialog({open:false,warbandId:null})} color="inherit" variant="outlined">Скасувати</Button>
            <Button color="error" variant="contained" onClick={()=>handleDelete(deleteDialog.warbandId!)}>Видалити</Button>
          </DialogActions>
        </Dialog>
        {/* Діалог видалення ростера */}
        <Dialog open={deleteRosterDialog.open} onClose={()=>setDeleteRosterDialog({open:false})}>
          <DialogTitle>
            Підтвердіть видалення ростера {deleteRosterDialog.roster && typeof deleteRosterDialog.roster.game_number === 'number' ? `(Гра: ${deleteRosterDialog.roster.game_number})` : ''}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Ви дійсно хочете видалити ростер <b>{deleteRosterDialog.roster && typeof deleteRosterDialog.roster.game_number === 'number' ? `Гра: ${deleteRosterDialog.roster.game_number}` : (deleteRosterDialog.roster ? deleteRosterDialog.roster.id : '?')}</b> варбанди <b>{deleteRosterDialog.warband?.name}</b>? Це незворотньо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDeleteRosterDialog({open:false})} color="inherit" variant="outlined">Скасувати</Button>
            <Button color="error" variant="contained" onClick={async()=>{
              if (!deleteRosterDialog.roster?.id) return;
              await fetch(`/api/admin/rosters/${deleteRosterDialog.roster.id}/delete`, { method: 'POST' });
              setWarbands(wb => wb.map(w => w.id === deleteRosterDialog.warband?.id ? { ...w, rosters: w.rosters.filter(r => r.id !== deleteRosterDialog.roster.id) } : w));
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
