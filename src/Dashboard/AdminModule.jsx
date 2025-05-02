import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import UserDetail from '../Authentication/UserDetail';
import PropertyManagement from './PropertyManagement';
import InsuranceManagement from './InsuranceManagement';
import VisaManagement from './VisaManagement';
import TaxManagement from './TaxManagement';
import TicketManagement from './TicketManagement';
import AppointmentManagement from './AppointmentManagement';
// import SystemSettings from './SystemSettings';

const AdminModule = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/users/:id" element={<UserDetail />} />
      <Route path="/properties" element={<PropertyManagement />} />
      <Route path="/insurance" element={<InsuranceManagement />} />
      <Route path="/visa" element={<VisaManagement />} />
      <Route path="/tax" element={<TaxManagement />} />
      <Route path="/tickets" element={<TicketManagement />} />
      <Route path="/appointments" element={<AppointmentManagement />} />
      {/* <Route path="/settings" element={<SystemSettings />} /> */}
      <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
    </Routes>
  );
};

export default AdminModule;