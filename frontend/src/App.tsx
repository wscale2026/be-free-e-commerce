import { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MockDataProvider } from '@/context/MockDataContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AppLayout from '@/layouts/AppLayout';
import Login from '@/pages/Login';
import TrainerKanban from '@/pages/TrainerKanban';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminPayments from '@/pages/AdminPayments';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminTrainers from '@/pages/AdminTrainers';
import ZoomPlanning from '@/pages/ZoomPlanning';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import StudentPayments from '@/pages/StudentPayments';
import StudentsList from '@/pages/StudentsList';
import Reporting from '@/pages/Reporting';
import AdminSettings from '@/pages/AdminSettings';
import ErrorPage from '@/pages/ErrorPage';
import PaymentSuccess from '@/pages/PaymentSuccess';
import MessagingWidget from '@/components/MessagingWidget';
import LandingHome from '@/landing/pages/Home';
import { getBeFreeTheme } from '@/theme';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const cache = createCache({
  key: 'css',
  prepend: true,
});

function DashboardRouter() {
  const { role } = useAuth();
  if (role === 'trainer') return <TrainerKanban />;
  if (role === 'student') return <StudentDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" />;
}

function ProtectedRoute({ children, toggleTheme, mode }: { children: React.ReactNode, toggleTheme: () => void, mode: PaletteMode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <AppLayout toggleTheme={toggleTheme} mode={mode}>{children}</AppLayout>;
}

function AppRoutes({ toggleTheme, mode }: { toggleTheme: () => void, mode: PaletteMode }) {
  const { user, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingHome />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'trainer' ? <StudentsList /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/zoom"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            <ZoomPlanning />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reporting"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'trainer' ? <Reporting /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'student' ? <StudentPayments /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trainers"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'admin' ? <AdminTrainers /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'admin' ? <AdminPayments /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'admin' ? <AdminUsers /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            {role === 'admin' ? <AdminSettings /> : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route path="/profile"
        element={
          <ProtectedRoute toggleTheme={toggleTheme} mode={mode}>
            <Profile toggleTheme={toggleTheme} mode={mode} />
          </ProtectedRoute>
        }
      />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/403" element={<ErrorPage code={403} />} />
      <Route path="/500" element={<ErrorPage code={500} />} />
      <Route path="/maintenance" element={<ErrorPage code="maintenance" />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  );
}

export default function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    return (localStorage.getItem('themeMode') as PaletteMode) || 'light';
  });

  const theme = useMemo(() => getBeFreeTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <LanguageProvider>
            <MockDataProvider>
              <SnackbarProvider>
                <AppRoutes toggleTheme={toggleTheme} mode={mode} />
                <MessagingWidget />
              </SnackbarProvider>
            </MockDataProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
