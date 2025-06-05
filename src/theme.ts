// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a237e', // темний синій
    },
    secondary: {
      main: '#4f0101', // темний фіолетовий
    },
  },
  typography: {
    fontFamily: "'Montserrat Alternates', Arial, Helvetica, sans-serif",
  },
});

export default theme;