import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Avatar, Tooltip, Checkbox, FormControlLabel, IconButton, Select, MenuItem, InputLabel, FormControl, Accordion, AccordionSummary, AccordionDetails, Autocomplete, CircularProgress } from '@mui/material';
import FACTION_AVATARS from '../factionAvatars';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

interface GameResultEditProps {
  open: boolean;
  onClose: () => void;
  game: any;
  onResultsSaved: () => void;
  isAdmin?: boolean;
}

const GameResultEdit: React.FC<GameResultEditProps> = ({ 
  open, 
  onClose, 
  game, 
  onResultsSaved,
  isAdmin = false 
}) => {
  // Early returns before any hooks - this prevents hook order violations
  if (!open) return null;
  
  if (!game) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Помилка</DialogTitle>
        <DialogContent>
          <Typography>Дані гри не знайдено</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрити</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const [vp1, setVp1] = useState(game?.vp_1 || 0);
  const [vp2, setVp2] = useState(game?.vp_2 || 0);
  const [gp1, setGp1] = useState(game?.gp_1 || 0);
  const [gp2, setGp2] = useState(game?.gp_2 || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);  const [reinforce1, setReinforce1] = useState(game?.player1_calledReinforcements || false);
  const [reinforce2, setReinforce2] = useState(game?.player2_calledReinforcements || false);
  
  // Advanced features state
  const [injuries1, setInjuries1] = useState<Array<{name:string,roll:string}>>(game?.player1_injuries || []);
  const [injuries2, setInjuries2] = useState<Array<{name:string,roll:string}>>(game?.player2_injuries || []);
  const [inj1Name, setInj1Name] = useState('');
  const [inj1Roll, setInj1Roll] = useState('');
  const [inj2Name, setInj2Name] = useState('');
  const [inj2Roll, setInj2Roll] = useState('');
  const [skills1, setSkills1] = useState<Array<{name:string,roll:number}>>(Array.isArray(game?.player1_skillAdvancements) ? game.player1_skillAdvancements : []);
  const [skills2, setSkills2] = useState<Array<{name:string,roll:number}>>(Array.isArray(game?.player2_skillAdvancements) ? game.player2_skillAdvancements : []);
  const [sk1Name, setSk1Name] = useState('');
  const [sk1Roll, setSk1Roll] = useState('');
  const [sk2Name, setSk2Name] = useState('');
  const [sk2Roll, setSk2Roll] = useState('');
  const [elites1, setElites1] = useState<Array<{name:string}>>(Array.isArray(game?.player1_becomesElite) ? game.player1_becomesElite : []);
  const [elites2, setElites2] = useState<Array<{name:string}>>(Array.isArray(game?.player2_becomesElite) ? game.player2_becomesElite : []);
  const [elite1Name, setElite1Name] = useState('');
  const [elite2Name, setElite2Name] = useState('');
  const [explore1, setExplore1] = useState(game?.player1_explorationDice || '');
  const [explore2, setExplore2] = useState(game?.player2_explorationDice || '');
  const [adminStatus, setAdminStatus] = useState(game?.status || 'planned');
  // UI state for accordions
  const [expandedAccordions, setExpandedAccordions] = useState<{[key: string]: boolean}>({
    'injuries1': false,
    'skills1': false,
    'elites1': false,
    'injuries2': false,
    'skills2': false,
    'elites2': false,
  });
  const [modelNames1, setModelNames1] = useState<string[]>([]);
  const [modelNames2, setModelNames2] = useState<string[]>([]);

  const player1 = game.warbands_games_warband_1_idTowarbands?.players;
  const player2 = game.warbands_games_warband_2_idTowarbands?.players;
  const warband1 = game.warbands_games_warband_1_idTowarbands;
  const warband2 = game.warbands_games_warband_2_idTowarbands;

  // Handlers for adding injuries, skills, elites
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

  const handleAddElite1 = () => {
    if (elite1Name) {
      setElites1(prev => [...prev, { name: elite1Name }]);
      setElite1Name('');
    }
  };
    const handleAddElite2 = () => {
    if (elite2Name) {
      setElites2(prev => [...prev, { name: elite2Name }]);
      setElite2Name('');
    }
  };

  // Accordion state handlers
  const handleAccordionChange = (accordionId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [accordionId]: isExpanded
    }));
  };

  // Load roster data for autocomplete
  useEffect(() => {
    const loadRosterData = async () => {
      try {
        if (game.warband_1_roster_id) {
          const res1 = await fetch(`/api/roster?roster_id=${game.warband_1_roster_id}&format=json`);
          if (res1.ok) {
            const data = await res1.json();
            if (data.roster_data) {
              try {
                const names = extractModelNames(data.roster_data);
                setModelNames1(names);
              } catch (e) {
                console.error("Error extracting model names for player 1:", e);
              }
            }
          }
        }
        
        if (game.warband_2_roster_id) {
          const res2 = await fetch(`/api/roster?roster_id=${game.warband_2_roster_id}&format=json`);
          if (res2.ok) {
            const data = await res2.json();
            if (data.roster_data) {
              try {
                const names = extractModelNames(data.roster_data);
                setModelNames2(names);
              } catch (e) {
                console.error("Error extracting model names for player 2:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading roster data:", error);
      }
    };
    
    if (open) {
      loadRosterData();
    }
  }, [game.warband_1_roster_id, game.warband_2_roster_id, open]);// Function to extract model names from a roster JSON
  const extractModelNames = (roster: any) => {
    const modelNames: string[] = [];
    const nameCountMap: {[key: string]: number} = {};
    
    try {
      const forces = roster?.roster?.forces || [];
      
      forces.forEach((force: any) => {
        const selections = force.selections || [];
        
        selections.forEach((selection: any) => {
          if (selection.type === "model") {
            const name = selection.name;
            
            if (!nameCountMap[name]) {
              nameCountMap[name] = 1;
              modelNames.push(name);
            } else {
              nameCountMap[name]++;
              modelNames.push(`${name} (${nameCountMap[name]})`);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error parsing roster:", error);
    }
    
    return modelNames;
  };
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch('/api/campaigns/'+game.campaign_id+'/battles/plan/results', {
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
          player1_injuries: injuries1,
          player2_injuries: injuries2,
          player1_skillAdvancements: skills1,
          player2_skillAdvancements: skills2,
          player1_becomesElite: elites1,
          player2_becomesElite: elites2,
          player1_explorationDice: explore1 === '' ? null : Number(explore1),
          player2_explorationDice: explore2 === '' ? null : Number(explore2),
        })
      });
      
      if (!res.ok) {
        let msg = 'Не вдалося зберегти результати';
        try { 
          const err = await res.json(); 
          if (err && err.error) msg = err.error; 
        } catch {}
        throw new Error(msg);
      }
      
      onResultsSaved();
    } catch (err: any) {
      setError(err.message || 'Помилка збереження результатів');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/campaigns/${game.campaign_id}/admin/games`, {
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
          player1_becomesElite: elites1,
          player2_becomesElite: elites2,
          player1_explorationDice: explore1 === '' ? null : Number(explore1),
          player2_explorationDice: explore2 === '' ? null : Number(explore2),
          status: adminStatus,
        })
      });
      
      if (!res.ok) {
        throw new Error('Помилка збереження адміністратором');
      }
      
      onResultsSaved();
    } catch (err: any) {
      setError(err.message || 'Помилка збереження результатів');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 8
        }
      }}
    >      <DialogTitle sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        pb: 1.5,
        fontWeight: 'bold'
      }}>
        {isAdmin ? 'Редагування результату (адмін)' : 'Введення результату гри'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Admin status selector */}
        {isAdmin && (
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

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}        <Box sx={{ display: 'flex', gap: 3 }}>          {/* Player 1 */}
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>Гравець 1</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              <Tooltip title={player1?.name || player1?.login || ''} arrow>
                <Avatar src={player1?.avatar_url ? `/api/avatar/${player1.avatar_url}` : '/api/avatar/default'} />
              </Tooltip>
              <span>{player1?.name || player1?.login}</span>
            </Box>
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1.5, mb: 1 }}>Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              {warband1?.catalogue_name && FACTION_AVATARS[warband1.catalogue_name] && (
                <Tooltip title={warband1.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband1.catalogue_name]} alt={warband1.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband1?.name}</span>
            </Box>
            
            {/* Basic fields */}
            <TextField
              label="Переможні бали (VP)"
              type="number"
              value={vp1}
              onChange={e => setVp1(Number(e.target.value))}
              size="small"
              sx={{ mb: 1, width: '100%' }}
            />
            <TextField
              label="Слава (GP)"
              type="number"
              value={gp1}
              onChange={e => setGp1(Number(e.target.value))}
              size="small"
              sx={{ mb: 1, width: '100%' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reinforce1}
                  onChange={e => setReinforce1(e.target.checked)}
                />
              }
              label="Викликав підкріплення"
            />

            {/* Injuries Accordion */}
            <Accordion 
              sx={{ mt: 1 }} 
              expanded={expandedAccordions.injuries1}
              onChange={handleAccordionChange('injuries1')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Поранення</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(injuries1.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {injuries1.map((inj,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                    <Autocomplete
                      size="small"
                      value={inj.name}
                      onChange={(event, newValue) => {
                        const arr = [...injuries1]; 
                        arr[i].name = newValue || ''; 
                        setInjuries1(arr);
                      }}
                      options={modelNames1}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...injuries1];
                            arr[i].name = e.target.value;
                            setInjuries1(arr);
                          }}
                        />
                      )}
                    />
                    <TextField 
                      size="small" 
                      type="number" 
                      value={inj.roll} 
                      label="Кидок" 
                      onChange={e=>{
                        const arr = [...injuries1]; arr[i].roll = e.target.value; setInjuries1(arr);
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <IconButton color="error" onClick={()=>{const arr = injuries1.filter((_,idx)=>idx!==i); setInjuries1(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>                  <Autocomplete
                    size="small"
                    value={inj1Name}
                    onChange={(event, newValue) => setInj1Name(newValue || '')}
                    options={modelNames1}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setInj1Name(e.target.value)}
                      />
                    )}
                  />
                  <TextField 
                    size="small" 
                    type="number" 
                    value={inj1Roll} 
                    label="Кидок" 
                    onChange={e=>setInj1Roll(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <IconButton color="primary" onClick={handleAddInjury1} disabled={!(inj1Name&&inj1Roll)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            {/* Skills Accordion */}
            <Accordion 
              sx={{ mt: 1 }}
              expanded={expandedAccordions.skills1}
              onChange={handleAccordionChange('skills1')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Розвиток навичок</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(skills1.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {skills1.map((sk,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <Autocomplete
                      size="small"
                      value={sk.name}
                      onChange={(event, newValue) => {
                        const arr = [...skills1]; 
                        arr[i].name = newValue || ''; 
                        setSkills1(arr);
                      }}                      options={modelNames1}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...skills1];
                            arr[i].name = e.target.value;
                            setSkills1(arr);
                          }}
                        />
                      )}
                    />
                    <TextField 
                      size="small" 
                      type="number" 
                      value={sk.roll} 
                      label="Кидок" 
                      onChange={e=>{
                        const arr = [...skills1]; arr[i].roll = Number(e.target.value); setSkills1(arr);
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <IconButton color="error" onClick={()=>{const arr = skills1.filter((_,idx)=>idx!==i); setSkills1(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <Autocomplete
                    size="small"
                    value={sk1Name}
                    onChange={(event, newValue) => setSk1Name(newValue || '')}                    options={modelNames1}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setSk1Name(e.target.value)}
                      />
                    )}
                  />
                  <TextField 
                    size="small" 
                    type="number" 
                    value={sk1Roll} 
                    label="Кидок" 
                    onChange={e=>setSk1Roll(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <IconButton color="primary" onClick={handleAddSkill1} disabled={!(sk1Name&&sk1Roll)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Elites Accordion */}
            <Accordion 
              sx={{ mt: 1 }}
              expanded={expandedAccordions.elites1}
              onChange={handleAccordionChange('elites1')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Стають елітними</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(elites1.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {elites1.map((elite,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <Autocomplete
                      size="small"
                      value={elite.name}
                      onChange={(event, newValue) => {
                        const arr = [...elites1]; 
                        arr[i].name = newValue || ''; 
                        setElites1(arr);
                      }}                      options={modelNames1}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...elites1];
                            arr[i].name = e.target.value;
                            setElites1(arr);
                          }}
                        />
                      )}
                    />
                    <IconButton color="error" onClick={()=>{const arr = elites1.filter((_,idx)=>idx!==i); setElites1(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <Autocomplete
                    size="small"
                    value={elite1Name}
                    onChange={(event, newValue) => setElite1Name(newValue || '')}                    options={modelNames1}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setElite1Name(e.target.value)}
                      />
                    )}
                  />
                  <IconButton color="primary" onClick={handleAddElite1} disabled={!elite1Name}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>

            <TextField
              label="Кості дослідження"
              value={explore1}
              onChange={e => setExplore1(e.target.value)}
              size="small"
              sx={{ mt: 1, width: '100%' }}
              placeholder="напр. 2D6+1"
            />
          </Box>          {/* Player 2 */}
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>Гравець 2</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              <Tooltip title={player2?.name || player2?.login || ''} arrow>
                <Avatar src={player2?.avatar_url ? `/api/avatar/${player2.avatar_url}` : '/api/avatar/default'} />
              </Tooltip>
              <span>{player2?.name || player2?.login}</span>
            </Box>
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1.5, mb: 1 }}>Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              {warband2?.catalogue_name && FACTION_AVATARS[warband2.catalogue_name] && (
                <Tooltip title={warband2.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband2.catalogue_name]} alt={warband2.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband2?.name}</span>
            </Box>
            
            {/* Basic fields */}
            <TextField
              label="Переможні бали (VP)"
              type="number"
              value={vp2}
              onChange={e => setVp2(Number(e.target.value))}
              size="small"
              sx={{ mb: 1, width: '100%' }}
            />
            <TextField
              label="Слава (GP)"
              type="number"
              value={gp2}
              onChange={e => setGp2(Number(e.target.value))}
              size="small"
              sx={{ mb: 1, width: '100%' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reinforce2}
                  onChange={e => setReinforce2(e.target.checked)}
                />
              }
              label="Викликав підкріплення"
            />

            {/* Injuries Accordion */}
            <Accordion 
              sx={{ mt: 1 }} 
              expanded={expandedAccordions.injuries2}
              onChange={handleAccordionChange('injuries2')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Поранення</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(injuries2.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {injuries2.map((inj,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <Autocomplete
                      size="small"
                      value={inj.name}
                      onChange={(event, newValue) => {
                        const arr = [...injuries2]; 
                        arr[i].name = newValue || ''; 
                        setInjuries2(arr);
                      }}                      options={modelNames2}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...injuries2];
                            arr[i].name = e.target.value;
                            setInjuries2(arr);
                          }}
                        />
                      )}
                    />
                    <TextField 
                      size="small" 
                      type="number" 
                      value={inj.roll} 
                      label="Кидок" 
                      onChange={e=>{
                        const arr = [...injuries2]; arr[i].roll = e.target.value; setInjuries2(arr);
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <IconButton color="error" onClick={()=>{const arr = injuries2.filter((_,idx)=>idx!==i); setInjuries2(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <Autocomplete
                    size="small"
                    value={inj2Name}
                    onChange={(event, newValue) => setInj2Name(newValue || '')}                    options={modelNames2}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setInj2Name(e.target.value)}
                      />
                    )}
                  />
                  <TextField 
                    size="small" 
                    type="number" 
                    value={inj2Roll} 
                    label="Кидок" 
                    onChange={e=>setInj2Roll(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <IconButton color="primary" onClick={handleAddInjury2} disabled={!(inj2Name&&inj2Roll)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            {/* Skills Accordion */}
            <Accordion 
              sx={{ mt: 1 }}
              expanded={expandedAccordions.skills2}
              onChange={handleAccordionChange('skills2')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Розвиток навичок</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(skills2.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {skills2.map((sk,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <Autocomplete
                      size="small"
                      value={sk.name}
                      onChange={(event, newValue) => {
                        const arr = [...skills2]; 
                        arr[i].name = newValue || ''; 
                        setSkills2(arr);
                      }}                      options={modelNames2}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...skills2];
                            arr[i].name = e.target.value;
                            setSkills2(arr);
                          }}
                        />
                      )}
                    />
                    <TextField 
                      size="small" 
                      type="number" 
                      value={sk.roll} 
                      label="Кидок" 
                      onChange={e=>{
                        const arr = [...skills2]; arr[i].roll = Number(e.target.value); setSkills2(arr);
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <IconButton color="error" onClick={()=>{const arr = skills2.filter((_,idx)=>idx!==i); setSkills2(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <Autocomplete
                    size="small"
                    value={sk2Name}
                    onChange={(event, newValue) => setSk2Name(newValue || '')}                    options={modelNames2}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setSk2Name(e.target.value)}
                      />
                    )}
                  />
                  <TextField 
                    size="small" 
                    type="number" 
                    value={sk2Roll} 
                    label="Кидок" 
                    onChange={e=>setSk2Roll(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <IconButton color="primary" onClick={handleAddSkill2} disabled={!(sk2Name&&sk2Roll)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Elites Accordion */}
            <Accordion 
              sx={{ mt: 1 }}
              expanded={expandedAccordions.elites2}
              onChange={handleAccordionChange('elites2')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Typography sx={{ fontWeight: 'medium' }}>Стають елітними</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                {(elites2.length === 0) && <Typography color="text.secondary">Немає</Typography>}
                {elites2.map((elite,i)=>(
                  <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>
                    <Autocomplete
                      size="small"
                      value={elite.name}
                      onChange={(event, newValue) => {
                        const arr = [...elites2]; 
                        arr[i].name = newValue || ''; 
                        setElites2(arr);
                      }}                      options={modelNames2}
                      freeSolo
                      fullWidth
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Ім'я"
                          onChange={(e) => {
                            const arr = [...elites2];
                            arr[i].name = e.target.value;
                            setElites2(arr);
                          }}
                        />
                      )}
                    />
                    <IconButton color="error" onClick={()=>{const arr = elites2.filter((_,idx)=>idx!==i); setElites2(arr);}} title="Видалити рядок">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{display:'flex',gap:1,mb:1}}>
                  <Autocomplete
                    size="small"
                    value={elite2Name}
                    onChange={(event, newValue) => setElite2Name(newValue || '')}                    options={modelNames2}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Ім'я"
                        onChange={(e) => setElite2Name(e.target.value)}
                      />
                    )}
                  />
                  <IconButton color="primary" onClick={handleAddElite2} disabled={!elite2Name}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionDetails>
            </Accordion>

            <TextField
              label="Кості дослідження"
              value={explore2}
              onChange={e => setExplore2(e.target.value)}
              size="small"
              sx={{ mt: 1, width: '100%' }}
              placeholder="напр. 2D6+1"
            />
          </Box>
        </Box>
      </DialogContent>      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Закрити
        </Button>
        
        {/* For admin users, only show admin save button */}
        {isAdmin ? (
          <Button
            variant="contained"
            color="warning"
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            disabled={saving}
            onClick={handleAdminSave}
          >
            Зберегти (адмін)
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            disabled={saving}
            onClick={handleSave}
            sx={{ ml: 'auto' }}
          >
            Зберегти
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GameResultEdit;
