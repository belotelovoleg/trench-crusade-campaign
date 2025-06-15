import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Avatar, Tooltip, Checkbox, FormControlLabel, IconButton, Select, MenuItem, InputLabel, FormControl, Accordion, AccordionSummary, AccordionDetails, Autocomplete } from '@mui/material';
import FACTION_AVATARS from '../factionAvatars';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

interface GameResultsDialogProps {
  open: boolean;
  onClose: () => void;
  game: any;
  onResultsSaved: (action?: 'edit' | 'approve') => void;
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
  const [inj2Roll, setInj2Roll] = useState('');  const [skills1, setSkills1] = useState<Array<{name:string,roll:number}>>(Array.isArray(game.player1_skillAdvancements) ? game.player1_skillAdvancements : []);
  const [skills2, setSkills2] = useState<Array<{name:string,roll:number}>>(Array.isArray(game.player2_skillAdvancements) ? game.player2_skillAdvancements : []);
  const [sk1Name, setSk1Name] = useState('');
  const [sk1Roll, setSk1Roll] = useState('');
  const [sk2Name, setSk2Name] = useState('');
  const [sk2Roll, setSk2Roll] = useState('');
  const [elites1, setElites1] = useState<Array<{name:string}>>(Array.isArray(game.player1_becomesElite) ? game.player1_becomesElite : []);
  const [elites2, setElites2] = useState<Array<{name:string}>>(Array.isArray(game.player2_becomesElite) ? game.player2_becomesElite : []);
  const [elite1Name, setElite1Name] = useState('');  const [elite2Name, setElite2Name] = useState('');
  const [explore1, setExplore1] = useState(game.player1_explorationDice || '');
  const [explore2, setExplore2] = useState(game.player2_explorationDice || '');
  const [adminStatus, setAdminStatus] = useState(game.status || 'planned');
  const [modelNames1, setModelNames1] = useState<string[]>([]);
  const [modelNames2, setModelNames2] = useState<string[]>([]);
  // State variables to control Autocomplete dropdown open state
  const [inj1AutocompleteOpen, setInj1AutocompleteOpen] = useState(false);
  const [inj2AutocompleteOpen, setInj2AutocompleteOpen] = useState(false);
  const [sk1AutocompleteOpen, setSk1AutocompleteOpen] = useState(false);
  const [sk2AutocompleteOpen, setSk2AutocompleteOpen] = useState(false);
  const [elite1AutocompleteOpen, setElite1AutocompleteOpen] = useState(false);
  const [elite2AutocompleteOpen, setElite2AutocompleteOpen] = useState(false);
  
  // Arrays to track which accordions are expanded
  const [expandedAccordions, setExpandedAccordions] = useState<{[key: string]: boolean}>({
    'injuries1': false,
    'skills1': false,
    'elites1': false,
    'injuries2': false,
    'skills2': false,
    'elites2': false
  });
  
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
    const elites1Full = elite1Name ? [...elites1, { name: elite1Name }] : elites1;
    const elites2Full = elite2Name ? [...elites2, { name: elite2Name }] : elites2;
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
          player1_injuries: injuries1Full,
          player2_injuries: injuries2Full,
          player1_skillAdvancements: skills1Full,
          player2_skillAdvancements: skills2Full,
          player1_becomesElite: elites1Full,
          player2_becomesElite: elites2Full,
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
      onResultsSaved('edit');
    } catch (e: any) {
      setError(e.message || 'Не вдалося зберегти результати');
    } finally {
      setSaving(false);
    }
  }  async function handleApprove() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns/'+game.campaign_id+'/battles/plan/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, action: 'approve' })
      });
      if (!res.ok) throw new Error('Не вдалося підтвердити результат');
      onClose();
      onResultsSaved('approve');
    } catch (e: any) {
      setError(e.message || 'Не вдалося підтвердити результат');
    } finally {
      setSaving(false);
    }
  }
  // Function to switch dialog from readOnly view mode to edit mode
  function handleSwitchToEditMode() {
    // Just need to switch off readOnly mode, no API call needed
    // The parent component will handle this state change
    if (onResultsSaved) {
      // Call with 'edit' action to indicate we want to edit
      onResultsSaved('edit');
    }
    if (onClose) {
      onClose(); // Close current dialog in read mode
    }
  }async function handleAdminSave() {
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
          player1_becomesElite: elites1,
          player2_becomesElite: elites2,
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
      onResultsSaved('edit');
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

  // --- Becomes Elite: додавання ---
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
    setElites1(Array.isArray(game.player1_becomesElite) ? game.player1_becomesElite : []);
    setElites2(Array.isArray(game.player2_becomesElite) ? game.player2_becomesElite : []);
    setExplore1(game.player1_explorationDice ?? '');
    setExplore2(game.player2_explorationDice ?? '');
    setAdminStatus(game.status ?? 'planned');
    
    // Reset all autocomplete open states
    setInj1AutocompleteOpen(false);
    setInj2AutocompleteOpen(false);
    setSk1AutocompleteOpen(false);
    setSk2AutocompleteOpen(false);
    setElite1AutocompleteOpen(false);
    setElite2AutocompleteOpen(false);
    
    // Reset all accordion expansion states
    setExpandedAccordions({
      'injuries1': false,
      'skills1': false,
      'elites1': false,
      'injuries2': false,
      'skills2': false,
      'elites2': false
    });
  }, [game, open]);

  // Effect to load roster data and extract model names
  useEffect(() => {
    const loadRosterData = async () => {
      try {        // Try to load roster data for player 1
        if (game.warband_1_roster_id) {
          const res1 = await fetch(`/api/roster?roster_id=${game.warband_1_roster_id}`);
          if (res1.ok) {
            const data = await res1.json();
            if (data.file_content) {
              try {
                const rosterJson = JSON.parse(data.file_content);
                const names = extractModelNames(rosterJson);
                setModelNames1(names);
              } catch (e) {
                console.error("Error parsing roster JSON for player 1:", e);
              }
            }
          }
        }
          // Try to load roster data for player 2
        if (game.warband_2_roster_id) {
          const res2 = await fetch(`/api/roster?roster_id=${game.warband_2_roster_id}`);
          if (res2.ok) {
            const data = await res2.json();
            if (data.file_content) {
              try {
                const rosterJson = JSON.parse(data.file_content);
                const names = extractModelNames(rosterJson);
                setModelNames2(names);
              } catch (e) {
                console.error("Error parsing roster JSON for player 2:", e);
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
  }, [game.warband_1_roster_id, game.warband_2_roster_id, open]);

  // Function to extract model names from a roster JSON
  const extractModelNames = (roster: any) => {
    const modelNames: string[] = [];
    const nameCountMap: {[key: string]: number} = {};
    
    try {
      // Get the forces array
      const forces = roster?.roster?.forces || [];
      
      // For each force
      forces.forEach((force: any) => {
        // Get the selections array
        const selections = force.selections || [];
        
        // Filter for entries with type "model" and extract names
        selections.forEach((selection: any) => {
          if (selection.type === "model") {
            const name = selection.name;
            
            // Count occurrences of each name
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

  // Function to handle accordion expansion state changes
  const handleAccordionChange = (accordionId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    // Update the expanded state of this accordion
    setExpandedAccordions(prev => ({
      ...prev,
      [accordionId]: isExpanded
    }));
    
    // If the accordion is being collapsed, close any associated autocomplete dropdown
    if (!isExpanded) {
      // Close the appropriate autocomplete dropdown based on which accordion is being collapsed
      switch (accordionId) {
        case 'injuries1':
          setInj1AutocompleteOpen(false);
          break;
        case 'injuries2':
          setInj2AutocompleteOpen(false);
          break;
        case 'skills1':
          setSk1AutocompleteOpen(false);
          break;
        case 'skills2':
          setSk2AutocompleteOpen(false);
          break;
        case 'elites1':
          setElite1AutocompleteOpen(false);
          break;
        case 'elites2':
          setElite2AutocompleteOpen(false);
          break;
      }
    }
  };

  // Prevent showing action buttons after dialog is closed
  if (!open) return null;
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
        {adminViewOnly
          ? 'Результат гри (тільки перегляд, адмін)'
          : (adminEditMode)
            ? 'Редагування результату гри (адмін)'
            : (readOnly && confirmMode === 'approve')
              ? 'Підтвердження результату гри'
              : (readOnly)
                ? 'Перегляд результату гри'
                : 'Редагування результату гри'}
      </DialogTitle><DialogContent sx={{ pt: 2 }}>
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
        <Box sx={{
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3,
          mb: 2
        }}>
          <Box sx={{
            flex: 1, 
            p: 2, 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>Гравець 1</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}><Tooltip title={player1?.name || player1?.login || ''} arrow>
                <Avatar src={player1?.avatar_url ? `/api/avatar/${player1.avatar_url}` : '/api/avatar/default'} />
              </Tooltip>              <span>{player1?.name || player1?.login}</span>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1.5 }}>Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              {warband1?.catalogue_name && FACTION_AVATARS[warband1.catalogue_name] && (
                <Tooltip title={warband1.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband1.catalogue_name]} alt={warband1.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband1?.name}</span>
            </Box>
            {readOnly ? (
              <>                <Typography sx={{mb:1}}>Переможні бали (VP): <b>{vp1}</b></Typography>
                <Typography>Слава (GP): <b>{gp1}</b></Typography>
                <Typography>Підкріплення: <b>{game.player1_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
                <Typography sx={{mt:1}}>Поранення:</Typography>
                {(game.player1_injuries||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player1_injuries||[]).map((inj:any,i:number)=>(<li key={i}>{inj.name}: {inj.roll}</li>))}</ul>
                )}                <Typography sx={{mt:1}}>Розвиток навичок:</Typography>
                {(game.player1_skillAdvancements||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player1_skillAdvancements||[]).map((sk:any,i:number)=>(<li key={i}>{sk.name}: {sk.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Стають елітними:</Typography>
                {(game.player1_becomesElite||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player1_becomesElite||[]).map((elite:any,i:number)=>(<li key={i}>{elite.name}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Бали розвідки: <b>{game.player1_explorationDice ?? '-'}</b></Typography>
              </>
            ) : (
              <>                <TextField 
                  label="Переможні бали (VP)" 
                  type="number" 
                  value={vp1} 
                  onChange={e=>setVp1(e.target.value)} 
                  fullWidth 
                  sx={{mb:1.5}}
                  inputProps={{ min: 0, step: 1 }}
                  variant="outlined"
                  size="small"
                />                <TextField 
                  label="Слава (GP)" 
                  type="number" 
                  value={gp1} 
                  onChange={e=>setGp1(e.target.value)} 
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                  variant="outlined"
                  size="small"
                />
                <FormControlLabel 
                  control={<Checkbox 
                    checked={reinforce1} 
                    onChange={e=>{
                      setReinforce1(e.target.checked);
                      if (e.target.checked) {
                        setExplore1('');
                      }
                    }} 
                  />} 
                  label="Викликав підкріплення" 
                  sx={{mt:1}} 
                />
                
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
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
                          open={expandedAccordions.injuries1 && inj1AutocompleteOpen}
                          onOpen={() => setInj1AutocompleteOpen(true)}
                          onClose={() => setInj1AutocompleteOpen(false)}
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
                        />                        <IconButton color="error" onClick={()=>{const arr = injuries1.filter((_,idx)=>idx!==i); setInjuries1(arr);}} title="Видалити рядок">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={inj1Name}
                        onChange={(event, newValue) => setInj1Name(newValue || '')}
                        options={modelNames1}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.injuries1 && inj1AutocompleteOpen}
                        onOpen={() => setInj1AutocompleteOpen(true)}
                        onClose={() => setInj1AutocompleteOpen(false)}
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
                          size="small"
                          value={sk.name}
                          onChange={(event, newValue) => {
                            const arr = [...skills1]; 
                            arr[i].name = newValue || ''; 
                            setSkills1(arr);
                          }}
                          options={modelNames1}
                          freeSolo
                          fullWidth
                          open={expandedAccordions.skills1 && sk1AutocompleteOpen}
                          onOpen={() => setSk1AutocompleteOpen(true)}
                          onClose={() => setSk1AutocompleteOpen(false)}
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
                        />                        <IconButton color="error" onClick={()=>{const arr = skills1.filter((_,idx)=>idx!==i); setSkills1(arr);}} title="Видалити рядок">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={sk1Name}
                        onChange={(event, newValue) => setSk1Name(newValue || '')}
                        options={modelNames1}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.skills1 && sk1AutocompleteOpen}
                        onOpen={() => setSk1AutocompleteOpen(true)}
                        onClose={() => setSk1AutocompleteOpen(false)}
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
                          size="small"
                          value={elite.name}
                          onChange={(event, newValue) => {
                            const arr = [...elites1]; 
                            arr[i].name = newValue || ''; 
                            setElites1(arr);
                          }}
                          options={modelNames1}
                          freeSolo
                          fullWidth
                          open={expandedAccordions.elites1 && elite1AutocompleteOpen}
                          onOpen={() => setElite1AutocompleteOpen(true)}
                          onClose={() => setElite1AutocompleteOpen(false)}
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
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={elite1Name}
                        onChange={(event, newValue) => setElite1Name(newValue || '')}
                        options={modelNames1}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.elites1 && elite1AutocompleteOpen}
                        onOpen={() => setElite1AutocompleteOpen(true)}
                        onClose={() => setElite1AutocompleteOpen(false)}
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
                </Accordion>                <TextField 
                  label="Бали розвідки" 
                  type="number" 
                  value={explore1} 
                  onChange={e=>setExplore1(e.target.value)} 
                  fullWidth 
                  sx={{mb:1, mt:1}}
                  inputProps={{ min: 0, step: 1 }}
                  disabled={reinforce1}
                  variant="outlined"
                  size="small"
                />
              </>
            )}          </Box>
          <Box sx={{
            flex: 1, 
            p: 2, 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>Гравець 2</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}><Tooltip title={player2?.name || player2?.login || ''} arrow>
                <Avatar src={player2?.avatar_url ? `/api/avatar/${player2.avatar_url}` : '/api/avatar/default'} />
              </Tooltip>              <span>{player2?.name || player2?.login}</span>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1.5 }}>Варбанда:</Typography>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.5}}>
              {warband2?.catalogue_name && FACTION_AVATARS[warband2.catalogue_name] && (
                <Tooltip title={warband2.catalogue_name} arrow>
                  <img src={FACTION_AVATARS[warband2.catalogue_name]} alt={warband2.catalogue_name} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',verticalAlign:'middle'}} />
                </Tooltip>
              )}
              <span>{warband2?.name}</span>
            </Box>
            {readOnly ? (
              <>                <Typography sx={{mb:1}}>Переможні бали (VP): <b>{vp2}</b></Typography>
                <Typography>Слава (GP): <b>{gp2}</b></Typography>
                <Typography>Підкріплення: <b>{game.player2_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
                <Typography sx={{mt:1}}>Поранення:</Typography>
                {(game.player2_injuries||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player2_injuries||[]).map((inj:any,i:number)=>(<li key={i}>{inj.name}: {inj.roll}</li>))}</ul>
                )}                <Typography sx={{mt:1}}>Розвиток навичок:</Typography>
                {(game.player2_skillAdvancements||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player2_skillAdvancements||[]).map((sk:any,i:number)=>(<li key={i}>{sk.name}: {sk.roll}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Стають елітними:</Typography>
                {(game.player2_becomesElite||[]).length === 0 ? <Typography color="text.secondary">Немає</Typography> : (
                  <ul style={{margin:0,paddingLeft:18}}>{(game.player2_becomesElite||[]).map((elite:any,i:number)=>(<li key={i}>{elite.name}</li>))}</ul>
                )}
                <Typography sx={{mt:1}}>Бали розвідки: <b>{game.player2_explorationDice ?? '-'}</b></Typography>
              </>
            ) : (
              <>                <TextField 
                  label="Переможні бали (VP)" 
                  type="number" 
                  value={vp2} 
                  onChange={e=>setVp2(e.target.value)} 
                  fullWidth 
                  sx={{mb:1.5}}
                  inputProps={{ min: 0, step: 1 }}
                  variant="outlined"
                  size="small"
                />                <TextField 
                  label="Слава (GP)" 
                  type="number" 
                  value={gp2} 
                  onChange={e=>setGp2(e.target.value)} 
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                  variant="outlined"
                  size="small"
                />
                <FormControlLabel 
                  control={<Checkbox 
                    checked={reinforce2} 
                    onChange={e=>{
                      setReinforce2(e.target.checked);
                      if (e.target.checked) {
                        setExplore2('');
                      }
                    }} 
                  />} 
                  label="Викликав підкріплення" 
                  sx={{mt:1}} 
                />
                
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
                          size="small"
                          value={inj.name}
                          onChange={(event, newValue) => {
                            const arr = [...injuries2]; 
                            arr[i].name = newValue || ''; 
                            setInjuries2(arr);
                          }}
                          options={modelNames2}
                          freeSolo
                          fullWidth
                          open={expandedAccordions.injuries2 && inj2AutocompleteOpen}
                          onOpen={() => setInj2AutocompleteOpen(true)}
                          onClose={() => setInj2AutocompleteOpen(false)}
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
                        />                        <IconButton color="error" onClick={()=>{const arr = injuries2.filter((_,idx)=>idx!==i); setInjuries2(arr);}} title="Видалити рядок">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={inj2Name}
                        onChange={(event, newValue) => setInj2Name(newValue || '')}
                        options={modelNames2}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.injuries2 && inj2AutocompleteOpen}
                        onOpen={() => setInj2AutocompleteOpen(true)}
                        onClose={() => setInj2AutocompleteOpen(false)}
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
                          size="small"
                          value={sk.name}
                          onChange={(event, newValue) => {
                            const arr = [...skills2]; 
                            arr[i].name = newValue || ''; 
                            setSkills2(arr);
                          }}
                          options={modelNames2}
                          freeSolo
                          fullWidth
                          open={expandedAccordions.skills2 && sk2AutocompleteOpen}
                          onOpen={() => setSk2AutocompleteOpen(true)}
                          onClose={() => setSk2AutocompleteOpen(false)}
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
                        />                        <IconButton color="error" onClick={()=>{const arr = skills2.filter((_,idx)=>idx!==i); setSkills2(arr);}} title="Видалити рядок">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={sk2Name}
                        onChange={(event, newValue) => setSk2Name(newValue || '')}
                        options={modelNames2}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.skills2 && sk2AutocompleteOpen}
                        onOpen={() => setSk2AutocompleteOpen(true)}
                        onClose={() => setSk2AutocompleteOpen(false)}
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
                      <Box key={i} sx={{display:'flex',gap:1,mb:0.5}}>                        <Autocomplete
                          size="small"
                          value={elite.name}
                          onChange={(event, newValue) => {
                            const arr = [...elites2]; 
                            arr[i].name = newValue || ''; 
                            setElites2(arr);
                          }}
                          options={modelNames2}
                          freeSolo
                          fullWidth
                          open={expandedAccordions.elites2 && elite2AutocompleteOpen}
                          onOpen={() => setElite2AutocompleteOpen(true)}
                          onClose={() => setElite2AutocompleteOpen(false)}
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
                    <Box sx={{display:'flex',gap:1,mb:1}}>                      <Autocomplete
                        size="small"
                        value={elite2Name}
                        onChange={(event, newValue) => setElite2Name(newValue || '')}
                        options={modelNames2}
                        freeSolo
                        fullWidth
                        open={expandedAccordions.elites2 && elite2AutocompleteOpen}
                        onOpen={() => setElite2AutocompleteOpen(true)}
                        onClose={() => setElite2AutocompleteOpen(false)}
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
                </Accordion>                <TextField 
                  label="Бали розвідки" 
                  type="number" 
                  value={explore2} 
                  onChange={e=>setExplore2(e.target.value)} 
                  fullWidth 
                  sx={{mb:1, mt:1}}
                  inputProps={{ min: 0, step: 1 }}
                  disabled={reinforce2}
                  variant="outlined"
                  size="small"
                />
              </>
            )}
          </Box>
        </Box>        {error && (
          <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
            <Typography>{error}</Typography>
          </Box>
        )}
      </DialogContent>      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>        <Button onClick={onClose} variant="outlined" color="inherit">Закрити</Button>
        {!adminViewOnly && (readOnly ? (
          <>
            <Button 
              onClick={handleSwitchToEditMode} 
              variant="outlined" 
              color="primary" 
              disabled={saving}
              startIcon={<EditIcon />}
            >
              Змінити результат
            </Button>
            {confirmMode === 'approve' && (
              <Button 
                onClick={handleApprove} 
                variant="contained" 
                color="success" 
                disabled={saving}
                startIcon={<CheckCircleIcon />}
              >
                Підтвердити результат
              </Button>
            )}
          </>
        ) : (
          <Button 
            onClick={adminEditMode ? handleAdminSave : handleSave} 
            variant="contained" 
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            {adminEditMode ? 'Зберегти (адмін)' : 'Зберегти'}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default GameResultsDialog;
