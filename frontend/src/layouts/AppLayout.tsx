import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Typography, useMediaQuery, BottomNavigation,
  BottomNavigationAction, Paper, Toolbar, AppBar, Badge, Tooltip,
  Menu, MenuItem, Divider, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Button, Stack,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Dashboard, People, Videocam, AccountTree, CreditCard, Chat,
  BarChart, Settings, Logout, Menu as MenuIcon, Notifications,
  DarkMode as DarkModeIcon, LightMode as LightModeIcon,
  Search, Person, Close, Warning, Delete,
  Info, CheckCircle, Error, ChatBubble,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import type { UserRole, Notification } from '@/types';
import type { PaletteMode } from '@mui/material';
import { useLanguage } from '@/context/LanguageContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const RAIL_WIDTH = 260;
const RAIL_COLLAPSED = 88;

const getNavItems = (role: UserRole, t: (k: string) => string): NavItem[] => {
  const items: Record<UserRole, NavItem[]> = {
    trainer: [
      { label: t('nav.dashboard'), icon: Dashboard, path: '/dashboard' },
      { label: t('nav.clients'), icon: People, path: '/students' },
      { label: t('nav.zoom'), icon: Videocam, path: '/zoom' },
      { label: t('nav.reporting'), icon: BarChart, path: '/reporting' },
    ],
    student: [
      { label: t('nav.dashboard'), icon: AccountTree, path: '/dashboard' },
      { label: t('nav.zoom'), icon: Videocam, path: '/zoom' },
      { label: t('nav.payments'), icon: CreditCard, path: '/payments' },
      { label: t('nav.messages'), icon: Chat, path: '/messages' },
    ],
    admin: [
      { label: t('nav.dashboard'), icon: Dashboard, path: '/admin/dashboard' },
      { label: t('nav.clients'), icon: People, path: '/admin/users' },
      { label: t('nav.payments'), icon: CreditCard, path: '/admin/payments' },
      { label: t('nav.trainers'), icon: Person, path: '/admin/trainers' },
      { label: t('nav.settings'), icon: Settings, path: '/admin/settings' },
    ],
  };
  return role ? items[role] : [];
};

interface AppLayoutProps {
  children: React.ReactNode;
  toggleTheme: () => void;
  mode: PaletteMode;
}

export default function AppLayout({ children, toggleTheme, mode }: AppLayoutProps) {
  const { user, logout, role } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useMockData();
  const { t } = useLanguage();
  const [railCollapsed, setRailCollapsed] = useState(false);

  // States for menus and dialogs
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const unreadMessages = useMemo(() => {
    if (!user) return 0;
    // toTrainerId in the frontend maps to the `receiver` field from the backend
    return state.messages.filter(m => String(m.toTrainerId) === String(user.id) && !m.read).length;
  }, [state.messages, user]);

  const navItems = useMemo(() => role ? getNavItems(role, t) : [], [role, t]);
  const currentNavItem = navItems.find(item => item.path === location.pathname);
  const pageTitle = currentNavItem?.label ?? 'Be-Free';
  const railWidth = railCollapsed ? RAIL_COLLAPSED : RAIL_WIDTH;

  const handleNav = (path: string) => {
    navigate(path);
  };

  const handleOpenProfile = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchor(null);
  };

  const handleLogoutClick = () => {
    handleCloseProfile();
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    window.location.href = '/login';
  };

  const {
    notifications = [],
  } = state;

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  const { markNotificationRead, deleteNotification, clearAllNotifications } = useMockData();

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationClick = async (id: string, link?: string) => {
    await markNotificationRead(id);
    if (link) {
        navigate(link);
        handleCloseNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'success': return <CheckCircle sx={{ color: 'success.main' }} />;
        case 'warning': return <Warning sx={{ color: 'warning.main' }} />;
        case 'error': return <Error sx={{ color: 'error.main' }} />;
        case 'message': return <ChatBubble sx={{ color: 'primary.main' }} />;
        default: return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const logoutDialog = (
    <Dialog
      open={logoutDialogOpen}
      onClose={() => setLogoutDialogOpen(false)}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '32px',
            p: { xs: 2.5, sm: 3 },
            margin: 2,
            boxShadow: `0 24px 80px ${alpha(theme.palette.common.black, 0.15)}`,
            overflow: 'visible'
          }
        }
      }}
    >
      <IconButton 
        onClick={() => setLogoutDialogOpen(false)}
        sx={{ 
            position: 'absolute', 
            right: 16, 
            top: 16, 
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.1) }
        }}
      >
        <Close sx={{ fontSize: 20 }} />
      </IconButton>

      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '28px',
            bgcolor: alpha(theme.palette.error.main, 0.08),
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            mt: 1,
            position: 'relative'
          }}
        >
          <Logout sx={{ fontSize: 36 }} />
          <Box sx={{ 
              position: 'absolute', 
              bottom: -4, 
              right: -4, 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
              <Warning sx={{ fontSize: 16, color: 'error.main' }} />
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mb: 1.5 }}>
            {t('nav.logout')} ?
        </Typography>
        
        <Typography variant="bodyMedium" sx={{ color: 'text.secondary', lineHeight: 1.6, px: 2, mb: 4, display: 'block' }}>
          Êtes-vous sûr de vouloir quitter votre session ? Vous devrez saisir à nouveau vos identifiants pour accéder à votre espace Be-Free.
        </Typography>

        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <Button
                fullWidth
                variant="outlined"
                onClick={() => setLogoutDialogOpen(false)}
                sx={{ 
                    borderRadius: '16px', 
                    py: 1.8, 
                    fontWeight: 700, 
                    textTransform: 'none',
                    fontSize: '15px',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04), borderColor: 'text.disabled' }
                }}
            >
                Rester connecté
            </Button>
            <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleConfirmLogout}
                sx={{ 
                    borderRadius: '16px', 
                    py: 1.8, 
                    fontWeight: 900, 
                    textTransform: 'none',
                    fontSize: '15px',
                    boxShadow: `0 12px 24px ${alpha(theme.palette.error.main, 0.25)}`,
                    '&:hover': { boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.35)}` }
                }}
            >
                Se déconnecter
            </Button>
        </Stack>
      </Box>
    </Dialog>
  );

  const notificationMenu = (
    <Menu
      anchorEl={notificationAnchor}
      open={Boolean(notificationAnchor)}
      onClose={handleCloseNotifications}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            mt: 1.5,
            borderRadius: 4,
            width: { xs: '100vw', sm: 360 },
            maxHeight: 480,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 20px 40px ${alpha(theme.palette.text.primary, 0.1)}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Notifications</Typography>
        <Tooltip title="Tout supprimer">
            <IconButton size="small" color="error" onClick={() => { clearAllNotifications(); handleCloseNotifications(); }}>
                <Delete sx={{ fontSize: 20 }} />
            </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length > 0 ? (
            notifications.map((notif) => (
                <MenuItem 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif.id, notif.link)}
                    sx={{ 
                        py: 2, 
                        px: 2.5, 
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        bgcolor: notif.read ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
                        whiteSpace: 'normal',
                        alignItems: 'flex-start',
                        gap: 2,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                >
                    <Box sx={{ mt: 0.5 }}>
                        {getNotificationIcon(notif.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: notif.read ? 600 : 800, display: 'block', mb: 0.5 }}>
                            {notif.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1, lineHeight: 1.4 }}>
                            {notif.message}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '10px', fontWeight: 700 }}>
                            {dayjs(notif.createdAt).fromNow()}
                        </Typography>
                    </Box>
                    {!notif.read && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                    )}
                </MenuItem>
            ))
        ) : (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Aucune notification
                </Typography>
            </Box>
        )}
      </Box>
      {notifications.length > 0 && (
        <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button size="small" fullWidth sx={{ textTransform: 'none', fontWeight: 700 }}>
                Voir tout l'historique
            </Button>
        </Box>
      )}
    </Menu>
  );

  const profileMenu = (
    <Menu
      anchorEl={profileAnchor}
      open={Boolean(profileAnchor)}
      onClose={handleCloseProfile}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            mt: 1.5,
            borderRadius: 4,
            minWidth: 200,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 10px 30px ${alpha(theme.palette.text.primary, 0.05)}`,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderTop: `1px solid ${theme.palette.divider}`,
            },
          },
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="labelLarge" sx={{ fontWeight: 800, display: 'block' }}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
          {user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuItem onClick={() => { handleCloseProfile(); navigate('/profile'); }} sx={{ py: 1.5, gap: 2, borderRadius: 0 }}>
        <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
        <Typography variant="bodyMedium" sx={{ fontWeight: 600 }}>{t('nav.profile')}</Typography>
      </MenuItem>
      <MenuItem onClick={handleLogoutClick} sx={{ py: 1.5, gap: 2, color: 'error.main', borderRadius: 0 }}>
        <Logout sx={{ fontSize: 20 }} />
        <Typography variant="bodyMedium" sx={{ fontWeight: 700 }}>{t('nav.logout')}</Typography>
      </MenuItem>
    </Menu>
  );

  const navContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 3 }}>
      {/* Brand */}
      <Box sx={{ px: railCollapsed ? 0 : 3, mb: 4, display: 'flex', alignItems: 'center', justifyContent: railCollapsed ? 'center' : 'flex-start', gap: 2 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Be-Free"
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            objectFit: 'contain',
            flexShrink: 0,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        />
        {!railCollapsed && (
          <Typography variant="titleMedium" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: theme.palette.primary.main }}>
            BE-FREE
          </Typography>
        )}
      </Box>

      {/* Nav List */}
      <List sx={{ px: 0, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => handleNav(item.path)}
              sx={{
                mb: 1,
                mx: 2,
                borderRadius: '12px',
                justifyContent: railCollapsed ? 'center' : 'flex-start',
                px: railCollapsed ? 1 : 2,
                minHeight: 52,
                position: 'relative',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: railCollapsed ? 'auto' : -16,
                    right: railCollapsed ? -8 : 'auto',
                    top: '25%',
                    bottom: '25%',
                    width: 4,
                    bgcolor: 'primary.main',
                    borderRadius: '0 4px 4px 0',
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: railCollapsed ? 0 : 2,
                  color: isActive ? 'primary.main' : 'text.secondary',
                }}
              >
                <Badge badgeContent={item.label === 'Messages' ? unreadMessages : 0} color="error">
                  <item.icon />
                </Badge>
              </ListItemIcon>
              {!railCollapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: {
                    sx: { fontSize: '14px', fontWeight: isActive ? 700 : 500 }
                  } }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* User Info / Logout */}
      <Box sx={{ px: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton
          onClick={handleLogoutClick}
          sx={{
            borderRadius: '12px',
            color: 'error.main',
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: railCollapsed ? 0 : 2, color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          {!railCollapsed && <ListItemText primary={t('nav.logout')} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />}
        </ListItemButton>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        {logoutDialog}
        {notificationMenu}
        {profileMenu}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            height: 72,
            bgcolor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ height: '100%', justifyContent: 'space-between', px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Be-Free"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  objectFit: 'contain',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              />
              <Typography variant="titleMedium" sx={{ fontWeight: 700 }}>
                {isMobile ? pageTitle.split(' ')[0] : pageTitle}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={toggleTheme}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
              <IconButton size="small" onClick={handleOpenNotifications}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton onClick={handleOpenProfile} sx={{ ml: 0.5 }}>
                <Avatar
                    sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: 'primary.main', 
                        fontWeight: 700, 
                        fontSize: '14px',
                        boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                >
                    {user?.firstName?.[0]}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', pb: 16, pt: '72px', px: 2 }}>
          {children}
        </Box>

        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100, // Equiv to theme.zIndex.appBar
            bgcolor: alpha(theme.palette.background.default, 0.95),
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${theme.palette.divider}`,
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation
            value={location.pathname}
            onChange={(_, newValue) => handleNav(newValue)}
            showLabels
            sx={{ 
                height: 64, 
                bgcolor: 'transparent',
                '& .MuiBottomNavigationAction-root': {
                    minWidth: 0,
                    padding: '6px 0',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                        color: 'primary.main',
                        '& .MuiBottomNavigationAction-label': {
                            fontSize: '10px',
                            fontWeight: 800,
                        }
                    }
                },
                '& .MuiBottomNavigationAction-label': {
                    fontSize: '10px',
                    fontWeight: 600,
                    marginTop: '2px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                }
            }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                value={item.path}
                icon={
                  <Badge badgeContent={item.label === 'Messages' ? unreadMessages : 0} color="error">
                    <item.icon sx={{ fontSize: 22 }} />
                  </Badge>
                }
              />
            ))}
          </BottomNavigation>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {logoutDialog}
      {notificationMenu}
      {profileMenu}
      <Drawer
        variant="permanent"
        sx={{
          width: railWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: railWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
          },
        }}
      >
        {navContent}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: `calc(100% - ${railWidth}px)`,
            ml: `${railWidth}px`,
            height: 72,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Toolbar sx={{ height: '100%', justifyContent: 'space-between', px: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <IconButton onClick={() => setRailCollapsed(!railCollapsed)} sx={{ color: 'text.secondary' }}>
                <MenuIcon />
              </IconButton>
              
              <Box sx={{ position: 'relative', display: { xs: 'none', lg: 'block' } }}>
                <Search sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.disabled', fontSize: '20px' }} />
                <Box
                  component="input"
                  placeholder="Rechercher..."
                  sx={{
                    height: 44,
                    width: 300,
                    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
                    border: 'none',
                    borderRadius: '12px',
                    pl: 6,
                    pr: 2,
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    '&:focus': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'}>
                <IconButton onClick={toggleTheme}>
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleOpenNotifications}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1, cursor: 'pointer' }} onClick={handleOpenProfile}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="labelLarge" sx={{ display: 'block' }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
                    {user?.role === 'admin' ? 'Administrateur' : user?.role === 'trainer' ? 'Formateur' : 'Client'}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 4, pt: '104px', bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
