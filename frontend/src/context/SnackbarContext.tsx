import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: SnackbarState['severity']) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          transition: {
            style: {
              transitionTimingFunction: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
            },
          },
        }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          sx={{
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '20px',
            letterSpacing: '0.25px',
            boxShadow: '0px 1px 14px 0px rgba(0,0,0,0.06), 0px 5px 10px 0px rgba(0,0,0,0.1)',
            minWidth: 280,
          }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}
