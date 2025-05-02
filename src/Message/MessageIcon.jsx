import React, { useEffect, useState } from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import axios from 'axios';

const MessageIcon = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/messages/user/unread-count');
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for new unread messages every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Badge count={unreadCount} size="small">
      <MessageOutlined />
    </Badge>
  );
};

export default MessageIcon;