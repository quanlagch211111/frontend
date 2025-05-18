import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthProvider';
import EventNoteIcon from '@mui/icons-material/EventNote';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Tabs,
  Tab,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Business as RealEstateIcon,
  HealthAndSafety as InsuranceIcon,
  Flight as VisaIcon,
  Receipt as TaxIcon,
  Support as TicketIcon,
  Message as MessageIcon,
  AccountCircle,
  Settings,
  Logout,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Event as CalendarIcon
} from '@mui/icons-material';
import { MessageOutlined } from '@mui/icons-material';
import Dashboard from './Dashboard';

const drawerWidth = 240;

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [darkMode, setDarkMode] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Update active tab based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveTab(0);
    else if (path.includes('/dashboard/real-estate')) setActiveTab(1);
    else if (path.includes('/dashboard/insurance')) setActiveTab(2);
    else if (path.includes('/dashboard/visa')) setActiveTab(3);
    else if (path.includes('/dashboard/tax')) setActiveTab(4);
    else if (path.includes('/dashboard/tickets')) setActiveTab(5);
    else if (path.includes('/dashboard/messages')) setActiveTab(6);
    else if (path.includes('/dashboard/appointments')) setActiveTab(7);
    else if (path.includes('/dashboard/admin')) setActiveTab(8);
  }, [location]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/dashboard/profile');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/dashboard/real-estate');
        break;
      case 2:
        navigate('/dashboard/insurance');
        break;
      case 3:
        navigate('/dashboard/visa');
        break;
      case 4:
        navigate('/dashboard/tax');
        break;
      case 5:
        navigate('/dashboard/tickets');
        break;
      case 6:
        navigate('/dashboard/messages');
        break;
      case 7:
        navigate('/dashboard/appointments');
        break;
      case 8:
        navigate('/dashboard/admin');
        break;

      default:
        navigate('/dashboard');
    }
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add your dark mode implementation here
  };

  const navItems = [
    { text: 'Trang chủ', icon: <HomeIcon />, path: '/dashboard', tabIndex: 0 },
    { text: 'Bất Động Sản', icon: <RealEstateIcon />, path: '/dashboard/real-estate', tabIndex: 1 },
    { text: 'Bảo Hiểm', icon: <InsuranceIcon />, path: '/dashboard/insurance', tabIndex: 2 },
    { text: 'Dịch vụ Visa', icon: <VisaIcon />, path: '/dashboard/visa', tabIndex: 3 },
    { text: 'Dịch vụ Thuế', icon: <TaxIcon />, path: '/dashboard/tax', tabIndex: 4 },
    { text: 'Chăm sóc khách hàng', icon: <TicketIcon />, path: '/dashboard/tickets', tabIndex: 5 },
    {
      text: 'Tin nhắn',
      icon: <MessageIcon />,
      path: '/dashboard/messages',
      tabIndex: 6
    },
    {
      text: 'Lịch hẹn',
      icon: <CalendarIcon />,
      path: '/dashboard/appointments',
      tabIndex: 7
    },
  ];
  
  // Only add admin tab for admin users
  if (currentUser?.isAdmin || currentUser?.role === 'ADMIN') {
    navItems.push({
      text: 'Admin',
      icon: <Settings />,
      path: '/dashboard/admin',
      tabIndex: 8
    });
  }

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          Thái Rise
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={activeTab === item.tabIndex}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', bgcolor: darkMode ? '#121212' : '#f5f5f5' }}>
      <CssBaseline />

      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          bgcolor: darkMode ? '#1e1e1e' : 'white',
          color: darkMode ? 'white' : 'primary.main'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 0,
                mr: 2,
                display: { xs: 'flex' },
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              Thái Rise
            </Typography>

            {/* Navigation Tabs for larger screens */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 1 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="navigation tabs"
                textColor="inherit"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                {navItems.map((item) => (
                  <Tab
                    key={item.text}
                    label={item.text}
                    icon={item.icon}
                    iconPosition="start"
                    sx={{
                      minHeight: 64,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Right side of AppBar */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* User Profile */}
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                {!isMobile && (
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {currentUser?.username || 'User'}
                  </Typography>
                )}
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ p: 0 }}
                >
                  <Avatar
                    alt={currentUser?.username || 'User'}
                    src={currentUser?.avatar}
                    sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                  >
                    {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: darkMode ? '#1e1e1e' : 'white',
              color: darkMode ? 'white' : 'inherit'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            color: darkMode ? 'white' : 'inherit',
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" color={darkMode ? 'inherit' : 'primary'} />
          </ListItemIcon>
          <Typography variant="inherit">Hồ sơ cá nhân</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" color={darkMode ? 'inherit' : 'primary'} />
          </ListItemIcon>
          <Typography variant="inherit">Cài đặt</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="inherit">Đăng xuất</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        id="notifications-menu"
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            color: darkMode ? 'white' : 'inherit',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          <Button size="small" color="primary">Mark all as read</Button>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <MenuItem onClick={handleNotificationClose}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="subtitle2">Your visa application status has changed</Typography>
              <Typography variant="body2" color="text.secondary">2 minutes ago</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="subtitle2">New property listing matches your criteria</Typography>
              <Typography variant="body2" color="text.secondary">1 hour ago</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="subtitle2">Your insurance policy is up for renewal</Typography>
              <Typography variant="body2" color="text.secondary">1 day ago</Typography>
            </Box>
          </MenuItem>
        </Box>
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button fullWidth size="small">View all notifications</Button>
        </Box>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: 8,
          bgcolor: darkMode ? '#121212' : '#f5f5f5',
          color: darkMode ? 'white' : 'inherit',
          overflow: 'auto'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Dashboard />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;