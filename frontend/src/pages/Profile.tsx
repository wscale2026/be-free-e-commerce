import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Tabs, Tab,
  TextField, Button, Switch, FormControlLabel, Divider, Grid, IconButton,
  Stack, Paper, Chip, InputAdornment, Container, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  Person, Notifications, Security, Logout, CameraAlt, 
  Email, Phone, LocationOn, LinkedIn, Public,
  Visibility, VisibilityOff, Save, CheckCircle
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import api from '@/lib/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: { xs: 4, md: 5 } }}>
      {value === index && children}
    </Box>
  );
}

export default function Profile({ toggleTheme, mode }: { toggleTheme: () => void, mode: PaletteMode }) {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    phone: user?.phone || '+33 6 12 34 56 78',
    bio: 'Business Coach & Expert E-commerce. Passionné par l\'accompagnement des nouveaux entrepreneurs.',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'www.johndoe.com'
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sessions: true,
    payments: true,
    marketing: false,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = () => {
    showSnackbar('Profil mis à jour avec succès', 'success');
  };

  const handleSavePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showSnackbar('Veuillez remplir tous les champs', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showSnackbar('Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: passwords.current,
        new_password: passwords.new
      });
      showSnackbar('Mot de passe mis à jour avec succès', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      showSnackbar(err.response?.data?.error || 'Erreur lors du changement de mot de passe', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleLabel = user?.role === 'admin' ? 'Administrateur' : user?.role === 'trainer' ? 'Formateur' : 'Client';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: alpha(theme.palette.background.default, 0.4), pb: 8 }}>
      
      {/* Profile Cover & Header Section */}
      <Box sx={{ 
          height: 180, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
          borderRadius: { xs: 0, sm: '0 0 40px 40px' },
          position: 'relative'
      }}>
          <Container maxWidth="lg" sx={{ position: 'relative', height: '100%' }}>
              <Box sx={{ 
                  position: 'absolute', 
                  bottom: -60, 
                  left: { xs: '50%', sm: 0 }, 
                  transform: { xs: 'translateX(-50%)', sm: 'none' },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'center', sm: 'flex-end' },
                  gap: 3
              }}>
                      <Box sx={{ position: 'relative' }}>
                          <Avatar
                            sx={{
                                width: 130,
                                height: 130,
                                bgcolor: 'background.paper',
                                color: 'primary.main',
                                fontSize: '48px',
                                fontWeight: 900,
                                border: '6px solid white',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                                '& .MuiAvatar-img': { borderRadius: '50%' }
                            }}
                          >
                            {user?.firstName?.[0]}
                          </Avatar>
                          <input
                            type="file"
                            id="profile-upload"
                            hidden
                            accept="image/*"
                            onChange={() => showSnackbar('Photo de profil mise à jour simulée', 'success')}
                          />
                          <label htmlFor="profile-upload">
                              <IconButton 
                                component="span"
                                size="small"
                                sx={{ 
                                    position: 'absolute', 
                                    bottom: 8, 
                                    right: 8, 
                                    bgcolor: 'white', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                }}
                              >
                                  <CameraAlt sx={{ fontSize: 18 }} />
                              </IconButton>
                          </label>
                      </Box>
                  <Box sx={{ mb: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography variant="headlineSmall" sx={{ color: { xs: 'text.primary', sm: 'white' }, fontWeight: 900, fontSize: '32px', mb: 0.5, textShadow: { xs: 'none', sm: '0 2px 4px rgba(0,0,0,0.1)' } }}>
                        {user?.firstName} {user?.lastName}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                          <Chip label={roleLabel} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Typography variant="bodyMedium" sx={{ color: { xs: 'text.secondary', sm: 'rgba(255,255,255,0.8)' }, fontWeight: 600 }}>
                            {user?.email}
                          </Typography>
                      </Stack>
                  </Box>
              </Box>
          </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        
        {/* Navigation Tabs Bar - Enhanced to match Admin Settings Style */}
        <Box sx={{ width: '100%', mb: 4, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                minHeight: 60,
                '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                },
                '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                    minWidth: 160,
                    minHeight: 60,
                    color: 'text.secondary',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                        color: 'primary.main',
                    },
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                }
            }}
          >
            <Tab icon={<Person sx={{ fontSize: 20 }} />} iconPosition="start" label={t('profile.info')} sx={{ gap: 1 }} />
            <Tab icon={<Notifications sx={{ fontSize: 20 }} />} iconPosition="start" label={t('profile.pref')} sx={{ gap: 1 }} />
            <Tab icon={<Security sx={{ fontSize: 20 }} />} iconPosition="start" label={t('profile.security')} sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 1, p: { xs: 3, md: 5 }, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
              
              <TabPanel value={activeTab} index={0}>
                  <Typography variant="titleMedium" sx={{ fontWeight: 900, mb: 4, fontSize: '22px' }}>{t('profile.personal')}</Typography>
                  <Grid container spacing={3.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label={t('profile.firstName')} value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label={t('profile.lastName')} value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label={t('profile.username')} value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px', fontFamily: 'monospace' } } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label={t('profile.email')} value={form.email} disabled slotProps={{ input: { sx: { borderRadius: '14px', bgcolor: alpha(theme.palette.text.primary, 0.02) }, startAdornment: <Email sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} /> } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label={t('profile.phone')} value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' }, startAdornment: <Phone sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} /> } }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth multiline rows={3} label={t('profile.bio')} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
                      <Typography variant="bodySmall" sx={{ mt: 1, color: 'text.secondary', display: 'block' }}>{t('profile.bio_hint')}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Profil LinkedIn" value={form.linkedin} onChange={(e) => setForm({...form, linkedin: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' }, startAdornment: <LinkedIn sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} /> } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Site Web / Portfolio" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' }, startAdornment: <Public sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} /> } }} />
                    </Grid>
                  </Grid>
                  <Button variant="contained" onClick={handleSaveProfile} sx={{ mt: 5, borderRadius: '14px', px: 6, py: 1.5, fontWeight: 800, textTransform: 'none', boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}` }}>
                    {t('profile.save')}
                  </Button>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="titleMedium" sx={{ fontWeight: 900, mb: 4, fontSize: '22px' }}>{t('profile.notifications')}</Typography>
                        <Stack spacing={4}>
                          {[
                            { id: 'email', label: t('notif.email'), desc: t('notif.email_desc') },
                            { id: 'sessions', label: t('notif.sessions'), desc: t('notif.sessions_desc') },
                            { id: 'payments', label: t('notif.payments'), desc: t('notif.payments_desc') },
                            { id: 'marketing', label: t('notif.marketing'), desc: t('notif.marketing_desc') }
                          ].map((item) => (
                            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="labelLarge" sx={{ fontWeight: 800, display: 'block' }}>{item.label}</Typography>
                                <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>{item.desc}</Typography>
                              </Box>
                              <Switch 
                                checked={notifications[item.id as keyof typeof notifications]}
                                onChange={(e) => setNotifications({...notifications, [item.id]: e.target.checked})}
                              />
                            </Box>
                          ))}
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper sx={{ p: 4, borderRadius: 1, bgcolor: alpha(theme.palette.secondary.main, 0.03), border: '1px dashed', borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
                            <Typography variant="labelLarge" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>{t('profile.system')}</Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                  <InputLabel>{t('profile.lang')}</InputLabel>
                                  <Select 
                                    sx={{ borderRadius: 1 }} 
                                    label={t('profile.lang')} 
                                    value={language}
                                    onChange={(e) => {
                                      const val = e.target.value as 'FR' | 'EN';
                                      setLanguage(val);
                                      showSnackbar(val === 'FR' ? 'Langue modifiée en Français' : 'Language changed to English', 'success');
                                    }}
                                  >
                                    <MenuItem value="FR">Français</MenuItem>
                                    <MenuItem value="EN">English</MenuItem>
                                  </Select>
                                </FormControl>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                                  <Typography variant="bodyMedium" sx={{ fontWeight: 600 }}>{t('profile.darkMode')}</Typography>
                                  <Switch 
                                    checked={mode === 'dark'}
                                    onChange={() => {
                                      toggleTheme();
                                      showSnackbar(`Mode ${mode === 'light' ? 'sombre' : 'clair'} activé`, 'info');
                                    }} 
                                  />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                  </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="titleMedium" sx={{ fontWeight: 900, mb: 4, fontSize: '22px' }}>Modifier le mot de passe</Typography>
                        <Stack spacing={3}>
                          <TextField 
                            fullWidth 
                            type={showCurrentPassword ? 'text' : 'password'} 
                            label="Mot de passe actuel" 
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            slotProps={{ input: { 
                                sx: { borderRadius: '14px' },
                                endAdornment: <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                            } }} 
                          />
                          <TextField 
                            fullWidth 
                            type={showPassword ? 'text' : 'password'} 
                            label="Nouveau mot de passe" 
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            slotProps={{ input: { 
                                sx: { borderRadius: '14px' },
                                endAdornment: <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                            } }} 
                          />
                          <TextField 
                            fullWidth 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            label="Confirmer le nouveau mot de passe" 
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            slotProps={{ input: { 
                                sx: { borderRadius: '14px' },
                                endAdornment: <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                            } }} 
                          />
                        </Stack>
                        <Button 
                          variant="contained" 
                          onClick={handleSavePassword} 
                          disabled={isChangingPassword}
                          sx={{ mt: 5, borderRadius: '14px', px: 6, py: 1.5, fontWeight: 800 }}
                        >
                          {isChangingPassword ? 'Mise à jour...' : 'Confirmer le changement'}
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 4, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.02), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                            <Typography variant="titleSmall" sx={{ fontWeight: 900, color: 'error.main', mb: 2, display: 'block' }}>Suppression de compte</Typography>
                            <Typography variant="bodySmall" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>La suppression de votre compte entraînera la perte définitive de toutes vos données coaching et historiques de vente.</Typography>
                            <Button 
                              color="error" 
                              variant="outlined" 
                              sx={{ borderRadius: '10px', textTransform: 'none' }}
                              onClick={() => setDeleteDialogOpen(true)}
                            >
                              Demander la clôture
                            </Button>
                        </Card>
                    </Grid>
                  </Grid>

                  {/* Account Deletion Dialog */}
                  <Dialog 
                    open={deleteDialogOpen} 
                    onClose={() => !isDeleting && setDeleteDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
                  >
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Box sx={{ 
                        width: 70, height: 70, borderRadius: '22px', 
                        bgcolor: alpha(theme.palette.error.main, 0.1), 
                        color: 'error.main', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', 
                        mx: 'auto', mb: 3 
                      }}>
                        <Logout sx={{ fontSize: 35 }} />
                      </Box>
                      
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Suppression Définitive</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, px: 2 }}>
                        Cette action est <strong>irréversible</strong>. Votre accès sera immédiatement coupé et vos données effacées.
                      </Typography>

                      <Stack spacing={2.5} sx={{ textAlign: 'left' }}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Votre mot de passe actuel"
                          placeholder="Confirmez votre identité"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                        />
                        <Box>
                          <Typography variant="bodySmall" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            Tapez "<strong>SUPPRIMER</strong>" pour confirmer :
                          </Typography>
                          <TextField
                            fullWidth
                            placeholder="SUPPRIMER"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px', textTransform: 'uppercase' } } }}
                          />
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          onClick={() => setDeleteDialogOpen(false)}
                          disabled={isDeleting}
                          sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700 }}
                        >
                          Annuler
                        </Button>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="error"
                          disabled={isDeleting || deleteConfirmationText !== 'SUPPRIMER' || !deletePassword}
                          onClick={async () => {
                            setIsDeleting(true);
                            try {
                              await api.post('/auth/delete-account/', { password: deletePassword });
                              showSnackbar('Compte supprimé. Redirection...', 'success');
                              setTimeout(() => logout(), 1500);
                            } catch (err: any) {
                              showSnackbar(err.response?.data?.error || 'Erreur lors de la suppression', 'error');
                            } finally {
                              setIsDeleting(false);
                            }
                          }}
                          sx={{ 
                            borderRadius: '14px', 
                            py: 1.5, 
                            fontWeight: 800,
                            boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.3)}`
                          }}
                        >
                          {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </Button>
                      </Stack>
                    </Box>
                  </Dialog>
              </TabPanel>

            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

