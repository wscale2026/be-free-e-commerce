import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Chip, IconButton, Button, 
  Tooltip, Grid, TextField, Stack, Badge, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, Menu, Divider, useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  PersonAdd, Search, Clear, FilterList, MoreVert, Edit, Delete, Visibility,
  Work, Lock, Person, Add, VisibilityOff, ContentCopy, Key, Close, Badge as BadgeIcon, Phone, Search as SearchIcon, TrendingUp
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';

export default function AdminTrainers() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { state, addTrainer, updateTrainer, deleteTrainer } = useMockData();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const handleDeleteTrainer = () => {
    if (deleteConfirm && window.confirm(`Supprimer définitivement le compte de ${deleteConfirm.name} ?`)) {
      deleteTrainer(deleteConfirm.id);
      showSnackbar('Compte supprimé avec succès', 'info');
      setDeleteConfirm(null);
    }
  };

  const [viewTrainer, setViewTrainer] = useState<any>(null);
  const [editTrainer, setEditTrainer] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialty: '',
  });

  const handleEditOpen = (trainer: any) => {
    setEditTrainer(trainer);
    setEditForm({
      firstName: trainer.raw.firstName,
      lastName: trainer.raw.lastName,
      email: trainer.email,
      specialty: trainer.specialty,
    });
    setMenuAnchor(null);
  };

  const handleEditSave = () => {
    // In a real app, call an API. Here we use the context.
    showSnackbar('Modifications enregistrées ✓', 'success');
    setEditTrainer(null);
  };

  const [newTrainer, setNewTrainer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialty: 'Expert E-commerce',
    customSpecialty: '',
    username: '',
    password: '',
  });

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  const generateCredentials = useCallback(() => {
     const fPart = newTrainer.firstName.trim().split(' ')[0].toLowerCase() || 'resp';
     const lPart = newTrainer.lastName.trim().split(' ')[0].toLowerCase() || 'befree';
     const username = `trainer.${fPart}.${lPart}`;
     const password = Math.random().toString(36).substring(2, 10).toUpperCase();
     setNewTrainer(prev => ({ ...prev, username, password }));
  }, [newTrainer.firstName, newTrainer.lastName]);

  const handleFirstNameChange = (val: string) => {
    const fPart = val.trim().split(' ')[0].toLowerCase() || 'resp';
    const lPart = newTrainer.lastName.trim().split(' ')[0].toLowerCase() || 'befree';
    setNewTrainer(prev => ({ 
      ...prev, 
      firstName: val, 
      username: `trainer.${fPart}.${lPart}` 
    }));
  };

  const handleLastNameChange = (val: string) => {
    const fPart = newTrainer.firstName.trim().split(' ')[0].toLowerCase() || 'resp';
    const lPart = val.trim().split(' ')[0].toLowerCase() || 'befree';
    setNewTrainer(prev => ({ 
      ...prev, 
      lastName: val, 
      username: `trainer.${fPart}.${lPart}` 
    }));
  };

  useEffect(() => {
    if (addDialogOpen && !newTrainer.username) {
        generateCredentials();
    }
  }, [addDialogOpen, generateCredentials, newTrainer.username]);

  const filteredTrainers = useMemo(() => {
    let rows = state.trainers.map(trainer => {
      const trainerStudents = state.students.filter(s => s.trainerId === trainer.userId);
      return {
        id: trainer.id,
        name: `${trainer.firstName} ${trainer.lastName}`,
        email: trainer.email,
        username: trainer.username || 'n/a',
        password: trainer.password || '********',
        specialty: trainer.specialty || 'Coach Expert',
        studentsCount: trainerStudents.length,
        totalRevenue: trainerStudents.reduce((sum, s) => sum + s.paidAmount, 0),
        raw: trainer
      };
    });

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(query) || r.email.toLowerCase().includes(query));
    }
    return rows;
  }, [state.trainers, state.students, searchQuery]);

  const handleAddTrainer = () => {
    if (!newTrainer.firstName || !newTrainer.lastName || !newTrainer.email) {
      showSnackbar('Veuillez remplir les informations obligatoires', 'error');
      return;
    }
    
    const finalSpecialty = isCustomSpecialty ? newTrainer.customSpecialty : newTrainer.specialty;
    
    const trainerToAdd = {
        id: `t${state.trainers.length + 1}`,
        firstName: newTrainer.firstName,
        lastName: newTrainer.lastName,
        email: newTrainer.email,
        username: newTrainer.username,
        password: newTrainer.password,
        specialty: finalSpecialty,
        assignedStudentIds: []
    } as any;

    addTrainer(trainerToAdd);
    showSnackbar(`Compte créé pour ${newTrainer.firstName}`, 'success');
    setAddDialogOpen(false);
    setNewTrainer({ firstName: '', lastName: '', email: '', specialty: 'Expert E-commerce', customSpecialty: '', username: '', password: '' });
    setIsCustomSpecialty(false);
  };

  const handleCopyCredentials = (trainer: any) => {
    const text = `Identifiants Be-Free\nUtilisateur : ${trainer.username}\nMot de passe : ${trainer.password}`;
    navigator.clipboard.writeText(text);
    showSnackbar('Identifiants copiés dans le presse-papier', 'success');
    setMenuAnchor(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nom du Formateur',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 1 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
            {params.row.raw.firstName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="bodyMedium" sx={{ fontWeight: 800, display: 'block' }}>{params.value}</Typography>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>{params.row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
        field: 'username',
        headerName: 'Utilisateur',
        width: 160,
        renderCell: (params) => (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Person sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="bodySmall" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{params.value}</Typography>
            </Stack>
        )
    },
    {
        field: 'password',
        headerName: 'Mot de passe',
        width: 160,
        renderCell: (params) => {
            const isVisible = visiblePasswords.has(params.row.id);
            return (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography 
                        variant="bodySmall" 
                        sx={{ 
                            fontFamily: 'monospace', 
                            letterSpacing: isVisible ? '1px' : '2px', 
                            bgcolor: alpha(theme.palette.warning.main, 0.05), 
                            p: 0.5, 
                            borderRadius: '4px',
                            minWidth: '80px'
                        }}
                    >
                        {isVisible ? params.value : '••••••••'}
                    </Typography>
                    <IconButton size="small" onClick={() => togglePasswordVisibility(params.row.id)}>
                        {isVisible ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                    </IconButton>
                </Stack>
            );
        }
    },
    {
      field: 'specialty',
      headerName: 'Spécialité',
      width: 170,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ fontWeight: 700, fontSize: '10px', bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: '8px' }} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <IconButton 
            size="small" 
            onClick={(e) => {
                setMenuAnchor(e.currentTarget);
                setSelectedTrainer(params.row);
            }}
        >
            <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 8 }}>
        <PageHeader 
            title={t('trainers.title')}
            subtitle="Visualisez et gérez les accès de vos coachs partenaires"
            breadcrumbs={[{ label: t('nav.dashboard') }, { label: t('nav.trainers') }]}
            action={
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}
              >
                {t('trainers.new')}
              </Button>
            }
        />

      <Card sx={{ p: 3, mb: 4, borderRadius: 1, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                    fullWidth
                    placeholder={t('trainers.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{ input: { startAdornment: <Search sx={{ color: 'text.disabled', mr: 1 }} />, sx: { borderRadius: '14px' } } }}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button startIcon={<FilterList />} sx={{ fontWeight: 700, color: 'text.secondary' }}>Filtres Avancés</Button>
                    <Button startIcon={<Clear />} onClick={() => setSearchQuery('')} sx={{ fontWeight: 700, color: 'text.secondary' }}>Réinitialiser</Button>
                </Stack>
            </Grid>
          </Grid>
      </Card>

      <Card sx={{ borderRadius: 1, overflow: 'hidden', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.03)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.1), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge badgeContent={filteredTrainers.length} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 900, top: 4, right: -10 } }}>
                <Typography variant="titleLarge" sx={{ fontWeight: 900 }}>Liste des Formateurs</Typography>
            </Badge>
        </Box>
        <Box sx={{ width: '100%' }}>
            <DataGrid
                rows={filteredTrainers}
                columns={columns}
                rowHeight={76}
                autoHeight
                disableRowSelectionOnClick
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.text.primary, 0.015), borderBottom: '1.5px solid', borderColor: alpha(theme.palette.divider, 0.1), fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' },
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.05) },
                    '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                }}
            />
        </Box>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 180, mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } } }}
      >
        <MenuItem onClick={() => { setViewTrainer(selectedTrainer); setMenuAnchor(null); }} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px' }}>
            <Visibility sx={{ fontSize: 18, color: 'text.secondary' }} /> Voir les détails
        </MenuItem>
        <MenuItem onClick={() => handleEditOpen(selectedTrainer)} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px' }}>
            <Edit sx={{ fontSize: 18, color: 'text.secondary' }} /> Modifier les infos
        </MenuItem>
        <MenuItem onClick={() => handleCopyCredentials(selectedTrainer)} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px', color: 'primary.main' }}>
            <ContentCopy sx={{ fontSize: 18 }} /> Copier identifiants
        </MenuItem>
        <Divider sx={{ my: 1, opacity: 0.5 }} />
        <MenuItem onClick={() => { setDeleteConfirm(selectedTrainer); setMenuAnchor(null); }} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px', color: 'error.main' }}>
            <Delete sx={{ fontSize: 18 }} /> Supprimer
        </MenuItem>
      </Menu>

      {/* View Dialog */}
      <Dialog 
        open={Boolean(viewTrainer)} 
        onClose={() => setViewTrainer(null)} 
        maxWidth="xs"
        fullWidth
        slotProps={{ 
            paper: { 
                sx: { 
                    borderRadius: '24px', 
                    p: 0,
                    overflow: 'hidden',
                    margin: { xs: 2, sm: 'auto' }
                } 
            } 
        }}
      >
        {viewTrainer && (
           <>
             <Box sx={{ bgcolor: 'primary.main', p: 4, pt: 5, position: 'relative', overflow: 'hidden' }}>
               <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { xs: 'center', sm: 'center' }, position: 'relative', zIndex: 1 }}>
                  <Avatar 
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: 'white', 
                        color: 'primary.main',
                        fontWeight: 900,
                        fontSize: '32px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: '4px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {viewTrainer.raw.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, color: 'white' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>{viewTrainer.name}</Typography>
                    <Typography variant="bodyMedium" sx={{ opacity: 0.9, fontWeight: 500 }}>{viewTrainer.email}</Typography>
                  </Box>
               </Stack>
             </Box>
             
             <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, mt: 1 }}>
               <Typography variant="labelSmall" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', mb: 3 }}>
                   Informations Clés
               </Typography>
               <Grid container spacing={2}>
                  {[
                    { label: 'Utilisateur', value: viewTrainer.username, icon: <Person sx={{ fontSize: 16 }} /> },
                    { label: 'Spécialité', value: viewTrainer.specialty, icon: <Work sx={{ fontSize: 16 }} /> },
                    { label: 'Élèves suivis', value: viewTrainer.studentsCount || 0, icon: <BadgeIcon sx={{ fontSize: 16 }} /> },
                    { label: 'Chiffre généré', value: `${viewTrainer.totalRevenue || 0} €`, icon: <TrendingUp sx={{ fontSize: 16 }} /> },
                  ].map(item => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                      <Box sx={{ 
                          p: 2, 
                          borderRadius: '16px', 
                          bgcolor: alpha(theme.palette.text.primary, 0.02), 
                          border: '1px solid', 
                          borderColor: alpha(theme.palette.divider, 0.5),
                          height: '100%'
                      }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main', mb: 1 }}>
                            {item.icon}
                            <Typography variant="labelSmall" sx={{ color: 'text.secondary', fontWeight: 700 }}>{item.label}</Typography>
                        </Stack>
                        <Typography variant="bodyLarge" sx={{ fontWeight: 800, color: 'text.primary', wordBreak: 'break-all' }}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
               </Grid>

               <Box sx={{ mt: 4, p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px dashed', borderColor: theme.palette.warning.main }}>
                  <Typography variant="bodySmall" sx={{ color: theme.palette.warning.dark, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lock sx={{ fontSize: 16 }} /> Accès sécurisé actif
                  </Typography>
               </Box>
             </DialogContent>
           </>
        )}
        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.01), borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setViewTrainer(null)} 
            sx={{ borderRadius: '12px', py: 1.5, fontWeight: 900, textTransform: 'none', fontSize: '15px' }}
          >
            Fermer la fiche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={Boolean(editTrainer)} 
        onClose={() => setEditTrainer(null)} 
        maxWidth="xs"
        fullWidth
        slotProps={{ 
            paper: { 
                sx: { 
                    borderRadius: '24px', 
                    p: 1,
                    margin: { xs: 2, sm: 'auto' }
                } 
            } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '24px', pb: 1 }}>Modifier Responsable</DialogTitle>
        {editTrainer && (
          <DialogContent>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary', mb: 3, display: 'block' }}>
                Mettez à jour les informations professionnelles de ce responsable.
            </Typography>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField fullWidth label="Prénom" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
              <TextField fullWidth label="Nom" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
              <TextField fullWidth label="Email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} slotProps={{ input: { sx: { borderRadius: '14px' } } }} />
              <FormControl fullWidth>
                  <InputLabel>Spécialité</InputLabel>
                  <Select 
                    label="Spécialité" 
                    value={editForm.specialty} 
                    onChange={e => setEditForm({...editForm, specialty: e.target.value})}
                    sx={{ borderRadius: '14px' }}
                  >
                        <MenuItem value="Expert E-commerce">Expert E-commerce</MenuItem>
                        <MenuItem value="Publicité Facebook/Google">Publicité Facebook/Google</MenuItem>
                        <MenuItem value="Copywriting Performance">Copywriting Performance</MenuItem>
                        <MenuItem value="Business Coaching">Business Coaching</MenuItem>
                  </Select>
              </FormControl>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button fullWidth onClick={() => setEditTrainer(null)} sx={{ color: 'text.secondary', fontWeight: 700, py: 1.2 }}>Annuler</Button>
          <Button fullWidth variant="contained" onClick={handleEditSave} sx={{ borderRadius: '12px', py: 1.2, fontWeight: 900, boxShadow: 'none' }}>Enregistrer les modifications</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px', p: 1 } } }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Delete sx={{ fontSize: 32 }} />
          </Box>
          <DialogTitle sx={{ fontWeight: 900, fontSize: '20px', pb: 1 }}>Supprimer le compte ?</DialogTitle>
          <DialogContent>
            <Typography variant="bodyMedium" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              Voulez-vous vraiment supprimer le compte de <strong>{deleteConfirm?.name}</strong> ?<br/>
              Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', mt: 2, pb: 2, gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: '12px', fontWeight: 700, color: 'text.secondary' }}>Annuler</Button>
            <Button fullWidth variant="contained" color="error" onClick={handleDeleteTrainer} sx={{ borderRadius: '12px', fontWeight: 800 }}>Supprimer</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ 
            paper: { 
                sx: { 
                    borderRadius: isMobile ? 0 : '24px', 
                    p: { xs: 1, sm: 2 },
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                } 
            } 
        }}
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>Nouveau Responsable</Typography>
                <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Créez un compte formateur pour votre équipe</Typography>
            </Box>
            <IconButton onClick={() => setAddDialogOpen(false)} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
                <Close />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
            <Stack spacing={4} sx={{ mt: isMobile ? 0 : 1 }}>
                {/* SECTION: IDENTITÉ */}
                <Box>
                    <Typography variant="labelLarge" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Person sx={{ fontSize: 18 }} /> Identité & Contact
                    </Typography>
                    <Stack spacing={2.5}>
                        <TextField fullWidth label="Prénom" value={newTrainer.firstName} onChange={(e) => handleFirstNameChange(e.target.value)} required slotProps={{ input: { sx: { borderRadius: '12px' } } }} />
                        <TextField fullWidth label="Nom" value={newTrainer.lastName} onChange={(e) => handleLastNameChange(e.target.value)} required slotProps={{ input: { sx: { borderRadius: '12px' } } }} />
                        <TextField fullWidth label="Email professionnel" type="email" value={newTrainer.email} onChange={(e) => setNewTrainer({...newTrainer, email: e.target.value})} required slotProps={{ input: { sx: { borderRadius: '12px' }, startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }} />
                    </Stack>
                </Box>

                {/* SECTION: ACCÈS */}
                <Box>
                    <Typography variant="labelLarge" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Key sx={{ fontSize: 18 }} /> Accès Plateforme
                    </Typography>
                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.1), borderStyle: 'dashed' }}>
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Identifiant" value={newTrainer.username} onChange={(e) => setNewTrainer({...newTrainer, username: e.target.value})} slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontFamily: 'monospace' }, startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 20 }} /></InputAdornment> } }} />
                            <TextField fullWidth label="Mot de passe" value={newTrainer.password} onChange={(e) => setNewTrainer({...newTrainer, password: e.target.value})} slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontFamily: 'monospace', fontWeight: 700 }, startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 20 }} /></InputAdornment> } }} />
                        </Stack>
                    </Card>
                </Box>

                {/* SECTION: PROFIL */}
                <Box>
                    <Typography variant="labelLarge" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Work sx={{ fontSize: 18 }} /> Profil Professionnel
                    </Typography>
                    <Stack spacing={2.5}>
                        <FormControl fullWidth>
                            <InputLabel>Spécialité principale</InputLabel>
                            <Select label="Spécialité principale" disabled={isCustomSpecialty} value={newTrainer.specialty} onChange={(e) => e.target.value === 'custom' ? setIsCustomSpecialty(true) : setNewTrainer({...newTrainer, specialty: e.target.value as string})} sx={{ borderRadius: '12px' }}>
                                <MenuItem value="Expert E-commerce">Expert E-commerce</MenuItem>
                                <MenuItem value="Publicité Facebook/Google">Publicité Facebook/Google</MenuItem>
                                <MenuItem value="Copywriting Performance">Copywriting Performance</MenuItem>
                                <MenuItem value="Business Coaching">Business Coaching</MenuItem>
                                <MenuItem value="custom" sx={{ color: 'primary.main', fontWeight: 700 }}>+ Autre spécialité...</MenuItem>
                            </Select>
                        </FormControl>
                        {isCustomSpecialty && (
                            <TextField 
                                fullWidth 
                                label="Spécifiez la spécialité" 
                                placeholder="Ex: Expert TIKTOK Ads" 
                                value={newTrainer.customSpecialty} 
                                onChange={(e) => setNewTrainer({...newTrainer, customSpecialty: e.target.value})} 
                                slotProps={{ input: { sx: { borderRadius: '12px' }, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setIsCustomSpecialty(false)} size="small"><Clear /></IconButton></InputAdornment> } }} 
                            />
                        )}
                    </Stack>
                </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setAddDialogOpen(false)} sx={{ fontWeight: 700, px: 3, color: 'text.secondary' }}>Annuler</Button>
            <Button variant="contained" onClick={handleAddTrainer} sx={{ borderRadius: '12px', px: 4, py: 1.2, fontWeight: 900, textTransform: 'none', fontSize: '15px' }}>
                Créer le responsable
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
