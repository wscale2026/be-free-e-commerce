import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { 
  Box, Container, Typography, Card, Button, 
  CircularProgress, Stack, alpha, useTheme 
} from '@mui/material';
import { CheckCircle2, ArrowRight, LogIn, Lock, Mail } from 'lucide-react';
import api from '@/lib/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const sessionId = searchParams.get('session_id');
  const email = searchParams.get('email');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Session de paiement introuvable.");
      setLoading(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await api.post('/confirm-checkout-session/', {
          session_id: sessionId
        });
        
        if (response.data.success) {
          setStudentData(response.data.student);
        } else {
          setError(response.data.error || "Une erreur est survenue lors de la confirmation.");
        }
      } catch (err: any) {
        console.error("Payment Confirmation Error:", err);
        setError(err.response?.data?.error || "Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Confirmation de votre paiement...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="sm">
        <Card sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: 6, 
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Be-Free"
            sx={{
              width: 60,
              height: 60,
              borderRadius: '16px',
              mx: 'auto',
              mb: 4,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          />
          {error ? (
            <>
              <Box sx={{ w: 80, h: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3">!</Typography>
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>Oups !</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>{error}</Typography>
              <Button variant="outlined" onClick={() => navigate('/')} fullWidth sx={{ py: 1.5, borderRadius: 3 }}>
                Retour à l'accueil
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ color: 'success.main', mb: 3 }}>
                <CheckCircle2 size={80} strokeWidth={1.5} />
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                Paiement Réussi !
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.1rem' }}>
                Bienvenue dans l'écosystème <strong>Be-Free</strong>. Votre compte a été créé avec succès.
              </Typography>

              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05), 
                borderRadius: 4, 
                p: 3, 
                mb: 5, 
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                textAlign: 'left'
              }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  Vos identifiants de connexion :
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <Mail size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1 }}>Nom d'utilisateur</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{studentData?.user?.username || "Génération..."}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <Lock size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1 }}>Mot de passe temporaire</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>Befree2026</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Stack spacing={2}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large"
                  onClick={() => navigate('/login')}
                  startIcon={<LogIn size={20} />}
                  sx={{ 
                    py: 2, 
                    borderRadius: 4, 
                    fontWeight: 800,
                    boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  Se connecter maintenant
                </Button>
                <Typography variant="caption" color="text.disabled">
                  Vous recevrez également ces informations par email.
                </Typography>
              </Stack>
            </>
          )}
        </Card>
      </Container>
    </Box>
  );
}
