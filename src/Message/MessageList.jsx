import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Layout,
  List,
  Avatar,
  Typography,
  Card,
  Button,
  Input,
  Space,
  Row,
  Col,
  Badge,
  Empty,
  Spin,
  Alert,
  Breadcrumb,
  Tabs,
  Pagination
} from 'antd';
import {
  MessageOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useAuth } from '../services/AuthProvider';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const MessageList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Thêm các tham số query cho việc phân trang và lọc
      const params = { 
        page,
        limit: 10
      };
      
      if (activeTab === 'unread') {
        params.isRead = false;
      }
      
      const response = await axios.get('/api/messages', { params });
      
      // Group messages by conversation partner
      const messagesByUser = {};
      
      response.data.messages.forEach(message => {
        // Xác định user ID của đối tác trò chuyện
        const userId = message.sender._id === currentUser.id 
          ? message.recipient._id 
          : message.sender._id;
        
        // Bỏ qua tin nhắn tự gửi cho chính mình
        if (message.sender._id === currentUser.id && message.recipient._id === currentUser.id) {
          return;
        }
          
        const userName = message.sender._id === currentUser.id
          ? message.recipient.username
          : message.sender.username;
          
        const userAvatar = message.sender._id === currentUser.id
          ? message.recipient.avatar
          : message.sender.avatar;
          
        if (!messagesByUser[userId]) {
          messagesByUser[userId] = {
            userId,
            userName,
            userAvatar,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: message.sender._id !== currentUser.id && !message.isRead ? 1 : 0
          };
        } else {
          // Update only if this message is newer
          if (new Date(message.created_at) > new Date(messagesByUser[userId].lastMessageTime)) {
            messagesByUser[userId].lastMessage = message.content;
            messagesByUser[userId].lastMessageTime = message.created_at;
          }
          // Count unread messages
          if (message.sender._id !== currentUser.id && !message.isRead) {
            messagesByUser[userId].unreadCount += 1;
          }
        }
      });
      
      // Convert to array and sort by last message time
      const sortedConversations = Object.values(messagesByUser)
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
      setConversations(sortedConversations);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, activeTab]);

  const handleSearch = value => {
    setSearchTerm(value);
  };

  const filteredConversations = conversations.filter(conversation => 
    conversation.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    // Otherwise return date
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Trang chủ
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Tin nhắn</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/messages/new')}
            >
              Tin nhắn mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={16} lg={16}>
            <Title level={4}>
              <MessageOutlined style={{ marginRight: 8 }} />
              Tin nhắn của tôi
            </Title>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Search
              placeholder="Tìm kiếm cuộc trò chuyện"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        <Tabs 
          defaultActiveKey="all" 
          onChange={setActiveTab}
          style={{ marginTop: 16 }}
        >
          <TabPane tab="Tất cả" key="all" />
          <TabPane 
            tab={
              <Badge dot={conversations.some(c => c.unreadCount > 0)}>
                Chưa đọc
              </Badge>
            } 
            key="unread" 
          />
        </Tabs>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Lỗi" description={error} type="error" showIcon />
        ) : filteredConversations.length === 0 ? (
          <Empty 
            description="Không tìm thấy tin nhắn nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              onClick={() => navigate('/dashboard/messages/new')}
            >
              Tạo tin nhắn mới
            </Button>
          </Empty>
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={filteredConversations}
              renderItem={item => (
                <List.Item 
                  style={{ 
                    cursor: 'pointer',
                    background: item.unreadCount > 0 ? '#f0f8ff' : 'transparent',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}
                  onClick={() => navigate(`/dashboard/messages/conversation/${item.userId}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={item.unreadCount}>
                        <Avatar 
                          src={item.userAvatar} 
                          size={48}
                          icon={<UserOutlined />}
                        />
                      </Badge>
                    }
                    title={
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong>{item.userName}</Text>
                        </Col>
                        <Col>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatTime(item.lastMessageTime)}
                          </Text>
                        </Col>
                      </Row>
                    }
                    description={
                      <Text 
                        type={item.unreadCount > 0 ? "primary" : "secondary"}
                        ellipsis={{ rows: 1 }}
                        style={{ fontWeight: item.unreadCount > 0 ? 'bold' : 'normal' }}
                      >
                        {item.lastMessage}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination 
                current={page}
                total={total}
                pageSize={10}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Card>
    </Layout>
  );
};

export default MessageList;