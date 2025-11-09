import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Storage,
  Schedule as ScheduleIcon,
  Timer,
} from '@mui/icons-material';
import { analyticsApi } from '../services/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try again later.
      </Alert>
    );
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
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Storage color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Instances
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalInstances || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Scheduled Instances
                  </Typography>
                  <Typography variant="h4">
                    {stats?.scheduledInstances || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Timer color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Schedules
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeSchedules || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Monthly Savings
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats?.estimatedMonthlySavings || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instance Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Running</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.runningInstances || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Stopped</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.stoppedInstances || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.totalInstances || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Events (Next 24h)
              </Typography>
              {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Period</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.upcomingEvents.slice(0, 5).map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.action}
                            color={event.action === 'start' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{event.periodName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No upcoming events
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
