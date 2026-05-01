import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { NavigateNext } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {breadcrumbs && (
          <Breadcrumbs
            separator={<NavigateNext sx={{ fontSize: '14px', color: 'text.disabled' }} />}
            sx={{ mb: 1 }}
          >
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                underline="hover"
                color={index === breadcrumbs.length - 1 ? 'text.secondary' : 'text.disabled'}
                sx={{
                  fontSize: '13px',
                  fontWeight: 500,
                  pointerEvents: index === breadcrumbs.length - 1 ? 'none' : 'auto',
                }}
                href={crumb.href || '#'}
              >
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        )}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box
          sx={{
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
}
