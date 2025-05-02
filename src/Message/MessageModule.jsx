import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MessageList from './MessageList';
import Conversation from './Conversation';
import NewMessage from './NewMessage';

const MessageModule = () => {
  return (
    <Routes>
      <Route path="/" element={<MessageList />} />
      <Route path="/new" element={<NewMessage />} />
      <Route path="/conversation/:userId" element={<Conversation />} />
      <Route path="*" element={<Navigate to="/dashboard/messages" replace />} />
    </Routes>
  );
};

export default MessageModule;