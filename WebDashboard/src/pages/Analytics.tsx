import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { analyticsApi } from '../services/api';

export default function Analytics() {
  const { data: savings, isLoading, error } = useQuery({
    queryKey: ['analytics-savings'],
    queryFn: () => analyticsApi.savings().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load analytics data</Alert>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Savings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Instances
              </Typography>
              <Typography variant="h3">{savings?.totalInstances || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Managed Instances
              </Typography>
              <Typography variant="h3">{savings?.managedInstances || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Schedules
              </Typography>
              <Typography variant="h3">{savings?.activeSchedules || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Savings
              </Typography>
              <Typography variant="h2" color="success.main">
                {formatCurrency(savings?.totalMonthlySavings || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Yearly Savings
              </Typography>
              <Typography variant="h2" color="success.main">
                {formatCurrency(savings?.totalYearlySavings || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Savings by Service
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(savings?.savingsByService || {}).map(([service, amount]) => (
                  <Box key={service} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">{service.toUpperCase()}</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Savings by Region
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(savings?.savingsByRegion || {}).map(([region, amount]) => (
                  <Box key={region} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">{region}</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
