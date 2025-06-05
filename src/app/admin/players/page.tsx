"use client";
export const dynamic = "force-dynamic";
import { Typography, Box } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/Delete';
import adminStyles from "../admin.module.css";

interface Player {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_base64: string | null;
  notes: string | null;
  is_admin: boolean;
  is_active: boolean;
  idt?: string | null;
  udt?: string | null;
  ldt?: string | null;
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null; name?: string | null }>({ open: false, id: null });

  // --- Сортування ---
  const [orderBy, setOrderBy] = useState<'id'|'login'|'name'|'email'|'idt'|'udt'|'ldt'>('idt');
  const [order, setOrder] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/players");
        if (!res.ok) throw new Error("Помилка завантаження");
        const data = await res.json();
        setPlayers(data.players);
      } catch (e: any) {
        setError(e.message || "Помилка");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Сортування масиву гравців
  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = a[orderBy] ?? '';
    let bVal = b[orderBy] ?? '';
    // Для дат — перетворити на число
    if (["idt","udt","ldt"].includes(orderBy)) {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEdit = (p: Player) => {
    setEditPlayer({ ...p });
    setEditDialogOpen(true);
  };
  const handleEditSave = async () => {
    if (!editPlayer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPlayer),
      });
      if (!res.ok) throw new Error("Помилка збереження");
      const data = await res.json();
      setPlayers((players) =>
        players.map((p) => (p.id === data.player.id ? data.player : p))
      );
      setEditDialogOpen(false);
    } catch (e: any) {
      alert(e.message || "Помилка");
    } finally {
      setSaving(false);
    }
  };
  const handleActiveToggle = async (p: Player) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, is_active: !p.is_active }),
      });
      if (!res.ok) throw new Error("Помилка");
      const data = await res.json();
      setPlayers((players) =>
        players.map((pl) => (pl.id === data.player.id ? data.player : pl))
      );
    } catch (e: any) {
      alert(e.message || "Помилка");
    } finally {
      setSaving(false);
    }
  };
  const handlePasswordChange = async () => {
    if (!passwordDialog.id || newPassword.length < 4) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: passwordDialog.id, password: newPassword }),
      });
      if (!res.ok) throw new Error("Помилка зміни пароля");
      setPasswordDialog({ open: false, id: null });
      setNewPassword("");
      alert("Пароль змінено");
    } catch (e: any) {
      alert(e.message || "Помилка");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteDialog.id }),
      });
      if (!res.ok) throw new Error('Помилка видалення');
      setPlayers(players => players.filter(p => p.id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null });
    } catch (e: any) {
      alert(e.message || 'Помилка');
    } finally {
      setSaving(false);
    }
  };

  // --- handler для кліку по заголовку ---
  function handleSort(field: typeof orderBy) {
    if (orderBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setOrderBy(field);
      setOrder(field === 'idt' ? 'desc' : 'asc'); // idt за замовчуванням desc
    }
  }

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Керування гравцями
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('id')} style={{cursor:'pointer'}}>ID{orderBy==='id' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell onClick={() => handleSort('login')} style={{cursor:'pointer'}}>Логін{orderBy==='login' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell onClick={() => handleSort('name')} style={{cursor:'pointer'}}>Ім'я{orderBy==='name' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell onClick={() => handleSort('email')} style={{cursor:'pointer'}}>Email{orderBy==='email' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell>Адмін</TableCell>
                <TableCell>Активний</TableCell>
                <TableCell onClick={() => handleSort('idt')} style={{cursor:'pointer'}}>Реєстрація{orderBy==='idt' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell onClick={() => handleSort('udt')} style={{cursor:'pointer'}}>Оновлено{orderBy==='udt' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell onClick={() => handleSort('ldt')} style={{cursor:'pointer'}}>Останній вхід{orderBy==='ldt' ? (order==='asc'?' ▲':' ▼') : ''}</TableCell>
                <TableCell>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.login}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.is_admin ? "Так" : "Ні"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_active}
                      onChange={() => handleActiveToggle(p)}
                      disabled={saving}
                    />
                  </TableCell>
                  <TableCell>{p.idt ? new Date(p.idt).toLocaleString() : ''}</TableCell>
                  <TableCell>{p.udt ? new Date(p.udt).toLocaleString() : ''}</TableCell>
                  <TableCell>{p.ldt ? new Date(p.ldt).toLocaleString() : ''}</TableCell>
                  <TableCell>
                    <Tooltip title="Редагувати" arrow>
                      <span>
                        <IconButton size="small" onClick={() => handleEdit(p)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Змінити пароль" arrow>
                      <span>
                        <IconButton size="small" onClick={() => setPasswordDialog({ open: true, id: p.id })}>
                          <VpnKeyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Видалити" arrow>
                      <span>
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: p.id, name: p.name || p.login })} disabled={saving}>
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
        {/* Діалог редагування */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
        >
          <DialogTitle>Редагувати гравця</DialogTitle>
          <DialogContent>
            {editPlayer && (
              <>
                <TextField
                  label="Ім'я"
                  value={editPlayer.name || ""}
                  onChange={(e) =>
                    setEditPlayer({ ...editPlayer, name: e.target.value })
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Email"
                  value={editPlayer.email || ""}
                  onChange={(e) =>
                    setEditPlayer({ ...editPlayer, email: e.target.value })
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Notes"
                  value={editPlayer.notes || ""}
                  onChange={(e) =>
                    setEditPlayer({ ...editPlayer, notes: e.target.value })
                  }
                  fullWidth
                  margin="normal"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editPlayer.is_admin}
                      onChange={(e) =>
                        setEditPlayer({
                          ...editPlayer,
                          is_admin: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Адмін"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editPlayer.is_active}
                      onChange={(e) =>
                        setEditPlayer({
                          ...editPlayer,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Активний"
                />
                {/* Аватар можна додати окремо */}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit" variant="outlined">
              Скасувати
            </Button>
            <Button onClick={handleEditSave} disabled={saving} color="primary" variant="contained">
              Зберегти
            </Button>
          </DialogActions>
        </Dialog>
        {/* Діалог зміни пароля */}
        <Dialog
          open={passwordDialog.open}
          onClose={() => setPasswordDialog({ open: false, id: null })}
        >
          <DialogTitle>Змінити пароль</DialogTitle>
          <DialogContent>
            <TextField
              label="Новий пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog({ open: false, id: null })} color="inherit" variant="outlined">
              Скасувати
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={saving || newPassword.length < 4}
              color="primary"
              variant="contained"
            >
              Зберегти
            </Button>
          </DialogActions>
        </Dialog>
        {/* Діалог підтвердження видалення */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
          <DialogTitle>Видалити гравця?</DialogTitle>
          <DialogContent>
            Ви впевнені, що хочете видалити гравця <b>{deleteDialog.name}</b>? Цю дію не можна скасувати.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, id: null })} color="inherit" variant="outlined">
              Скасувати
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
              Видалити
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
