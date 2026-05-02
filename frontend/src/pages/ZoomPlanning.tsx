import { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  AvatarGroup, IconButton, Paper, Grid, Badge, Tabs, Tab
} from '@mui/material';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';
import {
  Add, Videocam, Delete, OpenInNew, Repeat, Edit,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';

dayjs.locale('fr');

function ServerDay(props: any & { highlightedDays?: string[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const hasSession =
    !props.outsideCurrentMonth && highlightedDays.includes(day.format('YYYY-MM-DD'));

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={hasSession ? <Box sx={{ width: 5, height: 5, bgcolor: 'primary.main', borderRadius: '50%', mt: -1 }} /> : undefined}
    >
      <PickerDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export default function ZoomPlanning() {
  const { user, role } = useAuth();
  const theme = useTheme();
  const { state, addZoom, updateZoom, deleteZoom } = useMockData();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState(0); // 0: Jour, 1: Toutes
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [zoomForm, setZoomForm] = useState({
    title: '',
    date: dayjs().format('YYYY-MM-DD'),
    time: '14:00',
    link: '',
    studentIds: [] as string[],
    trainerId: '', // Added this
    isRecurring: false,
    recurrenceRule: 'Tous les mardis',
  });

  const mySessions = useMemo(() => {
    if (!user) return [];
    if (role === 'student') {
      return state.zoomSessions
        .filter((z) => z.studentIds.includes(user.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    if (role === 'trainer') {
        return state.zoomSessions
          .filter((z) => z.trainerId === user.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    // Admins see all
    return state.zoomSessions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [state.zoomSessions, user, role]);

  const sessionsForDate = mySessions.filter(
    (z) => dayjs(z.date).isSame(selectedDate, 'day')
  );

  const displayedSessions = activeTab === 0 ? sessionsForDate : mySessions;
  const highlightedDays = useMemo(() => mySessions.map(s => s.date), [mySessions]);

  const handleAddZoom = async () => {
    if (!zoomForm.title || !zoomForm.link || (role === 'admin' && !zoomForm.trainerId)) {
      showSnackbar(t('common.fill_fields'), 'error');
      return;
    }

    try {
      const newSession = {
        id: `z${Date.now()}`,
        date: zoomForm.date,
        time: zoomForm.time,
        link: zoomForm.link,
        trainerId: zoomForm.trainerId || user?.id || '',
        studentIds: zoomForm.studentIds,
        isRecurring: zoomForm.isRecurring,
        recurrenceRule: zoomForm.isRecurring ? zoomForm.recurrenceRule : null,
        title: zoomForm.title,
      };

      if (isEditing && editingSessionId) {
        await updateZoom(editingSessionId, newSession);
        showSnackbar(t('zoom.updated') || 'Séance mise à jour', 'success');
      } else {
        await addZoom(newSession);
        showSnackbar(t('zoom.success'), 'success');
      }
      setDialogOpen(false);
      setIsEditing(false);
      setEditingSessionId(null);
      setZoomForm({
        title: '',
        date: dayjs().format('YYYY-MM-DD'),
        time: '14:00',
        link: '',
        studentIds: [],
        trainerId: '',
        isRecurring: false,
        recurrenceRule: 'Tous les mardis',
      });
    } catch (error) {
      console.error('Error adding zoom:', error);
      showSnackbar(t('common.error'), 'error');
    }
  };

  const handleDelete = (sessionId: string) => {
    deleteZoom(sessionId);
    showSnackbar(t('zoom.deleted'), 'info');
  };

  const handleEditClick = (session: ZoomSession) => {
    setZoomForm({
        title: session.title,
        date: session.date,
        time: session.time,
        link: session.link,
        studentIds: session.studentIds,
        trainerId: session.trainerId,
        isRecurring: session.isRecurring,
        recurrenceRule: session.recurrenceRule || 'Tous les mardis',
    });
    setEditingSessionId(session.id);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const availableStudents = state.students;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <Box sx={{ py: 2 }}>
        <PageHeader 
            title={t('zoom.title')}
            subtitle={t('zoom.subtitle')}
            breadcrumbs={[{ label: t('nav.dashboard') }, { label: 'Zoom' }]}
            action={
                (role === 'trainer' || role === 'admin') && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setZoomForm(prev => ({ ...prev, trainerId: user?.id || '' }));
                            setIsEditing(false);
                            setEditingSessionId(null);
                            setDialogOpen(true);
                        }}
                        sx={{ borderRadius: '12px' }}
                    >
                        Planifier un Zoom
                    </Button>
                )
            }
        />

        <Grid container spacing={4}>
          {/* Calendar Section */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ borderRadius: 1, border: 'none', boxShadow: `0 12px 32px ${alpha(theme.palette.text.primary, 0.05)}` }}>
              <CardContent sx={{ p: 2 }}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newDate) => {
                      if (newDate) {
                          setSelectedDate(newDate);
                          setActiveTab(0); // Retour au mode jour si on clique sur le calendrier
                      }
                  }}
                  slots={{ day: ServerDay }}
                  slotProps={{
                      day: { highlightedDays } as any
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiPickersDay-root': {
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '12px',
                    },
                    '& .MuiPickersDay-root.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                    '& .MuiPickersDay-today': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                    },
                    '& .MuiPickersDay-root:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Session List Section */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '15px' }
                    }}
                >
                    <Tab label="Par jour" />
                    <Tab label="Toutes les séances" />
                </Tabs>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="titleMedium" sx={{ fontWeight: 800 }}>
                    {activeTab === 0 ? `Séances du ${selectedDate.format('D MMMM')}` : 'Toutes les séances planifiées'}
                </Typography>
                <Chip 
                    label={`${displayedSessions.length} séance(s)`} 
                    size="small" 
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700 }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {displayedSessions.length > 0 ? (
                displayedSessions.map((session) => {
                  const students = state.students.filter((s) =>
                    session.studentIds.includes(s.userId)
                  );
                  return (
                    <Paper
                      key={session.id}
                      sx={{
                        p: 3,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                        transition: 'all 0.2s ease',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.text.primary, 0.02)}`,
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.text.primary, 0.06)}`,
                          borderColor: 'primary.main',
                        },
                      }}
                      elevation={0}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box 
                                sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: '12px', 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'primary.main'
                                }}
                            >
                                <Videocam />
                            </Box>
                            <Box>
                                <Typography variant="labelLarge" sx={{ fontSize: '16px', fontWeight: 700, display: 'block' }}>
                                    {session.title}
                                </Typography>
                                <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Heure : {session.time} • {session.isRecurring ? 'Récurrence active' : 'Séance unique'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            href={session.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                          >
                            Rejoindre
                          </Button>
                          {(role === 'trainer' || role === 'admin') && (
                            <>
                                <IconButton
                                size="small"
                                onClick={() => handleEditClick(session)}
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }}
                                >
                                <Edit sx={{ fontSize: 18 }} />
                                </IconButton>
                                <IconButton
                                size="small"
                                onClick={() => handleDelete(session.id)}
                                sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}
                                >
                                <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AvatarGroup
                                max={4}
                                sx={{
                                    '& .MuiAvatar-root': {
                                        width: 32,
                                        height: 32,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: `2px solid ${theme.palette.background.paper}`,
                                    },
                                }}
                            >
                                {students.map((s) => (
                                    <Avatar
                                        key={s.id}
                                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main' }}
                                    >
                                        {s.firstName?.[0] || ''}{s.lastName?.[0] || ''}
                                    </Avatar>
                                ))}
                            </AvatarGroup>
                            <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {students.length} participants inscrits
                            </Typography>
                        </Box>

                        {session.isRecurring && (
                          <Chip
                            icon={<Repeat sx={{ fontSize: 14 }} />}
                            label={session.recurrenceRule}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.secondary.main, 0.05),
                              color: 'secondary.main',
                              fontSize: '11px',
                              fontWeight: 700,
                              height: 24,
                            }}
                          />
                        )}
                      </Box>
                    </Paper>
                  );
                })
              ) : (
                <Card 
                    variant="outlined" 
                    sx={{ 
                        borderRadius: 4, 
                        py: 8, 
                        textAlign: 'center', 
                        borderStyle: 'dashed',
                        bgcolor: alpha(theme.palette.text.primary, 0.01) 
                    }}
                >
                  <Videocam sx={{ fontSize: 48, mb: 2, color: 'text.disabled', opacity: 0.3 }} />
                  <Typography variant="labelLarge" sx={{ color: 'text.secondary', display: 'block' }}>
                    Aucune séance planifiée
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'text.disabled' }}>
                    Utilisez le calendrier pour sélectionner une autre date
                  </Typography>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Add Zoom Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: '24px' } } }}
        >
          <DialogTitle sx={{ fontSize: '24px', fontWeight: 700, pt: 4, px: 4 }}>
            {isEditing ? 'Modifier la séance' : 'Planifier un Zoom'}
          </DialogTitle>
          <DialogContent sx={{ px: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <TextField
                label="Titre de la séance"
                fullWidth
                value={zoomForm.title}
                onChange={(e) => setZoomForm({ ...zoomForm, title: e.target.value })}
                placeholder="Ex: Suivi KBIS"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={zoomForm.date}
                  onChange={(e) => setZoomForm({ ...zoomForm, date: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Heure"
                  type="time"
                  fullWidth
                  value={zoomForm.time}
                  onChange={(e) => setZoomForm({ ...zoomForm, time: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
              <TextField
                label="Lien Zoom"
                fullWidth
                value={zoomForm.link}
                onChange={(e) => setZoomForm({ ...zoomForm, link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
              {role === 'admin' && (
                <FormControl fullWidth>
                    <InputLabel>Formateur</InputLabel>
                    <Select
                        value={zoomForm.trainerId}
                        label="Formateur"
                        onChange={(e) => setZoomForm({ ...zoomForm, trainerId: e.target.value })}
                    >
                        {state.trainers.map((t) => (
                            <MenuItem key={t.userId} value={t.userId}>
                                {t.firstName} {t.lastName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
              )}
              <FormControl fullWidth>
                <InputLabel>Particpants</InputLabel>
                <Select
                  multiple
                  value={zoomForm.studentIds}
                  label="Participants"
                  onChange={(e) =>
                    setZoomForm({
                      ...zoomForm,
                      studentIds: e.target.value as string[],
                    })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((id) => {
                        const s = state.students.find((st) => st.userId === id);
                        return (
                          <Chip
                            key={id}
                            label={s ? `${s.firstName} ${s.lastName}` : id}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableStudents.map((s) => (
                    <MenuItem key={s.userId} value={s.userId}>
                      {s.firstName} {s.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ bgcolor: alpha(theme.palette.text.primary, 0.02), p: 2, borderRadius: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={zoomForm.isRecurring}
                            onChange={(e) =>
                                setZoomForm({ ...zoomForm, isRecurring: e.target.checked })
                            }
                            sx={{ borderRadius: '4px' }}
                        />
                    }
                    label={<Typography variant="labelLarge">Séance récurrente</Typography>}
                />
                {zoomForm.isRecurring && (
                    <TextField
                    label="Règle de récurrence"
                    fullWidth
                    sx={{ mt: 2 }}
                    value={zoomForm.recurrenceRule}
                    onChange={(e) =>
                        setZoomForm({ ...zoomForm, recurrenceRule: e.target.value })
                    }
                    placeholder="Ex: Tous les mardis"
                    />
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleAddZoom}
              disabled={!zoomForm.title || !zoomForm.link}
              sx={{ px: 4 }}
            >
              {isEditing ? 'Mettre à jour' : 'Créer la séance'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
