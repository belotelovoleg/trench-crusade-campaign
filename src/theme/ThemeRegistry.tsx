'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme';
import EmotionRegistry from './EmotionRegistry';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionRegistry>
  );
}
