"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Alert, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Select, MenuItem, FormControl, InputLabel, Tooltip } from "@mui/material";
import adminStyles from '../admin.module.css';
import FACTION_AVATARS from '../../factionAvatars';

interface WarbandRow {
  id: number;
  name: string | null;
  status: string;
  player: { id: number; login: string; name: string | null; avatar_url?: string | null };
  catalogue_name?: string | null;
  rosters: { id: number; file_url: string | null; ducats?: number | null }[];
}

export default function AdminWarbands() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [warbands, setWarbands] = useState<WarbandRow[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, warbandId: number|null}>({open: false, warbandId: null});
  const [selectedRosterId, setSelectedRosterId] = useState<{[key: number]: number | null}>({});
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
        }
        const wbData = await wbRes.json();
        setWarbands(wbData.warbands || []);
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

  const handleDownload = (url: string) => {
    // Логіка для скачування файлу за URL
    window.open(url, "_blank");
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
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Гравець</TableCell>
                <TableCell></TableCell>
                <TableCell>Варбанда</TableCell>
                <TableCell>Фракція</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Ростери</TableCell>
                <TableCell>Оповідання</TableCell>
                <TableCell>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warbands.map((w, idx) => (
                <TableRow key={w.id}>
                  <TableCell>{w.player.name || w.player.login}</TableCell>
                  <TableCell>
                    {w.player.avatar_url && (
                      <img src={'/' + w.player.avatar_url} alt="avatar" style={{width:32,height:32,borderRadius:'50%'}} />
                    )}
                  </TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>
                    {w.catalogue_name && FACTION_AVATARS[w.catalogue_name] ? (
                      <Tooltip title={w.catalogue_name} arrow>
                        <img
                          src={FACTION_AVATARS[w.catalogue_name]}
                          alt={w.catalogue_name || ''}
                          style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}}
                        />
                      </Tooltip>
                    ) : null}
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
                      <MenuItem value="deleted">Видалена</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id={`roster-select-label-${w.id}`}>Ростери</InputLabel>
                      <Select
                        labelId={`roster-select-label-${w.id}`}
                        value={selectedRosterId[w.id] || (w.rosters?.[0]?.id || '')}
                        label="Ростери"
                        onChange={(e) => {
                          setSelectedRosterId((prev) => ({ ...prev, [w.id]: e.target.value }));
                          const roster = w.rosters?.find(r => r.id === Number(e.target.value));
                          if (roster?.file_url) window.open(roster.file_url, "_blank");
                        }}
                        disabled={!w.rosters || w.rosters.length === 0}
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        {w.rosters && w.rosters.map((r, i) => (
                          <MenuItem key={r.id} value={r.id} dense>
                            Ростер {i+1} ({typeof r.ducats === 'number' ? r.ducats : '?'} дукатів)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => router.push(`/admin/warbands/stories?id=${w.id}`)}>
                      Оповідання
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button color="error" variant="outlined" onClick={()=>setDeleteDialog({open:true, warbandId:w.id})}>Видалити</Button>
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
            <Button onClick={()=>setDeleteDialog({open:false,warbandId:null})}>Скасувати</Button>
            <Button color="error" onClick={()=>handleDelete(deleteDialog.warbandId!)}>Видалити</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
