import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { instancesApi } from '../services/api';

export default function Instances() {
  const [serviceFilter, setServiceFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const { data: instances, isLoading } = useQuery({
    queryKey: ['instances', { service: serviceFilter, state: stateFilter }],
    queryFn: () =>
      instancesApi
        .list({
          service: serviceFilter || undefined,
          state: stateFilter || undefined,
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Instances
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Service</InputLabel>
            <Select
              value={serviceFilter}
              label="Service"
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ec2">EC2</MenuItem>
              <MenuItem value="rds">RDS</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>State</InputLabel>
            <Select
              value={stateFilter}
              label="State"
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
              <MenuItem value="available">Available</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Instance ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Region</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances?.items.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>{instance.id}</TableCell>
                  <TableCell>{instance.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={instance.service.toUpperCase()}
                      size="small"
                      color={instance.service === 'ec2' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{instance.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={instance.state}
                      size="small"
                      color={
                        instance.state === 'running' || instance.state === 'available'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {instance.schedule ? (
                      <Chip label={instance.schedule} size="small" />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Not scheduled
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{instance.region}</TableCell>
                </TableRow>
              ))}
              {instances?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">No instances found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
