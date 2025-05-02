import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppointmentList from './AppointmentList';
import AppointmentForm from './AppointmentForm';
import AppointmentDetails from './AppointmentDetails';

const AppointmentModule = () => {
  return (
    <Routes>
      <Route path="/" element={<AppointmentList />} />
      <Route path="/create" element={<AppointmentForm />} />
      <Route path="/edit/:id" element={<AppointmentForm />} />
      <Route path="/:id" element={<AppointmentDetails />} />
      <Route path="*" element={<Navigate to="/dashboard/appointments" replace />} />
    </Routes>
  );
};

export default AppointmentModule;