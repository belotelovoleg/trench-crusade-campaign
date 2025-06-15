// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6f3803',
    },
    secondary: {
      main: '#4f0101', 
    },
  },
  typography: {
    fontFamily: "'Montserrat Alternates', Arial, Helvetica, sans-serif",
  },
});

export default theme;