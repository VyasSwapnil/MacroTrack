import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, Fab, Paper, 
  CircularProgress, Alert, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Add as AddIcon, MonitorWeight } from '@mui/icons-material';
import { fetchUsers, saveUser, saveUserWeight } from '../services/usersService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
  const [selectedUserForWeight, setSelectedUserForWeight] = useState(null);
  const [weightValue, setWeightValue] = useState('');

  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const dateKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    try {
      const newUser = { id: `user_${Date.now()}`, name: newUserName.trim() };
      await saveUser(newUser);
      setUsers([...users, newUser]);
      setIsAddUserOpen(false);
      setNewUserName('');
    } catch (err) { alert("Failed to create user."); }
  };

  const handleSaveWeight = async () => {
    if (!weightValue || !selectedUserForWeight) return;
    try {
      await saveUserWeight(selectedUserForWeight.id, dateKey, weightValue);
      await loadUsers(); // Refresh to show updated data
      setIsWeightDialogOpen(false);
      setWeightValue('');
    } catch (err) { alert("Failed to save weight."); }
  };

  const openWeightDialog = (user) => {
    setSelectedUserForWeight(user);
    setWeightValue(user.weights?.[dateKey] || '');
    setIsWeightDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Manage Users</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {users.map((user) => (
              <ListItem key={user.id} divider sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Weight: {user.weights?.[dateKey] ? `${user.weights[dateKey]} kg` : 'Not logged'}
                  </Typography>
                </Box>
                <IconButton color="primary" onClick={() => openWeightDialog(user)}>
                  <MonitorWeight />
                </IconButton>
              </ListItem>
            ))}
            {users.length === 0 && (
              <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                <Typography color="text.secondary">No users found. Create one!</Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={() => setIsAddUserOpen(true)}>
        <AddIcon />
      </Fab>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New User</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Name" variant="outlined" sx={{ mt: 1 }} value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAddUserOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Log Weight Dialog */}
      <Dialog open={isWeightDialogOpen} onClose={() => setIsWeightDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Log Weight</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Recording for {selectedUserForWeight?.name} on {todayStr}</Typography>
          <TextField autoFocus fullWidth type="number" label="Weight (kg)" variant="outlined" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsWeightDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveWeight} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}