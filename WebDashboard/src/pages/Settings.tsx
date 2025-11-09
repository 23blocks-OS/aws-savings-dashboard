import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { configApi } from '../services/api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => configApi.get().then((res) => res.data),
  });

  const [formData, setFormData] = useState({
    tagname: config?.tagname || 'Schedule',
    default_timezone: config?.default_timezone || 'UTC',
    regions: (config?.regions || []).join(', '),
  });

  const updateMutation = useMutation({
    mutationFn: configApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate({
      tagname: formData.tagname,
      default_timezone: formData.default_timezone,
      regions: formData.regions.split(',').map((r) => r.trim()),
    });
  };

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
        Settings
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Configuration
          </Typography>

          {updateMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings updated successfully
            </Alert>
          )}

          {updateMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to update settings
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Schedule Tag Name"
                value={formData.tagname}
                onChange={(e) => setFormData({ ...formData, tagname: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Default Timezone"
                value={formData.default_timezone}
                onChange={(e) =>
                  setFormData({ ...formData, default_timezone: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Regions (comma-separated)"
                value={formData.regions}
                onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                fullWidth
                helperText="e.g., us-east-1, us-west-2, eu-west-1"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                Save Settings
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
