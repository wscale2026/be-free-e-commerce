import { Box, Button, Typography, Container, Stack, alpha, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import { 
  Home, 
  ArrowBack, 
  ErrorOutlined, 
  LockPerson, 
  SettingsSuggest,
  Build
} from '@mui/icons-material';

interface ErrorPageProps {
  code?: number | 'maintenance';
  message?: string;
  description?: string;
}

export default function ErrorPage({ code, message, description }: ErrorPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine error type based on code or path
  const errorCode = code || (location.pathname === '/403' ? 403 : 404);
  
  const getErrorDetails = () => {
    switch (errorCode) {
      case 403:
        return {
          title: "Accès Refusé",
          code: "403",
          desc: description || "Désolé, vous n'avez pas les permissions nécessaires pour accéder à cette ressource. Veuillez contacter l'administrateur si vous pensez que c'est une erreur.",
          icon: <LockPerson sx={{ fontSize: 80, color: '#F44336' }} />,
          bg: 'linear-gradient(135deg, #FF9E9E 0%, #FF4848 100%)'
        };
      case 500:
        return {
          title: "Erreur Serveur",
          code: "500",
          desc: description || "Oups ! Quelque chose a mal tourné de notre côté. Nos ingénieurs ont été alertés et travaillent sur le problème.",
          icon: <SettingsSuggest sx={{ fontSize: 80, color: '#9C27B0' }} />,
          bg: 'linear-gradient(135deg, #E1BEE7 0%, #9C27B0 100%)'
        };
      case 'maintenance':
        return {
          title: "Maintenance en cours",
          code: "UPDATING",
          desc: description || "Be-Free se refait une beauté ! Nous mettons à jour la plateforme pour vous offrir une meilleure expérience. Nous revenons très vite.",
          icon: <Build sx={{ fontSize: 80, color: '#1E6EF0' }} />,
          bg: 'linear-gradient(135deg, #90CAF9 0%, #1E6EF0 100%)'
        };
      default:
        return {
          title: "Page Introuvable",
          code: "404",
          desc: description || "L'adresse que vous avez saisie n'existe pas ou la page a été déplacée. Pas de panique, vous pouvez retrouver votre chemin ci-dessous.",
          icon: <ErrorOutlined sx={{ fontSize: 80, color: '#1E6EF0' }} />,
          bg: 'linear-gradient(135deg, #1E6EF0 0%, #0A2E80 100%)'
        };
    }
  };

  const details = getErrorDetails();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Abstract Background Shapes */}
      <Box sx={{ 
        position: 'absolute', 
        width: 600, 
        height: 600, 
        borderRadius: '50%', 
        background: alpha(theme.palette.primary.main, 0.05),
        top: -200, 
        right: -200,
        filter: 'blur(100px)',
        zIndex: 0
      }} />
      <Box sx={{ 
        position: 'absolute', 
        width: 400, 
        height: 400, 
        borderRadius: '50%', 
        background: alpha('#9C27B0', 0.05),
        bottom: -100, 
        left: -100,
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Be-Free"
            sx={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              mb: 1,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          />
          
          {/* Main Visual */}
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}>
            <Box sx={{ 
                position: 'absolute', 
                width: 180, 
                height: 180, 
                borderRadius: '40px', 
                background: details.bg,
                opacity: 0.1,
                transform: 'rotate(15deg)'
            }} />
            <Box sx={{ 
                position: 'absolute', 
                width: 180, 
                height: 180, 
                borderRadius: '40px', 
                background: details.bg,
                opacity: 0.05,
                transform: 'rotate(-10deg)'
            }} />
            <Box sx={{ 
                width: 140, 
                height: 140, 
                borderRadius: '35px', 
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                zIndex: 2
            }}>
                {details.icon}
            </Box>
          </Box>

          <Box>
            <Typography 
                variant="h1" 
                sx={{ 
                    fontSize: { xs: '80px', md: '120px' }, 
                    fontWeight: 900, 
                    lineHeight: 1,
                    background: details.bg,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    letterSpacing: '-5px'
                }}
            >
              {details.code}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', fontSize: { xs: '24px', md: '36px' } }}>
              {details.title}
            </Typography>
            <Typography variant="bodyLarge" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto', mb: 4, lineHeight: 1.6, fontSize: '18px' }}>
              {details.desc}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{ 
                borderRadius: '16px', 
                px: 4, 
                py: 1.5, 
                fontWeight: 800, 
                fontSize: '16px',
                background: details.bg,
                boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            >
              Retour à l'accueil
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ 
                borderRadius: '16px', 
                px: 4, 
                py: 1.5, 
                fontWeight: 700, 
                fontSize: '16px',
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                    borderColor: 'text.primary',
                    transform: 'translateY(-2px)'
                }
              }}
            >
              Page précédente
            </Button>
          </Stack>

          {/* Help Links or Footer Message */}
          <Box sx={{ pt: 6 }}>
            <Typography variant="bodySmall" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              Be-Free Platform &copy; 2026 — Tous droits réservés
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
