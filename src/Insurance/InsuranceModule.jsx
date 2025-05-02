import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PolicyList from './PolicyList';
import PolicyDetails from './PolicyDetails';
import PolicyForm from './PolicyForm';

const InsuranceModule = () => {
  return (
    <Routes>
      <Route path="/" element={<PolicyList />} />
      <Route path="/:id" element={<PolicyDetails />} />
      <Route path="/create" element={<PolicyForm />} />
      <Route path="/edit/:id" element={<PolicyForm />} />
    </Routes>
  );
};

export default InsuranceModule;