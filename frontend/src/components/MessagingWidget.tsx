import { useState } from 'react';
import {
  Box, Fab, Card, CardContent, Typography, IconButton,
  TextField, Button,
} from '@mui/material';
import { Chat, Close, Send } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useSnackbar } from '@/context/SnackbarContext';

export default function MessagingWidget() {
  const { user, role } = useAuth();
  const { state, addMessage } = useMockData();
  const { showSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messagesSent, setMessagesSent] = useState(0);
  const DAILY_LIMIT = 5;

  if (role !== 'student') return null;

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      showSnackbar('Veuillez remplir le sujet et le message', 'error');
      return;
    }
    if (messagesSent >= DAILY_LIMIT) {
      showSnackbar('Limite quotidienne atteinte (5 messages)', 'error');
      return;
    }

    // Find student's trainer
    const student = state.students.find((s) => s.userId === user?.id);
    const trainerId = student?.trainerId;

    if (!trainerId || trainerId === 'null') {
      showSnackbar('Vous n\'avez pas encore de formateur assigné.', 'error');
      return;
    }

    if (!user?.id) {
      showSnackbar('Erreur d\'identification.', 'error');
      return;
    }

    addMessage({
      id: `m${Date.now()}`,
      fromStudentId: user.id,
      toTrainerId: trainerId,
      subject: subject.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });

    setMessagesSent((prev) => prev + 1);
    setSubject('');
    setBody('');
    showSnackbar('Message envoyé à votre formateur', 'success');
    setOpen(false);
  };

  const remaining = DAILY_LIMIT - messagesSent;

  if (open) {
    return (
      <Card
        sx={{
          position: 'fixed',
          bottom: { xs: 120, md: 32 },
          right: { xs: 16, md: 32 },
          width: 360,
          maxWidth: 'calc(100vw - 48px)',
          height: 480,
          zIndex: 1300,
          borderRadius: 3,
          boxShadow: '0px 1px 14px 0px rgba(0,0,0,0.1), 0px 5px 10px 0px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <CardContent
          sx={{
            p: 2,
            pb: 1.5,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontSize: '16px' }}>
            Message à mon formateur
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Close fontSize="small" />
          </IconButton>
        </CardContent>

        {/* Form */}
        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
          <TextField
            label="Sujet"
            fullWidth
            size="small"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || remaining <= 0}
            endIcon={<Send fontSize="small" />}
            sx={{ mt: 'auto', borderRadius: 6, textTransform: 'none', fontWeight: 500 }}
          >
            Envoyer
          </Button>
        </CardContent>

        {/* Footer */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'surface.variant',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: remaining <= 1 ? 'error.main' : 'text.secondary' }}
          >
            {remaining} message{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} aujourd'hui
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Fab
      color="primary"
      onClick={() => setOpen(true)}
      sx={{
        position: 'fixed',
        bottom: { xs: 110, md: 32 },
        right: { xs: 16, md: 32 },
        zIndex: 1300,
        borderRadius: '18px',
        width: 56,
        height: 56,
        boxShadow: (theme) => `0 10px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
        '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: (theme) => `0 15px 30px ${alpha(theme.palette.primary.main, 0.5)}`,
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Chat />
    </Fab>
  );
}
