import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Avatar, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import FACTION_AVATARS from '../factionAvatars';

interface GameResultViewProps {
  open: boolean;
  onClose: () => void;
  game: any;
  mode?: 'view' | 'approve' | 'ownResult'; // view = just viewing, approve = viewing to approve/disapprove, ownResult = player viewing their own submitted result
  onAction?: (action: 'approve' | 'reject' | 'edit') => void; // Called when approve/reject/edit buttons clicked
}

const GameResultView: React.FC<GameResultViewProps> = ({ 
  open, 
  onClose, 
  game, 
  mode = 'view',
  onAction 
}) => {
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

  const player1 = game.warbands_games_warband_1_idTowarbands?.players;
  const player2 = game.warbands_games_warband_2_idTowarbands?.players;
  const warband1 = game.warbands_games_warband_1_idTowarbands;
  const warband2 = game.warbands_games_warband_2_idTowarbands;

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
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        pb: 1.5,
        fontWeight: 'bold'
      }}>
        Результат гри
      </DialogTitle>      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' } // Stack vertically on mobile, side by side on desktop
        }}>          {/* Player 1 Results */}
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
            
            <Typography sx={{mb:1}}>Переможні бали (VP): <b>{game.vp_1 || 0}</b></Typography>
            <Typography sx={{mb:1}}>Слава (GP): <b>{game.gp_1 || 0}</b></Typography>
            <Typography sx={{mb:1}}>Підкріплення: <b>{game.player1_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
            
            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Поранення:</Typography>
            {(game.player1_injuries||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player1_injuries||[]).map((inj:any,i:number)=>(
                  <li key={i}>{inj.name}: {inj.roll}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Розвиток навичок:</Typography>
            {(game.player1_skillAdvancements||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player1_skillAdvancements||[]).map((sk:any,i:number)=>(
                  <li key={i}>{sk.name}: {sk.roll}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Стають елітними:</Typography>
            {(game.player1_becomesElite||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player1_becomesElite||[]).map((elite:any,i:number)=>(
                  <li key={i}>{elite.name}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Кості дослідження:</Typography>
            <Typography>{game.player1_explorationDice || 'Не вказано'}</Typography>
          </Box>          {/* Player 2 Results */}
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
            
            <Typography sx={{mb:1}}>Переможні бали (VP): <b>{game.vp_2 || 0}</b></Typography>
            <Typography sx={{mb:1}}>Слава (GP): <b>{game.gp_2 || 0}</b></Typography>
            <Typography sx={{mb:1}}>Підкріплення: <b>{game.player2_calledReinforcements ? 'Так' : 'Ні'}</b></Typography>
            
            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Поранення:</Typography>
            {(game.player2_injuries||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player2_injuries||[]).map((inj:any,i:number)=>(
                  <li key={i}>{inj.name}: {inj.roll}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Розвиток навичок:</Typography>
            {(game.player2_skillAdvancements||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player2_skillAdvancements||[]).map((sk:any,i:number)=>(
                  <li key={i}>{sk.name}: {sk.roll}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Стають елітними:</Typography>
            {(game.player2_becomesElite||[]).length === 0 ? (
              <Typography color="text.secondary">Немає</Typography>
            ) : (
              <ul style={{margin:0,paddingLeft:18}}>
                {(game.player2_becomesElite||[]).map((elite:any,i:number)=>(
                  <li key={i}>{elite.name}</li>
                ))}
              </ul>
            )}

            <Typography sx={{mt:2, mb:1, fontWeight: 'bold'}}>Кості дослідження:</Typography>
            <Typography>{game.player2_explorationDice || 'Не вказано'}</Typography>
          </Box>
        </Box>
      </DialogContent>      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Закрити
        </Button>
        
        {mode === 'approve' && onAction && (
          <>
            <Button 
              onClick={() => onAction('edit')} 
              variant="outlined" 
              color="primary" 
              startIcon={<EditIcon />}
            >
              Змінити результат
            </Button>
            <Button 
              onClick={() => onAction('approve')} 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleIcon />}
            >
              Підтвердити
            </Button>
            <Button 
              onClick={() => onAction('reject')} 
              variant="outlined" 
              color="error" 
              startIcon={<ClearIcon />}
            >
              Відхилити
            </Button>
          </>
        )}

        {mode === 'ownResult' && onAction && (
          <Button 
            onClick={() => onAction('edit')} 
            variant="contained" 
            color="primary" 
            startIcon={<EditIcon />}
          >
            Змінити результат
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GameResultView;
