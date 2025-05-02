import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Avatar,
  Breadcrumbs,
  Link,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flight as VisaIcon,
  Event as EventIcon,
  Description as DocumentIcon,
  Public as DestinationIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';

const VisaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [visa, setVisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const fetchVisa = async () => {
    try {
      const response = await axios.get(`/api/visa/${id}`);
      if (response.data.success) {
        setVisa(response.data.visaApplication);
      } else {
        setError('Failed to fetch visa application');
      }
    } catch (err) {
      console.error('Error fetching visa details:', err);
      setError(err.response?.data?.message || 'Error loading visa application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisa();
  }, [id]);

  const canEditVisa = () => {
    if (!visa || !currentUser) return false;
    
    const isOwner = visa.applicant._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    const isAgent = visa.agent && visa.agent._id === currentUser.id;
    
    // Allow edits if you're the applicant and status is SUBMITTED or ADDITIONAL_INFO_REQUIRED
    if (isOwner && ['SUBMITTED', 'ADDITIONAL_INFO_REQUIRED'].includes(visa.status)) {
      return true;
    }
    
    // Admins and assigned agents can always edit
    return isAdmin || isAgent;
  };

  const canDeleteVisa = () => {
    if (!visa || !currentUser) return false;
    
    const isOwner = visa.applicant._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    
    // Only allow deletion if SUBMITTED status or you're an admin
    if (isOwner && visa.status === 'SUBMITTED') {
      return true;
    }
    
    return isAdmin;
  };

  const handleEditClick = () => {
    navigate(`/dashboard/visa/edit/${id}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/visa/${id}`);
      if (response.data.success) {
        toast.success('Visa application deleted successfully');
        navigate('/dashboard/visa');
      } else {
        toast.error('Failed to delete visa application');
      }
    } catch (err) {
      console.error('Error deleting visa application:', err);
      toast.error(err.response?.data?.message || 'Error deleting visa application');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument) return;
    
    try {
      // Basic URL validation
      new URL(newDocument);
      
      setSubmittingDoc(true);
      const response = await axios.post(`/api/visa/${id}/documents`, {
        documentUrl: newDocument
      });
      
      if (response.data.success) {
        toast.success('Document added successfully');
        setVisa(response.data.visaApplication);
        setNewDocument('');
        setDocumentDialogOpen(false);
      } else {
        toast.error('Failed to add document');
      }
    } catch (err) {
      console.error('Error adding document:', err);
      toast.error(err.response?.data?.message || 'Please enter a valid URL');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleRemoveDocument = async (index) => {
    try {
      const response = await axios.delete(`/api/visa/${id}/documents/${index}`);
      if (response.data.success) {
        toast.success('Document removed successfully');
        setVisa(response.data.visaApplication);
      } else {
        toast.error('Failed to remove document');
      }
    } catch (err) {
      console.error('Error removing document:', err);
      toast.error(err.response?.data?.message || 'Error removing document');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PROCESSING': return 'info';
      case 'ADDITIONAL_INFO_REQUIRED': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!visa) {
    return <Alert severity="warning">Visa application not found</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard/visa')}
          >
            <ArrowBack sx={{ mr: 0.5 }} fontSize="small" />
            Back to Applications
          </Link>
          <Typography color="text.primary">Visa Application Details</Typography>
        </Breadcrumbs>

        {(canEditVisa() || canDeleteVisa()) && (
          <Box>
            {canEditVisa() && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
            )}
            
            {canDeleteVisa() && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip 
                    label={visa.type} 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={visa.status} 
                    color={getStatusColor(visa.status)}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DestinationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="h4" component="h1" gutterBottom>
                    {visa.destination}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">
                  Applied On
                </Typography>
                <Typography variant="body1">
                  {formatDate(visa.applicationDetails.appliedDate)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Purpose of Visit</Typography>
            <Typography paragraph>{visa.purpose}</Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Passport Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Passport Number
                    </Typography>
                    <Typography variant="body1">
                      {visa.applicationDetails.passportNumber}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Entry Type
                    </Typography>
                    <Typography variant="body1">
                      {visa.applicationDetails.entryType || 'SINGLE'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(visa.applicationDetails.issueDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Expiry Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(visa.applicationDetails.expiryDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {visa.applicationDetails.durationOfStay && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Duration of Stay
                      </Typography>
                      <Typography variant="body1">
                        {visa.applicationDetails.durationOfStay} days
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Supporting Documents</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setDocumentDialogOpen(true)}
                disabled={!canEditVisa()}
              >
                Add Document
              </Button>
            </Box>

            {visa.documents && visa.documents.length > 0 ? (
              <List>
                {visa.documents.map((doc, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      canEditVisa() && (
                        <IconButton edge="end" onClick={() => handleRemoveDocument(index)}>
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Document ${index + 1}`}
                      secondary={
                        <Link href={doc} target="_blank" rel="noopener noreferrer">
                          {doc}
                        </Link>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No documents have been uploaded yet.
              </Typography>
            )}

            {visa.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Notes</Typography>
                <Typography paragraph style={{ whiteSpace: 'pre-line' }}>
                  {visa.notes}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Applicant Information</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  {visa.applicant.username ? visa.applicant.username.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body1">{visa.applicant.username}</Typography>
                  <Typography variant="body2" color="text.secondary">Applicant</Typography>
                </Box>
              </Box>
              
              {visa.applicant.email && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Email: {visa.applicant.email}
                </Typography>
              )}
              
              {visa.applicant.phone && (
                <Typography variant="body2">
                  Phone: {visa.applicant.phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          {visa.agent && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Assigned Agent</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    {visa.agent.username ? visa.agent.username.charAt(0).toUpperCase() : 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{visa.agent.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {visa.agent.role || 'Agent'}
                    </Typography>
                  </Box>
                </Box>
                
                {visa.agent.email && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Email: {visa.agent.email}
                  </Typography>
                )}
                
                {visa.agent.phone && (
                  <Typography variant="body2">
                    Phone: {visa.agent.phone}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Application Timeline</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <EventIcon fontSize="small" color="primary" sx={{ mt: 0.5, mr: 1 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Application Submitted
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(visa.created_at)}
                    </Typography>
                  </Box>
                </Box>
                
                {visa.updated_at !== visa.created_at && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <ScheduleIcon fontSize="small" color="primary" sx={{ mt: 0.5, mr: 1 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Last Updated
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(visa.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Visa Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this visa application? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
      >
        <DialogTitle>Add Document</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the URL of the document you want to add:
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Document URL"
            value={newDocument}
            onChange={(e) => setNewDocument(e.target.value)}
            placeholder="https://example.com/document.pdf"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDocument} 
            disabled={submittingDoc || !newDocument} 
            color="primary"
          >
            {submittingDoc ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisaDetails;