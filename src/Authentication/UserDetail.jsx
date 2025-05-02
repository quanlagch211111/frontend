import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ManageAccounts as RoleIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack,
  LockReset as ResetPasswordIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Edit user state
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    role: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Password reset dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // User activity
  const [userActivity, setUserActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Verify admin access
  useEffect(() => {
    if (!(currentUser?.isAdmin || currentUser?.role === 'ADMIN')) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fetch user data
  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/users/${id}`);

      if (response.data.success) {
        setUser(response.data.user);
        setUserData({
          username: response.data.user.username,
          email: response.data.user.email,
          phone: response.data.user.phone || '',
          address: response.data.user.address || '',
          avatar: response.data.user.avatar || '',
          role: response.data.user.role,
          isActive: response.data.user.isActive
        });
        setNewRole(response.data.user.role);
      } else {
        setError('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.response?.data?.message || 'Error fetching user');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user activity
  const fetchUserActivity = async () => {
    setLoadingActivity(true);

    try {
      // This endpoint would need to be implemented in your backend
      const response = await axios.get(`/api/users/${id}/activity`);

      if (response.data.success) {
        setUserActivity(response.data.activity);
      }
    } catch (err) {
      console.error('Error fetching user activity:', err);
      // Don't set error state as this is secondary data
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchUserActivity();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditing(!editing);

    // Reset form data and errors when toggling
    if (!editing) {
      setUserData({
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        role: user.role,
        isActive: user.isActive
      });
      setEditErrors({});
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;

    setUserData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error if field is updated
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate user form
  const validateUserForm = () => {
    const errors = {};

    if (!userData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!userData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email is invalid';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save user updates
  const handleSaveChanges = async () => {
    if (!validateUserForm()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await axios.put(`/api/users/${id}`, userData);

      if (response.data.success) {
        setUser(response.data.user);
        setEditing(false);
        toast.success('User updated successfully');
      } else {
        setError('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);

      // Handle specific errors from the backend
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach(errMsg => {
          if (errMsg.includes('Email')) {
            backendErrors.email = errMsg;
          } else if (errMsg.includes('Username')) {
            backendErrors.username = errMsg;
          }
        });
        setEditErrors(backendErrors);
      } else {
        setError(err.response?.data?.message || 'Error updating user');
      }
    } finally {
      setSaving(false);
    }
  };

  // Open role change dialog
  const handleRoleChangeClick = () => {
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  // Confirm role change
  const handleRoleChangeConfirm = async () => {
    if (newRole === user.role) {
      setRoleDialogOpen(false);
      return;
    }

    setChangingRole(true);

    try {
      const response = await axios.patch(`/api/users/${id}/role`, {
        role: newRole
      });

      if (response.data.success) {
        setUser(prev => ({ ...prev, role: newRole }));
        setUserData(prev => ({ ...prev, role: newRole }));
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(err.response?.data?.message || 'Error updating user role');
    } finally {
      setChangingRole(false);
      setRoleDialogOpen(false);
    }
  };

  // Open status change dialog
  const handleStatusChangeClick = () => {
    setStatusDialogOpen(true);
  };

  // Confirm status change
  const handleStatusChangeConfirm = async () => {
    const newStatus = !user.isActive;
    setChangingStatus(true);

    try {
      const response = await axios.patch(`/api/users/${id}/status`, {
        isActive: newStatus
      });

      if (response.data.success) {
        setUser(prev => ({ ...prev, isActive: newStatus }));
        setUserData(prev => ({ ...prev, isActive: newStatus }));
        const statusMessage = newStatus ? 'activated' : 'deactivated';
        toast.success(`User ${statusMessage} successfully`);
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error(err.response?.data?.message || 'Error updating user status');
    } finally {
      setChangingStatus(false);
      setStatusDialogOpen(false);
    }
  };

  // Generate random password
  const generateRandomPassword = () => {
    setGeneratingPassword(true);

    try {
      // Generate a strong random password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
      let password = '';

      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      setNewPassword(password);
    } finally {
      setGeneratingPassword(false);
    }
  };

  // Open password reset dialog
  const handlePasswordResetClick = () => {
    setNewPassword('');
    setResetPasswordDialogOpen(true);
    generateRandomPassword();
  };

  // Confirm password reset
  const handlePasswordResetConfirm = async () => {
    if (!newPassword) return;

    setResettingPassword(true);

    try {
      const response = await axios.post(`/api/users/${id}/reset-password`, {
        newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error(err.response?.data?.message || 'Error resetting password');
    } finally {
      setResettingPassword(false);
      setResetPasswordDialogOpen(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Confirm user deletion
  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      const response = await axios.delete(`/api/users/${id}`);

      if (response.data.success) {
        toast.success(`User ${user.username} deleted successfully`);
        navigate('/dashboard/admin/users');
      } else {
        toast.error('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Error deleting user');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setAvatarFile(event.target.files[0]);

      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({
          ...prev,
          avatarPreview: e.target.result
        }));
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // Add this function to handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    formData.append('userId', id); // Add user ID to determine which user's avatar to update

    try {
      // Use a different endpoint for admin to upload user avatars
      const response = await axios.post(`/api/users/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Avatar uploaded successfully');
        setUserData(prev => ({
          ...prev,
          avatar: response.data.user.avatar,
          avatarPreview: null
        }));
        setUser({
          ...user,
          avatar: response.data.user.avatar
        });
        setAvatarFile(null);
      } else {
        toast.error('Failed to upload avatar');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error(err.response?.data?.message || 'Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };


  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPPORT': return 'primary';
      case 'AGENT': return 'warning';
      default: return 'default';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="error">
        User not found
        <Button sx={{ ml: 2 }} onClick={() => navigate('/dashboard/admin/users')}>
          Back to User List
        </Button>
      </Alert>
    );
  }

  const canDelete = currentUser.id !== user._id && (user.role !== 'ADMIN' || currentUser.isSuperAdmin);
  const canChangeRole = currentUser.id !== user._id || currentUser.isSuperAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard/admin/users')}
          >
            <ArrowBack sx={{ mr: 0.5 }} fontSize="small" />
            Back to Users
          </Link>
          <Typography color="text.primary">User Details</Typography>
        </Breadcrumbs>

        <Box>
          <Button
            variant={editing ? 'outlined' : 'contained'}
            color={editing ? 'secondary' : 'primary'}
            onClick={toggleEditMode}
            sx={{ mr: 1 }}
            disabled={saving}
          >
            {editing ? 'Cancel' : 'Edit User'}
          </Button>

          {editing && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <Avatar
            src={user.avatar}
            alt={user.username}
            sx={{ width: 100, height: 100, mr: 3 }}
          >
            {user.username ? user.username.charAt(0).toUpperCase() : <PersonIcon />}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4">{user.username}</Typography>
              <Chip
                label={user.role}
                color={getRoleColor(user.role)}
                size="small"
              />
              <Chip
                label={user.isActive ? 'Active' : 'Inactive'}
                color={user.isActive ? 'success' : 'default'}
                size="small"
                icon={user.isActive ? <CheckCircleIcon /> : <BlockIcon />}
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Member since {formatDate(user.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {canChangeRole && (
              <Button
                variant="outlined"
                startIcon={<RoleIcon />}
                onClick={handleRoleChangeClick}
                size="small"
                disabled={editing}
              >
                Change Role
              </Button>
            )}

            <Button
              variant="outlined"
              color={user.isActive ? 'warning' : 'success'}
              startIcon={user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
              onClick={handleStatusChangeClick}
              size="small"
              disabled={editing || currentUser.id === user._id}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<ResetPasswordIcon />}
              onClick={handlePasswordResetClick}
              size="small"
              disabled={editing}
            >
              Reset Password
            </Button>

            {canDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                size="small"
                disabled={editing}
              >
                Delete User
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Profile Information" id="user-tab-0" />
            <Tab label="Activity" id="user-tab-1" />
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          {editing ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  error={!!editErrors.username}
                  helperText={editErrors.username}
                  disabled={saving}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleChange}
                  error={!!editErrors.email}
                  helperText={editErrors.email}
                  disabled={saving}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>User Avatar</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={userData.avatarPreview || userData.avatar}
                      alt={userData.username}
                      sx={{ width: 80, height: 80, mr: 2 }}
                    />
                    <Box>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        sx={{ mr: 1 }}
                        disabled={saving || uploadingAvatar}
                      >
                        Select Image
                      </Button>
                      {avatarFile && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleAvatarUpload}
                          disabled={saving || uploadingAvatar}
                        >
                          {uploadingAvatar ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <TextField
                    fullWidth
                    label="Avatar URL"
                    name="avatar"
                    value={userData.avatar || ''}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  disabled={saving}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userData.isActive}
                      onChange={handleChange}
                      name="isActive"
                      color="primary"
                      disabled={saving || currentUser.id === user._id}
                    />
                  }
                  label="Active Account"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1">{user.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{user.phone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Typography variant="body1">{user.role}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{user.address || 'Not provided'}</Typography>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={1}>
          {loadingActivity ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : userActivity.length > 0 ? (
            <List>
              {userActivity.map((activity, index) => (
                <ListItem key={index} divider={index < userActivity.length - 1}>
                  <ListItemText
                    primary={activity.action}
                    secondary={formatDate(activity.timestamp)}
                  />
                  <ListItemSecondaryAction>
                    <Chip label={activity.type} size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No activity recorded for this user
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Role Change Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => !changingRole && setRoleDialogOpen(false)}
      >
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a new role for "{user.username}":
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Role"
              disabled={changingRole}
            >
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="AGENT">Agent</MenuItem>
              <MenuItem value="SUPPORT">Support</MenuItem>
              {/* Only super admins can create other admins */}
              {currentUser.isSuperAdmin && <MenuItem value="ADMIN">Admin</MenuItem>}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)} disabled={changingRole}>Cancel</Button>
          <Button
            onClick={handleRoleChangeConfirm}
            color="primary"
            disabled={changingRole || newRole === user.role}
          >
            {changingRole ? <CircularProgress size={24} /> : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => !changingStatus && setStatusDialogOpen(false)}
      >
        <DialogTitle>
          {user.isActive ? 'Deactivate User' : 'Activate User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {user.isActive ? 'deactivate' : 'activate'} "{user.username}"?
            {user.isActive
              ? ' Deactivated users will not be able to log in or use the system.'
              : ' Activated users will be able to log in and use the system again.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={changingStatus}>Cancel</Button>
          <Button
            onClick={handleStatusChangeConfirm}
            color={user.isActive ? "warning" : "success"}
            disabled={changingStatus}
          >
            {changingStatus ? <CircularProgress size={24} /> : (user.isActive ? 'Deactivate' : 'Activate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => !resettingPassword && setResetPasswordDialogOpen(false)}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to reset the password for "{user.username}".
          </DialogContentText>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="New Password"
              variant="outlined"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resettingPassword || generatingPassword}
            />
            <Button
              variant="outlined"
              onClick={generateRandomPassword}
              disabled={resettingPassword || generatingPassword}
              startIcon={generatingPassword ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Generate
            </Button>
          </Box>
          <Alert severity="warning">
            Make sure to provide this password to the user securely.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)} disabled={resettingPassword}>Cancel</Button>
          <Button
            onClick={handlePasswordResetConfirm}
            color="primary"
            disabled={resettingPassword || !newPassword}
          >
            {resettingPassword ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{user.username}"? This action cannot be undone, and all associated data may be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetail;