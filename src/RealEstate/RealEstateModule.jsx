import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PropertyList from './PropertyList';
import PropertyDetails from './PropertyDetails';
import PropertyForm from './PropertyForm';

const RealEstateModule = () => {
  return (
    <Routes>
      <Route path="/" element={<PropertyList />} />
      <Route path="/:id" element={<PropertyDetails />} />
      <Route path="/create" element={<PropertyForm />} />
      <Route path="/edit/:id" element={<PropertyForm />} />
    </Routes>
  );
};

export default RealEstateModule;