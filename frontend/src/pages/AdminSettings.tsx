import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Switch, FormControlLabel, Tabs, Tab, Avatar, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Stack, InputAdornment, Paper, Chip, MenuItem, Select, FormControl, InputLabel,
  Container, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Person, Security, Settings as SettingsIcon, Notifications,
  CreditCard, IntegrationInstructions, Storage, CloudUpload,
  Visibility, VisibilityOff, Save, CheckCircle,
  VpnKey, Language, Palette, Business, Videocam,
  Mail, Link, Tune, Group, AdminPanelSettings, Add,
  LocationOn, Phone, Public, Euro, AccessTime,
  FormatPaint, Email, Backup, History, Policy,
  Delete, Close,
} from '@mui/icons-material';
import { PageHeader } from '@/components/PageHeader';
import { useSnackbar } from '@/context/SnackbarContext';
import { useMockData } from '@/context/MockDataContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ py: { xs: 3, md: 5 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { showSnackbar } = useSnackbar();
  const { refreshData } = useMockData();
  const [settings, setSettings] = useState({
    default_total_due: '960',
    site_name: 'Be-Free E-commerce',
    contact_email: 'contact@befree.fr',
    contact_phone: '+33 1 23 45 67 89',
    default_due_date: '',
    // Stripe mode
    stripe_mode: 'test' as 'test' | 'live',
    // Test keys
    stripe_public_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    // Live keys
    stripe_public_key_live: '',
    stripe_secret_key_live: '',
    stripe_webhook_secret_live: '',
  });
  
  useEffect(() => {
    api.get('/settings/').then(res => {
      setSettings(prev => ({ ...prev, ...res.data }));
    }).catch(err => console.error("Error loading settings:", err));
  }, []);

  const handleUpdateSetting = async (key: string, val: any) => {
    try {
      await api.patch('/settings/', { [key]: val });
      setSettings(prev => ({ ...prev, [key]: val }));
      
      // If price changed, refresh all students to see the new totalDue
      if (key === 'default_total_due') {
        await refreshData();
      }
      
      showSnackbar('Paramètre mis à jour', 'success');
    } catch {
      showSnackbar('Erreur lors de la mise à jour', 'error');
    }
  };

  const [activeTab, setActiveTab] = useState(0);
  const [showApiKey, setShowApiKey] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
  });

  const loadAdmins = async () => {
    try {
      const res = await api.get('/users/');
      setAdmins(res.data);
    } catch (e) {
      console.error("Impossible de charger les administrateurs", e);
      showSnackbar("Impossible de charger les administrateurs", "error");
    }
  };

  useEffect(() => {
    if (activeTab === 4) {
      loadAdmins();
    }
  }, [activeTab]);

  const generateAdminCredentials = (firstName: string, lastName: string) => {
    const first = firstName.trim().split(' ')[0].toLowerCase() || 'admin';
    const last = lastName.trim().split(' ')[0].toLowerCase() || 'befree';
    return {
      username: `${first}.${last}`,
      password: Math.random().toString(36).slice(2, 10).toUpperCase(),
    };
  };

  const handleNewAdminNameChange = (field: 'first_name' | 'last_name', value: string) => {
    const next = { ...newAdmin, [field]: value };
    const credentials = generateAdminCredentials(next.first_name, next.last_name);
    setNewAdmin({ ...next, ...credentials });
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.first_name || !newAdmin.last_name || !newAdmin.email || !newAdmin.username || !newAdmin.password) {
      showSnackbar('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    try {
      await api.post('/users/', { ...newAdmin, role: 'admin' });
      showSnackbar('Administrateur créé avec succès', 'success');
      setAdminDialogOpen(false);
      setNewAdmin({ first_name: '', last_name: '', email: '', username: '', password: '' });
      await loadAdmins();
    } catch (error: any) {
      const data = error.response?.data || {};
      const raw = data.message || data.detail || data.username || data.email || "Erreur lors de la création de l'administrateur";
      showSnackbar(Array.isArray(raw) ? raw.join(' ') : raw, 'error');
    }
  };

  const handleToggleAdmin = async (admin: any) => {
    try {
      await api.patch(`/users/${admin.id}/`, { is_active: !admin.is_active });
      await loadAdmins();
      showSnackbar('Accès administrateur mis à jour', 'success');
    } catch {
      showSnackbar("Impossible de mettre à jour l'accès", 'error');
    }
  };

  const handleDeleteAdmin = async (admin: any) => {
    try {
      await api.delete(`/users/${admin.id}/`);
      setAdmins(prev => prev.filter(item => item.id !== admin.id));
      showSnackbar('Administrateur supprimé', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || "Impossible de supprimer cet administrateur", 'error');
    }
  };

  const handleSave = (section: string) => {
    showSnackbar(`Configuration mise à jour avec succès.`, 'success');
  };

  const tabs = [
    { label: 'Organisation', icon: Business },
    { label: 'Branding', icon: Palette },
    { label: 'Facturation', icon: CreditCard },
    { label: 'Communications', icon: Email },
    { label: 'Utilisateurs', icon: Group },
    { label: 'Système', icon: Storage },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: alpha(theme.palette.background.default, 0.4) }}>
      {/* Header Area */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', pt: 2, pb: 0 }}>
        <Container maxWidth="lg">
          <PageHeader
            title="Paramètres Système"
            subtitle="Configurez les options générales et gérez les accès de l'instance"
            breadcrumbs={[{ label: 'Responsable' }, { label: 'Système' }]}
            action={
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => handleSave('générale')}
                sx={{ 
                    borderRadius: '12px', 
                    px: 3, 
                    py: 1.2, 
                    fontWeight: 700, 
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}` }
                }}
              >
                Tout Enregistrer
              </Button>
            }
          />
          
          {/* Horizontal Tabs - Soft & Professional Style */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                mt: 3,
                minHeight: 50,
                '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    bgcolor: 'primary.main'
                },
                '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    minWidth: 120,
                    minHeight: 50,
                    color: 'text.secondary',
                    opacity: 0.7,
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                        color: 'primary.main',
                        opacity: 1
                    },
                    '&:hover': {
                        opacity: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                }
            }}
          >
            {tabs.map((tab, i) => (
              <Tab 
                key={i} 
                label={tab.label} 
                icon={<tab.icon sx={{ fontSize: 20 }} />} 
                iconPosition="start" 
                sx={{ gap: 1 }}
              />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* Main Content Content Container */}
      <Container maxWidth="lg">
        <Box sx={{ width: '100%', mb: 10 }}>
          
          {/* 1. Organisation Panel */}
          <TabPanel value={activeTab} index={0}>
              <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 8 }}>
                      <Card sx={{ borderRadius: 1, p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>Identité de la Plateforme</Typography>
                          <Stack spacing={3}>
                              <TextField fullWidth label="Nom de l'organisation" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} onBlur={(e) => handleUpdateSetting('site_name', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                              <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="E-mail principal" value={settings.contact_email} onChange={(e) => setSettings({...settings, contact_email: e.target.value})} onBlur={(e) => handleUpdateSetting('contact_email', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} /></Grid>
                                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Contact Support" value={settings.contact_phone} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} onBlur={(e) => handleUpdateSetting('contact_phone', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} /></Grid>
                              </Grid>
                          </Stack>
                      </Card>

                      <Card sx={{ mt: 4, borderRadius: 1, p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>Paramètres Financiers</Typography>
                          <Grid container spacing={3}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                  <TextField 
                                    fullWidth 
                                    label="Total à verser par défaut" 
                                    value={settings.default_total_due} 
                                    onChange={(e) => setSettings({...settings, default_total_due: e.target.value})}
                                    onBlur={(e) => handleUpdateSetting('default_total_due', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                                    slotProps={{
                                        input: {
                                            endAdornment: <Typography variant="subtitle2" sx={{ ml: 1, color: 'text.secondary' }}>€</Typography>
                                        }
                                    }}
                                  />
                              </Grid>
                               <Grid size={{ xs: 12, sm: 6 }}>
                                  <TextField 
                                    fullWidth 
                                    type="date"
                                    label="Date de prochaine échéance (Global)" 
                                    value={settings.default_due_date || ''} 
                                    onChange={(e) => setSettings({...settings, default_due_date: e.target.value})}
                                    onBlur={(e) => handleUpdateSetting('default_due_date', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                                    slotProps={{ inputLabel: { shrink: true } }}
                                  />
                              </Grid>
                          </Grid>
                          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', display: 'block' }}>
                              Ces valeurs seront les paramètres de base appliqués lors de la création d'un nouveau client.
                          </Typography>
                      </Card>

                      <Card sx={{ mt: 4, borderRadius: 1, p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>Localisation & Devises</Typography>
                          <Grid container spacing={3}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                      <InputLabel>Devise par défaut</InputLabel>
                                      <Select value="EUR" label="Devise par défaut">
                                          <MenuItem value="EUR">Euro (€)</MenuItem>
                                          <MenuItem value="USD">Dollar ($)</MenuItem>
                                      </Select>
                                  </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                      <InputLabel>Fuseau horaire</InputLabel>
                                      <Select value="UTC+1" label="Fuseau horaire">
                                          <MenuItem value="UTC+1">Paris (UTC+1)</MenuItem>
                                      </Select>
                                  </FormControl>
                              </Grid>
                          </Grid>
                      </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                      <Card sx={{ borderRadius: 2, p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.01), border: '1px dashed', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                          <Typography variant="subtitle2" sx={{ mb: 3, display: 'block', color: 'text.secondary' }}>Logo Officiel</Typography>
                          <Avatar 
                              sx={{ 
                                  width: 140, height: 140, borderRadius: '30%', mx: 'auto', mb: 3, 
                                  bgcolor: 'primary.main', fontSize: '48px', fontWeight: 900,
                                  boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.2)}`
                              }}
                          >
                              BF
                          </Avatar>
                          <Button variant="outlined" startIcon={<CloudUpload />} sx={{ borderRadius: '10px', textTransform: 'none' }}>Changer le logo</Button>
                      </Card>
                  </Grid>
              </Grid>
          </TabPanel>

          {/* 2. Branding Panel */}
          <TabPanel value={activeTab} index={1}>
              <Card sx={{ borderRadius: 6, p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>Identité Visuelle</Typography>
                  <Grid container spacing={4}>
                      <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, display: 'block' }}>Couleur de Marque</Typography>
                          <Stack direction="row" spacing={2}>
                              {['#2D5BFF', '#6C5DD3', '#FF754C', '#00BCD4'].map(c => (
                                  <Box key={c} sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: c, cursor: 'pointer', border: theme.palette.primary.main === c ? '4px solid white' : 'none', boxShadow: theme.palette.primary.main === c ? `0 0 0 2px ${c}` : 'none', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }} />
                              ))}
                          </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                          <FormControlLabel control={<Switch defaultChecked />} label="Activer le mode sombre automatique" />
                      </Grid>
                  </Grid>
              </Card>
          </TabPanel>

          {/* 3. Facturation Panel */}
          <TabPanel value={activeTab} index={2}>
              <Stack spacing={4}>
                {/* Mode Toggle */}
                <Card sx={{ borderRadius: 4, p: 3, border: '2px solid', borderColor: settings.stripe_mode === 'live' ? 'success.main' : 'warning.main', transition: 'border-color 0.3s' }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {settings.stripe_mode === 'live' ? '🟢 Mode Production (LIVE)' : '🟡 Mode Sandbox (TEST)'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {settings.stripe_mode === 'live'
                          ? 'Les vrais paiements sont encaissés. Utilisez vos clés pk_live_ / sk_live_.'
                          : 'Mode test actif. Aucun paiement réel. Utilisez vos clés pk_test_ / sk_test_.'}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.stripe_mode === 'live'}
                          onChange={(e) => {
                            const newMode = e.target.checked ? 'live' : 'test';
                            setSettings(prev => ({ ...prev, stripe_mode: newMode }));
                            handleUpdateSetting('stripe_mode', newMode);
                          }}
                          color="success"
                        />
                      }
                      label={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{settings.stripe_mode === 'live' ? 'Live' : 'Test'}</Typography>}
                      labelPlacement="start"
                    />
                  </Stack>
                </Card>

                {/* Test / Sandbox Keys */}
                <Card sx={{ borderRadius: 4, p: 4, opacity: settings.stripe_mode === 'live' ? 0.5 : 1, transition: 'opacity 0.3s', border: '1px solid', borderColor: alpha('#F59E0B', 0.4), bgcolor: alpha('#FFF7ED', 0.5) }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
                    <Chip label="SANDBOX" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '11px' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Clés de Test (pk_test_ / sk_test_)</Typography>
                  </Stack>
                  <Stack spacing={3}>
                    <TextField fullWidth label="Clé Publique (Publishable)" value={settings.stripe_public_key}
                      onChange={(e) => setSettings({ ...settings, stripe_public_key: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_public_key', e.target.value)}
                      placeholder="pk_test_..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth label="Clé Secrète" type={showApiKey ? 'text' : 'password'} value={settings.stripe_secret_key}
                      onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_secret_key', e.target.value)}
                      placeholder="sk_test_..."
                      slotProps={{ input: { endAdornment: <IconButton onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <VisibilityOff /> : <Visibility />}</IconButton> } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth label="Secret Webhook" type={showApiKey ? 'text' : 'password'} value={settings.stripe_webhook_secret}
                      onChange={(e) => setSettings({ ...settings, stripe_webhook_secret: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_webhook_secret', e.target.value)}
                      placeholder="whsec_..."
                      helperText="Requis pour la synchronisation automatique des paiements via Stripe Webhooks."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Stack>
                </Card>

                {/* Live / Production Keys */}
                <Card sx={{ borderRadius: 4, p: 4, opacity: settings.stripe_mode === 'test' ? 0.5 : 1, transition: 'opacity 0.3s', border: '2px solid', borderColor: settings.stripe_mode === 'live' ? 'success.main' : alpha('#22C55E', 0.2), bgcolor: alpha('#F0FDF4', 0.5) }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
                    <Chip label="PRODUCTION" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '11px' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Clés de Production (pk_live_ / sk_live_)</Typography>
                  </Stack>
                  <Stack spacing={3}>
                    <TextField fullWidth label="Clé Publique Live (Publishable)" value={settings.stripe_public_key_live}
                      onChange={(e) => setSettings({ ...settings, stripe_public_key_live: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_public_key_live', e.target.value)}
                      placeholder="pk_live_..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth label="Clé Secrète Live" type={showApiKey ? 'text' : 'password'} value={settings.stripe_secret_key_live}
                      onChange={(e) => setSettings({ ...settings, stripe_secret_key_live: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_secret_key_live', e.target.value)}
                      placeholder="sk_live_..."
                      slotProps={{ input: { endAdornment: <IconButton onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <VisibilityOff /> : <Visibility />}</IconButton> } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth label="Secret Webhook Live" type={showApiKey ? 'text' : 'password'} value={settings.stripe_webhook_secret_live}
                      onChange={(e) => setSettings({ ...settings, stripe_webhook_secret_live: e.target.value })}
                      onBlur={(e) => handleUpdateSetting('stripe_webhook_secret_live', e.target.value)}
                      placeholder="whsec_..."
                      helperText="Webhook de production. Configurez-le dans votre tableau de bord Stripe → Développeurs → Webhooks."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Stack>
                </Card>
              </Stack>
          </TabPanel>

          {/* 4. Communications Panel */}
          <TabPanel value={activeTab} index={3}>
              <Stack spacing={4}>

                {/* Header info */}
                <Card sx={{ borderRadius: 4, p: 3, bgcolor: alpha(theme.palette.info.main, 0.04), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.15) }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                    <Mail sx={{ color: 'info.main', mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Configuration SMTP — E-mails sortants</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        Ces paramètres sont utilisés pour tous les e-mails envoyés par Be-Free (notifications, confirmations, mots de passe...).
                        Si les champs sont vides, les valeurs du fichier <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>.env</code> sont utilisées automatiquement.
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Quick Presets */}
                <Card sx={{ borderRadius: 4, p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'block', color: 'text.secondary' }}>
                    Raccourcis — Fournisseurs courants
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {[
                      { label: 'Gmail', host: 'smtp.gmail.com', port: 587, tls: true },
                      { label: 'Outlook / Hotmail', host: 'smtp.office365.com', port: 587, tls: true },
                      { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, tls: true },
                      { label: 'OVH', host: 'ssl0.ovh.net', port: 465, tls: false },
                      { label: 'Brevo (ex-Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, tls: true },
                    ].map((preset) => (
                      <Chip
                        key={preset.label}
                        label={preset.label}
                        variant="outlined"
                        clickable
                        onClick={() => {
                          const updated = { ...settings, email_host: preset.host, email_port: preset.port, email_use_tls: preset.tls };
                          setSettings(updated as any);
                          handleUpdateSetting('email_host', preset.host);
                          handleUpdateSetting('email_port', preset.port);
                          handleUpdateSetting('email_use_tls', preset.tls);
                        }}
                        sx={{ borderRadius: '10px', fontWeight: 700 }}
                      />
                    ))}
                  </Stack>
                </Card>

                {/* SMTP Fields */}
                <Card sx={{ borderRadius: 4, p: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Paramètres du serveur SMTP</Typography>
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          fullWidth label="Serveur SMTP (Host)"
                          value={(settings as any).email_host || ''}
                          onChange={(e) => setSettings({ ...settings, email_host: e.target.value } as any)}
                          onBlur={(e) => handleUpdateSetting('email_host', e.target.value)}
                          placeholder="smtp.gmail.com"
                          helperText="Adresse du serveur SMTP de votre fournisseur"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth label="Port"
                          type="number"
                          value={(settings as any).email_port || ''}
                          onChange={(e) => setSettings({ ...settings, email_port: e.target.value } as any)}
                          onBlur={(e) => handleUpdateSetting('email_port', Number(e.target.value))}
                          placeholder="587"
                          helperText="587 (TLS) ou 465 (SSL)"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                      </Grid>
                    </Grid>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean((settings as any).email_use_tls ?? true)}
                          onChange={(e) => {
                            setSettings({ ...settings, email_use_tls: e.target.checked } as any);
                            handleUpdateSetting('email_use_tls', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>Activer TLS / STARTTLS</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Recommandé. Chiffre la connexion (port 587). Désactivez uniquement si vous utilisez SSL direct (port 465).</Typography>
                        </Box>
                      }
                    />

                    <TextField
                      fullWidth label="Adresse e-mail d'expédition"
                      type="email"
                      value={(settings as any).email_host_user || ''}
                      onChange={(e) => setSettings({ ...settings, email_host_user: e.target.value } as any)}
                      onBlur={(e) => handleUpdateSetting('email_host_user', e.target.value)}
                      placeholder="no-reply@befree.fr"
                      helperText="Compte e-mail utilisé pour se connecter au serveur SMTP"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />

                    <TextField
                      fullWidth label="Mot de passe SMTP"
                      type={showApiKey ? 'text' : 'password'}
                      value={(settings as any).email_host_password || ''}
                      onChange={(e) => setSettings({ ...settings, email_host_password: e.target.value } as any)}
                      onBlur={(e) => handleUpdateSetting('email_host_password', e.target.value)}
                      placeholder="Mot de passe ou App Password (Google)"
                      helperText="Pour Gmail, créez un App Password sur myaccount.google.com → Sécurité → Mots de passe des applications"
                      slotProps={{ input: { endAdornment: <IconButton onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <VisibilityOff /> : <Visibility />}</IconButton> } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />

                    <TextField
                      fullWidth label="Nom et adresse d'expédition (From)"
                      value={(settings as any).default_from_email || ''}
                      onChange={(e) => setSettings({ ...settings, default_from_email: e.target.value } as any)}
                      onBlur={(e) => handleUpdateSetting('default_from_email', e.target.value)}
                      placeholder='Be-Free <no-reply@befree.fr>'
                      helperText='Format : "Nom affiché <adresse@email.fr>" — visible par le destinataire'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Stack>
                </Card>

                {/* Test Email */}
                <Card sx={{ borderRadius: 4, p: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Tester la configuration</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Envoie un e-mail de test pour vérifier que votre configuration SMTP fonctionne correctement.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      fullWidth label="Adresse e-mail de test"
                      type="email"
                      value={(settings as any)._testEmailRecipient || ''}
                      onChange={(e) => setSettings({ ...settings, _testEmailRecipient: e.target.value } as any)}
                      placeholder="votre.email@exemple.fr"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <Button
                      variant="contained"
                      sx={{ borderRadius: '12px', px: 4, py: 1.4, fontWeight: 800, whiteSpace: 'nowrap', minWidth: 180 }}
                      onClick={async () => {
                        const recipient = (settings as any)._testEmailRecipient;
                        if (!recipient) { showSnackbar("Saisissez une adresse e-mail de test.", "error"); return; }
                        try {
                          const res = await api.post('/test-email/', { recipient });
                          showSnackbar(`✅ ${res.data.message}`, 'success');
                        } catch (err: any) {
                          showSnackbar(`❌ ${err.response?.data?.error || 'Erreur lors de l\'envoi.'}`, 'error');
                        }
                      }}
                    >
                      📧 Envoyer le test
                    </Button>
                  </Stack>
                </Card>

              </Stack>
          </TabPanel>


          {/* 5. Utilisateurs Panel */}
          <TabPanel value={activeTab} index={4}>
              <Card sx={{ borderRadius: { xs: 2, sm: 1 }, p: 0, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3, md: 4 },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 1.5 },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'center' },
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, display: 'block' }}>Équipe d'Administration</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{admins.length} compte(s) administrateur</Typography>
                    </Box>
                      <Button
                        variant="contained"
                        size={isMobile ? 'medium' : 'small'}
                        startIcon={<Add />}
                        onClick={() => {
                          setNewAdmin({ first_name: '', last_name: '', email: '', ...generateAdminCredentials('', '') });
                          setAdminDialogOpen(true);
                        }}
                        fullWidth={isMobile}
                        sx={{ borderRadius: '10px', minHeight: 40 }}
                      >
                        Nouvel administrateur
                      </Button>
                  </Box>
                  <List disablePadding sx={{ p: { xs: 1.5, sm: 0 } }}>
                      {admins.length === 0 ? (
                        <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                          <Avatar sx={{ mx: 'auto', mb: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                            <Group />
                          </Avatar>
                          <Typography sx={{ fontWeight: 800 }}>Aucun administrateur trouvé.</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Créez un premier accès pour gérer ce compte.</Typography>
                        </Box>
                      ) : (
                        admins.map((admin) => (
                          <ListItem
                            key={admin.id}
                            sx={{
                              p: { xs: 2, sm: 3 },
                              mb: { xs: 1.5, sm: 0 },
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'stretch', sm: 'center' },
                              gap: { xs: 2, sm: 1.5 },
                              borderBottom: { xs: 'none', sm: '1px solid' },
                              borderColor: 'divider',
                              borderRadius: { xs: 2, sm: 0 },
                              bgcolor: { xs: alpha(theme.palette.background.paper, 0.9), sm: 'transparent' },
                              boxShadow: { xs: '0 4px 18px rgba(0,0,0,0.04)', sm: 'none' }
                            }}
                          >
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                              <ListItemIcon sx={{ minWidth: 0 }}>
                                <Avatar sx={{ width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 }, borderRadius: '12px', bgcolor: 'primary.main', flexShrink: 0 }}>
                                  {admin.first_name?.[0] || admin.username?.[0]?.toUpperCase() || 'A'}
                                </Avatar>
                              </ListItemIcon>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {`${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' }, wordBreak: 'break-word' }}>
                                  {admin.email || 'Aucun email'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {admin.username}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems: 'center',
                                justifyContent: { xs: 'space-between', sm: 'flex-end' },
                                width: { xs: '100%', sm: 'auto' },
                                flexShrink: 0,
                                pt: { xs: 1.5, sm: 0 },
                                borderTop: { xs: '1px solid', sm: 'none' },
                                borderColor: 'divider'
                              }}
                            >
                              <Chip
                                label={admin.is_active ? 'Actif' : 'Désactivé'}
                                size="small"
                                color={admin.is_active ? 'success' : 'default'}
                                sx={{ borderRadius: '6px', fontWeight: 800 }}
                              />
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                <Switch
                                  checked={Boolean(admin.is_active)}
                                  onChange={() => handleToggleAdmin(admin)}
                                  size="small"
                                  slotProps={{ input: { 'aria-label': 'Activer ou désactiver administrateur' } }}
                                />
                                <IconButton color="error" onClick={() => handleDeleteAdmin(admin)} size={isMobile ? 'small' : 'medium'}>
                                  <Delete />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </ListItem>
                        ))
                      )}
                  </List>
              </Card>

              <Dialog
                open={adminDialogOpen}
                onClose={() => setAdminDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: isMobile ? 0 : '20px',
                      m: { xs: 0, sm: 2 },
                    }
                  }
                }}
              >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2.5, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Nouvel administrateur</Typography>
                  <IconButton onClick={() => setAdminDialogOpen(false)}>
                    <Close />
                  </IconButton>
                </DialogTitle>
		                <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
		                  <Stack spacing={{ xs: 3, sm: 4 }} sx={{ mt: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Person sx={{ fontSize: 18 }} /> Identité & Contact
                        </Typography>
  	                    <Stack spacing={2.5}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                required
                                label="Prénom"
                                value={newAdmin.first_name}
                                onChange={(e) => handleNewAdminNameChange('first_name', e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                required
                                label="Nom"
                                value={newAdmin.last_name}
                                onChange={(e) => handleNewAdminNameChange('last_name', e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                              />
                            </Grid>
                          </Grid>
                          <TextField
                            fullWidth
                            required
                            label="Email professionnel"
                            type="email"
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                            slotProps={{
                              input: {
                                sx: { borderRadius: '12px' },
                                startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>
                              }
                            }}
                          />
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <VpnKey sx={{ fontSize: 18 }} /> Accès Plateforme
                        </Typography>
                        <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.1), borderStyle: 'dashed' }}>
                          <Stack spacing={2.5}>
                            <TextField
                              fullWidth
                              required
                              label="Identifiant"
                              value={newAdmin.username}
                              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                              slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontFamily: 'monospace' } } }}
                            />
                            <TextField
                              fullWidth
                              required
                              label="Mot de passe"
                              value={newAdmin.password}
                              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                              slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontWeight: 700, fontFamily: 'monospace' } } }}
                            />
                          </Stack>
                        </Card>
                      </Box>
		                  </Stack>
		                </DialogContent>
                <DialogActions sx={{ p: { xs: 2.5, sm: 3 }, pt: 1, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                  <Button fullWidth={isMobile} onClick={() => setAdminDialogOpen(false)}>Annuler</Button>
                  <Button fullWidth={isMobile} variant="contained" onClick={handleCreateAdmin}>Créer l'accès</Button>
                </DialogActions>
              </Dialog>
          </TabPanel>

          {/* 6. Système Panel */}
          <TabPanel value={activeTab} index={5}>
              <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ borderRadius: 6, p: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Sauvegardes</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>Dernière sauvegarde Cloud effectuée avec succès il y a 4 heures.</Typography>
                          <Button variant="outlined" startIcon={<Backup />} sx={{ borderRadius: '10px' }}>Lancer un backup manuel</Button>
                      </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                       <Card sx={{ borderRadius: 1, p: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Version</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>v2.4.1 Stable</Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Uptime: 99.9% • API: Connecté</Typography>
                      </Card>
                  </Grid>
              </Grid>
          </TabPanel>

        </Box>
      </Container>
    </Box>
  );
}
