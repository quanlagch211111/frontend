import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TaxCaseList from './TaxCaseList';
import TaxCaseDetails from './TaxCaseDetails';
import TaxCaseForm from './TaxCaseForm';

const TaxModule = () => {
  return (
    <Routes>
      <Route path="/" element={<TaxCaseList />} />
      <Route path="/:id" element={<TaxCaseDetails />} />
      <Route path="/create" element={<TaxCaseForm />} />
      <Route path="/edit/:id" element={<TaxCaseForm />} />
    </Routes>
  );
};

export default TaxModule;