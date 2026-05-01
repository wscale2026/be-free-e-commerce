import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Card, Typography, Button, Container, TextField, 
  InputAdornment, IconButton, CircularProgress, Stack
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useAuth } from '@/context/AuthContext';
import { alpha, useTheme } from '@mui/material/styles';

export default function Login() {
  const { login } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Identifiants ou mot de passe incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.mode === 'dark' ? '#0F1117' : '#F4F7FE',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic Background Elements */}
      <Box sx={{ position: 'absolute', top: { xs: '-5%', md: '5%' }, left: { xs: '-10%', md: '10%' }, width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`, filter: 'blur(60px)', zIndex: 0, animation: 'float 6s ease-in-out infinite' }} />
      <Box sx={{ position: 'absolute', bottom: { xs: '-5%', md: '5%' }, right: { xs: '-10%', md: '10%' }, width: { xs: 250, md: 400 }, height: { xs: 250, md: 400 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`, filter: 'blur(50px)', zIndex: 0, animation: 'float 8s ease-in-out infinite reverse' }} />

      <Container maxWidth="xs" sx={{ zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Box
                sx={{
                width: 80,
                height: 80,
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                mx: 'auto',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                transform: 'rotate(-5deg)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'rotate(0deg) scale(1.05)' }
                }}
            >
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, fontSize: '32px', letterSpacing: '-1.5px', lineHeight: 1 }}>BF</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.5px' }}>
                BE-FREE
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Accédez à votre espace sécurisé
            </Typography>
        </Box>

        <Card
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: { xs: 4, sm: 6 },
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.05)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.02)}`,
          }}
        >
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}>Identifiant</Typography>
              <TextField
                fullWidth
                placeholder="Entrez votre identifiant"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlinedIcon sx={{ color: username ? 'primary.main' : 'text.disabled', transition: 'color 0.3s' }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '16px', 
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      '& fieldset': { borderColor: alpha(theme.palette.divider, 0.1) },
                      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' }
                    }
                  }
                }}
              />
            </Stack>
            
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}>Mot de passe</Typography>
              <TextField
                fullWidth
                placeholder="Entrez votre mot de passe"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: password ? 'primary.main' : 'text.disabled', transition: 'color 0.3s' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setShowPassword(!showPassword)} 
                          edge="end"
                          sx={{ color: showPassword ? 'primary.main' : 'text.disabled' }}
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '16px', 
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      '& fieldset': { borderColor: alpha(theme.palette.divider, 0.1) },
                      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' }
                    }
                  }
                }}
              />
            </Stack>

            {error && (
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(theme.palette.error.main, 0.1), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                <Typography variant="bodySmall" color="error" sx={{ textAlign: 'center', fontWeight: 600, display: 'block' }}>
                  {error}
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.8,
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '15px',
                mt: 1,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.6)}`,
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se Connecter'}
            </Button>
          </form>
        </Card>

        <Box sx={{ mt: 5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: '1px' }}>
                BE-FREE PLATFORM © 2026
            </Typography>
        </Box>
      </Container>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}
      </style>
    </Box>
  );
}
