import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TicketList from './TicketList';
import TicketDetails from './TicketDetails';
import TicketForm from './TicketForm';

const TicketModule = () => {
  return (
    <Routes>
      <Route path="/" element={<TicketList />} />
      <Route path="/:id" element={<TicketDetails />} />
      <Route path="/create" element={<TicketForm />} />
    </Routes>
  );
};

export default TicketModule;