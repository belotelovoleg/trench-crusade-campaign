import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Avatar, Tooltip, Checkbox, FormControlLabel, IconButton, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import FACTION_AVATARS from '../factionAvatars';
import AddIcon from '@mui/icons-material/Add';

interface GameResultsDialogProps {
  open: boolean;
  onClose: () => void;
  game: any;
  onResultsSaved: () => void;
  readOnly?: boolean;
  confirmMode?: 'approve'|null;
  adminViewOnly?: boolean;
  adminEditMode?: boolean;
}

const GameResultsDialog: React.FC<GameResultsDialogProps> = ({ open, onClose, game, onResultsSaved, readOnly = false, confirmMode = null, adminViewOnly = false, adminEditMode = false }) => {
  const [vp1, setVp1] = useState(game.vp_1 || 0);
  const [vp2, setVp2] = useState(game.vp_2 || 0);
  const [gp1, setGp1] = useState(game.gp_1 || 0);
  const [gp2, setGp2] = useState(game.gp_2 || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [reinforce1, setReinforce1] = useState(game.player1_calledReinforcements || false);
  const [reinforce2, setReinforce2] = useState(game.player2_calledReinforcements || false);
  const [injuries1, setInjuries1] = useState<Array<{name:string,roll:string}>>(game.player1_injuries || []);
  const [injuries2, setInjuries2] = useState<Array<{name:string,roll:string}>>(game.player2_injuries || []);
  const [inj1Name, setInj1Name] = useState('');
  const [inj1Roll, setInj1Roll] = useState('');
  const [inj2Name, setInj2Name] = useState('');
  const [inj2Roll, setInj2Roll] = useState('');
  const [skills1, setSkills1] = useState<Array<{name:string,roll:number}>>(Array.isArray(game.player1_skillAdvancements) ? game.player1_skillAdvancements : []);
  const [skills2, setSkills2] = useState<Array<{name:string,roll:number}>>(Array.isArray(game.player2_skillAdvancements) ? game.player2_skillAdvancements : []);
  const [sk1Name, setSk1Name] = useState('');
  const [sk1Roll, setSk1Roll] = useState('');
  const [sk2Name, setSk2Name] = useState('');
  const [sk2Roll, setSk2Roll] = useState('');
  const [explore1, setExplore1] = useState(game.player1_explorationDice || '');
  const [explore2, setExplore2] = useState(game.player2_explorationDice || '');
  const [adminStatus, setAdminStatus] = useState(game.status || 'planned');

  const player1 = game.warbands_games_warband_1_idTowarbands?.players;
  const player2 = game.warbands_games_warband_2_idTowarbands?.players;
  const warband1 = game.warbands_games_warband_1_idTowarbands;
  const warband2 = game.warbands_games_warband_2_idTowarbands;

  async function handleSave() {
    setSaving(true);
    setError(null);
    // Додаємо не збережені injury/skill якщо поля не порожні
    const injuries1Full = inj1Name && inj1Roll !== '' ? [...injuries1, { name: inj1Name, roll: inj1Roll }] : injuries1;
    const injuries2Full = inj2Name && inj2Roll !== '' ? [...injuries2, { name: inj2Name, roll: inj2Roll }] : injuries2;
    const skills1Full = sk1Name && sk1Roll !== '' ? [...skills1, { name: sk1Name, roll: Number(sk1Roll) }] : skills1;
    const skills2Full = sk2Name && sk2Roll !== '' ? [...skills2, { name: sk2Name, roll: Number(sk2Roll) }] : skills2;
    try {
      const res = await fetch('/api/battle/plan/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.id,
          vp_1: Number(vp1),
          vp_2: Number(vp2),
          gp_1: Number(gp1),
          gp_2: Number(gp2),
          player1_calledReinforcements: reinforce1,
          player2_calledReinforcements: reinforce2,
          player1_injuries: injuries1Full,
          player2_injuries: injuries2Full,
          player1_skillAdvancements: skills1Full,
          player2_skillAdvancements: skills2Full,
          player1_explorationDice: explore1 === '' ? null : Number(explore1),
          player2_explorationDice: explore2 === '' ? null : Number(explore2),
        })
      });
      if (!res.ok) {
        let msg = 'Не вдалося зберегти результати';
        try { const err = await res.json(); if (err && err.error) msg = err.error; } catch {}
        throw new Error(msg);
      }
      onClose();
      onResultsSaved();
    } catch (e: any) {
      setError(e.message || 'Не вдалося зберегти результати');
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/battle/plan/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, action: 'approve' })
      });
      if (!res.ok) throw new Error('Не вдалося підтвердити результат');
      onClose();
      onResultsSaved();
    } catch (e: any) {
      setError(e.message || 'Не вдалося підтвердити результат');
    } finally {
      setSaving(false);
    }
  }
  async function handleAdminSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: game.id,
          vp_1: Number(vp1),
          vp_2: Number(vp2),
          gp_1: Number(gp1),
          gp_2: Number(gp2),
          player1_calledReinforcements: reinforce1,
          player2_calledReinforcements: reinforce2,
          player1_injuries: injuries1,
          player2_injuries: injuries2,
          player1_skillAdvancements: skills1,
          player2_skillAdvancements: skills2,
          player1_explorationDice: explore1 === '' ? null : Number(explore1),
          player2_explorationDice: explore2 === '' ? null : Number(explore2),
          status: adminStatus,
        })
      });
      if (!res.ok) {
        let msg = 'Не вдалося зберегти результати';
        try { const err = await res.json(); if (err && err.error) msg = err.error; } catch {}
        throw new Error(msg);
      }
      onClose();
      onResultsSaved();
    } catch (e: any) {
      setError(e.message || 'Не вдалося зберегти результати');
    } finally {
      setSaving(false);
    }
  }

  // --- Skill Advancements: додавання ---
  const handleAddSkill1 = () => {
    if (sk1Name && sk1Roll !== '') {
      setSkills1(prev => [...prev, { name: sk1Name, roll: Number(sk1Roll) }]);
      setSk1Name('');
      setSk1Roll('');
    }
  };
  const handleAddSkill2 = () => {
    if (sk2Name && sk2Roll !== '') {
      setSkills2(prev => [...prev, { name: sk2Name, roll: Number(sk2Roll) }]);
      setSk2Name('');
      setSk2Roll('');
    }
  };

  // --- Injuries: додавання ---
  const handleAddInjury1 = () => {
    if (inj1Name && inj1Roll !== '') {
      setInjuries1(prev => [...prev, { name: inj1Name, roll: inj1Roll }]);
      setInj1Name('');
      setInj1Roll('');
    }
  };
  const handleAddInjury2 = () => {
    if (inj2Name && inj2Roll !== '') {
      setInjuries2(prev => [...prev, { name: inj2Name, roll: inj2Roll }]);
      setInj2Name('');
      setInj2Roll('');
    }
  };

  React.useEffect(() => {
    if (!open) return;
    setVp1(game.vp_1 ?? 0);
    setVp2(game.vp_2 ?? 0);
    setGp1(game.gp_1 ?? 0);
    setGp2(game.gp_2 ?? 0);
    setReinforce1(game.player1_calledReinforcements ?? false);
    setReinforce2(game.player2_calledReinforcements ?? false);
    setInjuries1(game.player1_injuries ?? []);
    setInjuries2(game.player2_injuries ?? []);
    setSkills1(Array.isArray(game.player1_skillAdvancements) ? game.player1_skillAdvancements : []);
    setSkills2(Array.isArray(game.player2_skillAdvancements) ? game.player2_skillAdvancements : []);
    setExplore1(game.player1_explorationDice ?? '');
    setExplore2(game.player2_explorationDice ?? '');
    setAdminStatus(game.status ?? 'planned');
  }, [game, open]);

  // Prevent showing action buttons after dialog is closed
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {adminViewOnly
          ? 'Результат гри (тільки перегляд, адмін)'
          : (adminEditMode)
            ? 'Редагування результату гри (адмін)'
            : (readOnly && confirmMode === 'approve')
              ? 'Підтвердження результату гри'
              : (readOnly)
                ? 'Перегляд результату гри'
                : 'Редагування результату гри'}
      </DialogTitle>
      <DialogContent>
        {(adminEditMode) && (
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }} size="small">
            <InputLabel id="admin-status-label">Статус гри</InputLabel>
            <Select
              labelId="admin-status-label"
              value={adminStatus}
              label="Статус гри"
              onChange={e => setAdminStatus(e.target.value)}
            >
              <MenuItem value="planned">Запланована</MenuItem>
              <MenuItem value="active">Активна</MenuItem>
              <MenuItem value="pending_approval">Очікує підтвердження</MenuItem>
              <MenuItem value="finished">Завершена</MenuItem>
              <MenuItem value="cancelled">Скасована</MenuItem>
            </Select>
          </FormControl>
        )}
        <Box sx={{display:'flex',gap:2,mb:2}}>
          <Box sx={{flex:1}}>
            <Typography variant="subtitle2">Гравець 1</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
              <Tooltip title={player1?.name || player1?.login || ''} arrow>
                <Avatar src={player1?.avatar_url ? `/api/avatar/${player1.avatar_url}` : undefined} />
              </Tooltip>
              <span>{player1?.name || player1?.login}</span>
            </Box>
            <Typography variant="subtitle2">Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
              {warband1?.catalogue_name && FACTION_AVATARS[warband1.catalogue_name] && (
                <Tooltip title={warband1.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband1.catalogue_name]} alt={warband1.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband1?.name}</span>
            </Box>
            {readOnly ? (
              <>
                <Typography sx={{mb:1}}>VP 1: <b>{vp1}</b></Typography>
                <Typography>GP 1: <b>{gp1}</b></Typography>
                <Typography>Reinforcements: <b>{game.player1_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
                <Typography sx={{mt:1}}>Injuries:</Typography>
                {(game.player1_injuries||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player1_injuries||[]).map((inj:any,i:number)=>(<li key={i}>{inj.name}: {inj.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Skill Advancements:</Typography>
                {(game.player1_skillAdvancements||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player1_skillAdvancements||[]).map((sk:any,i:number)=>(<li key={i}>{sk.name}: {sk.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Exploration Dice: <b>{game.player1_explorationDice ?? '-'}</b></Typography>
              </>
            ) : (
              <>
                <TextField label="VP 1" type="number" value={vp1} onChange={e=>setVp1(e.target.value)} fullWidth sx={{mb:1}} />
                <TextField label="GP 1" type="number" value={gp1} onChange={e=>setGp1(e.target.value)} fullWidth />
                <FormControlLabel control={<Checkbox checked={reinforce1} onChange={e=>setReinforce1(e.target.checked)} />} label="Викликав Reinforcements" sx={{mt:1}} />
                <Typography sx={{mt:1}}>Injuries:</Typography>
                {(injuries1.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {injuries1.map((inj,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <TextField size="small" value={inj.name} label="Ім'я" onChange={e=>{
                      const arr = [...injuries1]; arr[i].name = e.target.value; setInjuries1(arr);
                    }} />
                    <TextField size="small" type="number" value={inj.roll} label="Кидок" onChange={e=>{
                      const arr = [...injuries1]; arr[i].roll = e.target.value; setInjuries1(arr);
                    }} />
                    <IconButton color="error" onClick={()=>{const arr = injuries1.filter((_,idx)=>idx!==i); setInjuries1(arr);}} title="Видалити рядок"><span style={{fontWeight:'bold'}}>&times;</span></IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <TextField size="small" value={inj1Name} label="Ім'я" onChange={e=>setInj1Name(e.target.value)} />
                  <TextField size="small" type="number" value={inj1Roll} label="Кидок" onChange={e=>setInj1Roll(e.target.value)} />
                  <IconButton color="primary" onClick={handleAddInjury1} disabled={!(inj1Name&&inj1Roll)}><AddIcon /></IconButton>
                </Box>
                <Typography sx={{mt:1}}>Skill Advancements:</Typography>
                {(skills1.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {skills1.map((sk,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <TextField size="small" value={sk.name} label="Ім'я" onChange={e=>{
                      const arr = [...skills1]; arr[i].name = e.target.value; setSkills1(arr);
                    }} />
                    <TextField size="small" type="number" value={sk.roll} label="Кидок" onChange={e=>{
                      const arr = [...skills1]; arr[i].roll = Number(e.target.value); setSkills1(arr);
                    }} />
                    <IconButton color="error" onClick={()=>{const arr = skills1.filter((_,idx)=>idx!==i); setSkills1(arr);}} title="Видалити рядок"><span style={{fontWeight:'bold'}}>&times;</span></IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <TextField size="small" value={sk1Name} label="Ім'я" onChange={e=>setSk1Name(e.target.value)} />
                  <TextField size="small" type="number" value={sk1Roll} label="Кидок" onChange={e=>setSk1Roll(e.target.value)} />
                  <IconButton color="primary" onClick={handleAddSkill1} disabled={!(sk1Name&&sk1Roll)}><AddIcon /></IconButton>
                </Box>
                <TextField label="Exploration Dice" type="number" value={explore1} onChange={e=>setExplore1(e.target.value)} fullWidth sx={{mb:1}} />
              </>
            )}
          </Box>
          <Box sx={{flex:1}}>
            <Typography variant="subtitle2">Гравець 2</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
              <Tooltip title={player2?.name || player2?.login || ''} arrow>
                <Avatar src={player2?.avatar_url ? `/api/avatar/${player2.avatar_url}` : undefined} />
              </Tooltip>
              <span>{player2?.name || player2?.login}</span>
            </Box>
            <Typography variant="subtitle2">Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
              {warband2?.catalogue_name && FACTION_AVATARS[warband2.catalogue_name] && (
                <Tooltip title={warband2.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband2.catalogue_name]} alt={warband2.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband2?.name}</span>
            </Box>
            {readOnly ? (
              <>
                <Typography sx={{mb:1}}>VP 2: <b>{vp2}</b></Typography>
                <Typography>GP 2: <b>{gp2}</b></Typography>
                <Typography>Reinforcements: <b>{game.player2_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
                <Typography sx={{mt:1}}>Injuries:</Typography>
                {(game.player2_injuries||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player2_injuries||[]).map((inj:any,i:number)=>(<li key={i}>{inj.name}: {inj.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Skill Advancements:</Typography>
                {(game.player2_skillAdvancements||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player2_skillAdvancements||[]).map((sk:any,i:number)=>(<li key={i}>{sk.name}: {sk.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Exploration Dice: <b>{game.player2_explorationDice ?? '-'}</b></Typography>
              </>
            ) : (
              <>
                <TextField label="VP 2" type="number" value={vp2} onChange={e=>setVp2(e.target.value)} fullWidth sx={{mb:1}} />
                <TextField label="GP 2" type="number" value={gp2} onChange={e=>setGp2(e.target.value)} fullWidth />
                <FormControlLabel control={<Checkbox checked={reinforce2} onChange={e=>setReinforce2(e.target.checked)} />} label="Викликав Reinforcements" sx={{mt:1}} />
                <Typography sx={{mt:1}}>Injuries:</Typography>
                {(injuries2.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {injuries2.map((inj,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <TextField size="small" value={inj.name} label="Ім'я" onChange={e=>{
                      const arr = [...injuries2]; arr[i].name = e.target.value; setInjuries2(arr);
                    }} />
                    <TextField size="small" type="number" value={inj.roll} label="Кидок" onChange={e=>{
                      const arr = [...injuries2]; arr[i].roll = e.target.value; setInjuries2(arr);
                    }} />
                    <IconButton color="error" onClick={()=>{const arr = injuries2.filter((_,idx)=>idx!==i); setInjuries2(arr);}} title="Видалити рядок"><span style={{fontWeight:'bold'}}>&times;</span></IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <TextField size="small" value={inj2Name} label="Ім'я" onChange={e=>setInj2Name(e.target.value)} />
                  <TextField size="small" type="number" value={inj2Roll} label="Кидок" onChange={e=>setInj2Roll(e.target.value)} />
                  <IconButton color="primary" onClick={handleAddInjury2} disabled={!(inj2Name&&inj2Roll)}><AddIcon /></IconButton>
                </Box>
                <Typography sx={{mt:1}}>Skill Advancements:</Typography>
                {(skills2.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {skills2.map((sk,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <TextField size="small" value={sk.name} label="Ім'я" onChange={e=>{
                      const arr = [...skills2]; arr[i].name = e.target.value; setSkills2(arr);
                    }} />
                    <TextField size="small" type="number" value={sk.roll} label="Кидок" onChange={e=>{
                      const arr = [...skills2]; arr[i].roll = Number(e.target.value); setSkills2(arr);
                    }} />
                    <IconButton color="error" onClick={()=>{const arr = skills2.filter((_,idx)=>idx!==i); setSkills2(arr);}} title="Видалити рядок"><span style={{fontWeight:'bold'}}>&times;</span></IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <TextField size="small" value={sk2Name} label="Ім'я" onChange={e=>setSk2Name(e.target.value)} />
                  <TextField size="small" type="number" value={sk2Roll} label="Кидок" onChange={e=>setSk2Roll(e.target.value)} />
                  <IconButton color="primary" onClick={handleAddSkill2} disabled={!(sk2Name&&sk2Roll)}><AddIcon /></IconButton>
                </Box>
                <TextField label="Exploration Dice" type="number" value={explore2} onChange={e=>setExplore2(e.target.value)} fullWidth sx={{mb:1}} />
              </>
            )}
          </Box>
        </Box>
        {error && <Typography color="error" sx={{mb:1}}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрити</Button>
        {!adminViewOnly && (readOnly ? (
          <>
            <Button onClick={handleApprove} variant="contained" color="success" disabled={saving}>Підтвердити</Button>
          </>
        ) : (
          <Button onClick={adminEditMode ? handleAdminSave : handleSave} variant="contained" disabled={saving}>
            {adminEditMode ? 'Зберегти (адмін)' : 'Зберегти'}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default GameResultsDialog;
