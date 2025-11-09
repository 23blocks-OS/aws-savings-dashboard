import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { periodsApi } from '../services/api';
import type { Period } from '../types';

export default function Periods() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    begintime: '',
    endtime: '',
    weekdays: '',
    monthdays: '',
    months: '',
  });

  const queryClient = useQueryClient();

  const { data: periods, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.list().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: periodsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<Period> }) =>
      periodsApi.update(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: periodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
  });

  const handleOpenDialog = (period?: Period) => {
    if (period) {
      setEditingPeriod(period);
      setFormData({
        name: period.name,
        description: period.description || '',
        begintime: period.begintime || '',
        endtime: period.endtime || '',
        weekdays: period.weekdays || '',
        monthdays: period.monthdays || '',
        months: period.months || '',
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        name: '',
        description: '',
        begintime: '',
        endtime: '',
        weekdays: '',
        monthdays: '',
        months: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPeriod(null);
  };

  const handleSubmit = () => {
    const data = Object.fromEntries(
      Object.entries(formData).filter(([_, v]) => v !== '')
    );

    if (editingPeriod) {
      updateMutation.mutate({ name: editingPeriod.name, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (name: string) => {
    if (confirm(`Are you sure you want to delete period "${name}"?`)) {
      deleteMutation.mutate(name);
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Periods</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Period
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Begin Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Weekdays</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods?.items.map((period) => (
                <TableRow key={period.name}>
                  <TableCell>{period.name}</TableCell>
                  <TableCell>{period.description || '-'}</TableCell>
                  <TableCell>{period.begintime || '-'}</TableCell>
                  <TableCell>{period.endtime || '-'}</TableCell>
                  <TableCell>{period.weekdays || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(period)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(period.name)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {periods?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary">
                      No periods found. Create your first period to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPeriod ? 'Edit Period' : 'Create Period'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!!editingPeriod}
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
            <TextField
              label="Begin Time (HH:MM)"
              value={formData.begintime}
              onChange={(e) => setFormData({ ...formData, begintime: e.target.value })}
              placeholder="09:00"
              fullWidth
            />
            <TextField
              label="End Time (HH:MM)"
              value={formData.endtime}
              onChange={(e) => setFormData({ ...formData, endtime: e.target.value })}
              placeholder="17:00"
              fullWidth
            />
            <TextField
              label="Weekdays"
              value={formData.weekdays}
              onChange={(e) => setFormData({ ...formData, weekdays: e.target.value })}
              placeholder="Mon-Fri"
              fullWidth
            />
            <TextField
              label="Month Days"
              value={formData.monthdays}
              onChange={(e) => setFormData({ ...formData, monthdays: e.target.value })}
              placeholder="1-15"
              fullWidth
            />
            <TextField
              label="Months"
              value={formData.months}
              onChange={(e) => setFormData({ ...formData, months: e.target.value })}
              placeholder="Jan-Jun"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>
            {editingPeriod ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
