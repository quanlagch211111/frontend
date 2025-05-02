import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VisaList from './VisaList';
import VisaDetails from './VisaDetails';
import VisaForm from './VisaForm';

const VisaModule = () => {
  return (
    <Routes>
      <Route path="/" element={<VisaList />} />
      <Route path="/:id" element={<VisaDetails />} />
      <Route path="/create" element={<VisaForm />} />
      <Route path="/edit/:id" element={<VisaForm />} />
    </Routes>
  );
};

export default VisaModule;