import { useMemo, useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Chip, IconButton, Button, 
  Stack, Badge, Collapse, Divider, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, DialogContentText
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
    Chat, Search, DeleteSweep, Delete, KeyboardArrowDown, 
    KeyboardArrowUp, Reply, History, MarkEmailRead,
    Drafts, Mail
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import { useSearchParams } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.locale('fr');

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role } = useAuth();
  const theme = useTheme();
  const { state, sendMessage, markMessageRead, deleteMessage, deleteAllMessages, addMessage } = useMockData();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    const composeId = searchParams.get('compose');
    if (composeId) {
        setComposeTo(composeId);
        setComposeOpen(true);
        searchParams.delete('compose');
        setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const myMessages = useMemo(() => {
    if (!user) return [];
    const msgs = state.messages.filter(m => {
        if (role === 'admin') return true;
        // Show messages where the user is either the sender or the receiver
        return m.fromStudentId === user.id || m.toTrainerId === user.id;
    });
    return msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.messages, user, role]);

  const filteredMessages = useMemo(() => {
    return filter === 'unread' ? myMessages.filter(m => !m.read) : myMessages;
  }, [myMessages, filter]);

  const getParticipantName = (msg: any) => {
    const isSentByMe = msg.fromStudentId === user?.id;
    if (isSentByMe) {
        if (role === 'trainer') {
            const student = state.students.find(s => s.userId === msg.toTrainerId);
            return `Moi → ${student ? student.firstName + ' ' + student.lastName : 'Client'}`;
        }
        return `Moi → Equipe Be-Free`;
    } else {
        if (role === 'trainer') {
            const student = state.students.find(s => s.userId === msg.fromStudentId);
            return student ? `${student.firstName} ${student.lastName}` : 'Client';
        }
        return 'Equipe Be-Free';
    }
  };

  const availableRecipients = useMemo(() => {
    if (role === 'student') {
        const student = state.students.find(s => s.userId === user?.id);
        const trainer = state.trainers.find(t => t.userId === student?.trainerId);
        return trainer ? [{ id: trainer.userId, name: `${trainer.firstName} ${trainer.lastName} (Formateur)` }] : [];
    }
    if (role === 'trainer') {
        return state.students
            .filter(s => s.trainerId === user?.id)
            .map(s => ({ id: s.userId, name: `${s.firstName} ${s.lastName} (Étudiant)` }));
    }
    if (role === 'admin') {
        const allStudents = state.students.map(s => ({ id: s.userId, name: `${s.firstName} ${s.lastName} (Étudiant)` }));
        const allTrainers = state.trainers.map(t => ({ id: t.userId, name: `${t.firstName} ${t.lastName} (Formateur)` }));
        return [...allStudents, ...allTrainers];
    }
    return [];
  }, [state.students, state.trainers, user, role]);

  const handleSendMessage = () => {
    if (!composeTo || !composeSubject.trim() || !composeBody.trim()) {
      showSnackbar('Veuillez remplir tous les champs.', 'error');
      return;
    }
    if (!user?.id) return;
    
    addMessage({
      id: `m${Date.now()}`,
      fromStudentId: user.id,
      toTrainerId: composeTo,
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });
    setComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    showSnackbar('Message envoyé avec succès.', 'success');
  };

  const handleSend = () => {
    if (!newMessage.trim() || !expandedId) return;
    const msgToReply = state.messages.find(m => m.id === expandedId);
    if (!msgToReply || !user?.id) return;
    
    const isSentByMe = msgToReply.fromStudentId === user.id;
    const toId = isSentByMe ? msgToReply.toTrainerId : msgToReply.fromStudentId;

    const replyMsg = {
        from_student_id: role === 'student' ? user.id : toId,
        to_trainer_id: role === 'trainer' || role === 'admin' ? user.id : toId,
        subject: msgToReply.subject.startsWith('Re:') ? msgToReply.subject : `Re: ${msgToReply.subject}`,
        body: newMessage.trim(),
    };
    sendMessage(replyMsg);
    setNewMessage('');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <PageHeader 
            title="Messagerie"
            subtitle="Gérez vos conversations et le support client"
            breadcrumbs={[{ label: 'Espace Responsable' }, { label: 'Communications' }]}
            action={
                <Button
                    variant="contained"
                    startIcon={<Chat />}
                    onClick={() => setComposeOpen(true)}
                    sx={{ 
                        borderRadius: '14px', 
                        px: 3, py: 1.2, 
                        fontWeight: 800,
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    Nouveau Message
                </Button>
            }
        />

        {/* Action Bar */}
        <Box sx={{ 
            mb: 4, mt: 2,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            p: 1.5,
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
            <Stack direction="row" spacing={1}>
                {[
                    { key: 'all', label: 'Tous', icon: <Mail sx={{ fontSize: 18 }} /> },
                    { key: 'unread', label: 'Non lus', icon: <Drafts sx={{ fontSize: 18 }} /> }
                ].map((f) => (
                    <Button 
                        key={f.key}
                        startIcon={f.icon}
                        onClick={() => setFilter(f.key as any)}
                        sx={{ 
                            borderRadius: '12px',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 2,
                            color: filter === f.key ? 'primary.main' : 'text.secondary',
                            bgcolor: filter === f.key ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                        }}
                    >
                        {f.label}
                    </Button>
                ))}
            </Stack>

            {myMessages.length > 0 && (
                <Tooltip title="Vider la boîte de réception">
                    <IconButton 
                        color="error" 
                        onClick={() => setConfirmClearOpen(true)}
                        sx={{ borderRadius: '12px', bgcolor: alpha(theme.palette.error.main, 0.05) }}
                    >
                        <DeleteSweep />
                    </IconButton>
                </Tooltip>
            )}
        </Box>

      {filteredMessages.length === 0 ? (
        <Card sx={{ borderRadius: 1, textAlign: 'center', py: 15, border: `2px dashed ${alpha(theme.palette.divider, 0.2)}`, bgcolor: 'transparent', boxShadow: 'none' }}>
            <Box sx={{ opacity: 0.4 }}>
                <Mail sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{t('messages.title')}</Typography>
                <Typography variant="body1">Aucun message ne correspond à vos critères.</Typography>
            </Box>
        </Card>
      ) : (
        <Stack spacing={2.5}>
            {filteredMessages.map((msg) => {
              const isExpanded = expandedId === msg.id;
              const senderName = getParticipantName(msg);
              
              return (
                <Card
                    key={msg.id}
                    sx={{
                        borderRadius: 1,
                        border: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: 'background.paper',
                        boxShadow: msg.read ? '0 4px 12px rgba(0,0,0,0.03)' : `0 10px 40px ${alpha(theme.palette.primary.main, 0.08)}`,
                        borderLeft: `5px solid ${msg.read ? 'transparent' : theme.palette.primary.main}`,
                        '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
                        }
                    }}
                >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                        {/* Header Row */}
                        <Box 
                            onClick={() => {
                                setExpandedId(isExpanded ? null : msg.id);
                                if (!msg.read) markMessageRead(msg.id);
                            }}
                            sx={{ 
                                p: 3, 
                                cursor: 'pointer',
                                display: 'flex', 
                                gap: 2.5, 
                                alignItems: 'center' 
                            }}
                        >
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                color="primary"
                                invisible={msg.read}
                                sx={{ '& .MuiBadge-badge': { width: 14, height: 14, border: '3px solid white', borderRadius: '50%' } }}
                            >
                                <Avatar sx={{ 
                                    width: 56, height: 56, 
                                    borderRadius: '18px',
                                    bgcolor: msg.read ? alpha(theme.palette.primary.main, 0.1) : 'primary.main',
                                    color: msg.read ? 'primary.main' : 'white',
                                    fontWeight: 900,
                                    fontSize: '20px'
                                }}>
                                    {senderName?.[0] || '?'}
                                </Avatar>
                            </Badge>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="bodySmall" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {senderName}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.disabled' }}>
                                        <History sx={{ fontSize: 14 }} />
                                        <Typography variant="labelSmall" sx={{ fontWeight: 600 }}>
                                            {dayjs(msg.createdAt).fromNow()}
                                        </Typography>
                                    </Stack>
                                </Box>
                                <Stack spacing={0.5}>
                                    <Typography variant="titleMedium" sx={{ fontWeight: msg.read ? 600 : 900, fontSize: '18px', color: 'text.primary' }}>
                                        {msg.subject}
                                    </Typography>
                                    {!isExpanded && (
                                        <Typography variant="bodyMedium" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }} noWrap>
                                            {msg.body}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>

                            <IconButton 
                                sx={{ 
                                    display: { xs: 'none', sm: 'flex' },
                                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.3s'
                                }}
                            >
                                <KeyboardArrowDown />
                            </IconButton>
                        </Box>

                        {/* Expanded Content */}
                        <Collapse in={isExpanded}>
                            <Divider sx={{ mx: 3, opacity: 0.6 }} />
                            <Box sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                                <Typography variant="bodyLarge" sx={{ color: 'text.primary', lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 4 }}>
                                    {msg.body}
                                </Typography>

                                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                    <TextField
                                      fullWidth
                                      placeholder={t('messages.placeholder')}
                                      value={newMessage}
                                      onChange={(e) => setNewMessage(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px', bgcolor: alpha(theme.palette.text.primary, 0.03) } }}
                                    />
                                    <Button 
                                      variant="contained" 
                                      onClick={handleSend}
                                      disabled={!newMessage.trim()}
                                      sx={{ borderRadius: '20px', px: 3, fontWeight: 800, textTransform: 'none' }}
                                    >
                                      {t('messages.send')}
                                    </Button>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMessage(msg.id);
                                            showSnackbar('Conversation supprimée', 'info');
                                        }}
                                        sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 3 }}
                                    >
                                        Supprimer
                                    </Button>
                                    <IconButton 
                                        onClick={() => setExpandedId(null)}
                                        sx={{ ml: 'auto', borderRadius: '12px', bgcolor: alpha(theme.palette.text.primary, 0.05) }}
                                    >
                                        <KeyboardArrowUp />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Collapse>
                    </CardContent>
                </Card>
              );
            })}
        </Stack>
      )}

      {/* Compose Message Dialog */}
      <Dialog 
        open={composeOpen} 
        onClose={() => setComposeOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
            paper: {
                sx: { 
                    borderRadius: '24px',
                    p: 1 
                }
            }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
            Nouveau Message
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth>
                <InputLabel>Destinataire</InputLabel>
                <Select
                    value={composeTo}
                    label="Destinataire"
                    onChange={(e) => setComposeTo(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                >
                    {availableRecipients.map((rec) => (
                        <MenuItem key={rec.id} value={rec.id}>{rec.name}</MenuItem>
                    ))}
                    {availableRecipients.length === 0 && (
                        <MenuItem disabled value="">Aucun destinataire disponible</MenuItem>
                    )}
                </Select>
            </FormControl>
            <TextField
                label="Sujet"
                variant="outlined"
                fullWidth
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
            />
            <TextField
                label="Votre message"
                variant="outlined"
                fullWidth
                multiline
                rows={6}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
            />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
                onClick={() => setComposeOpen(false)} 
                sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}
            >
                Annuler
            </Button>
            <Button 
                variant="contained" 
                onClick={handleSendMessage}
                disabled={!composeTo || !composeSubject.trim() || !composeBody.trim()}
                sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}
            >
                Envoyer le message
            </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px' } } }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pt: 3 }}>
          Vider la boîte de réception
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '15px' }}>
            Êtes-vous sûr de vouloir supprimer tous vos messages ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setConfirmClearOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
                deleteAllMessages(user?.id || '');
                setConfirmClearOpen(false);
                showSnackbar('Boîte de réception vidée avec succès.', 'success');
            }} 
            sx={{ px: 3, fontWeight: 700 }}
          >
            Tout supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
