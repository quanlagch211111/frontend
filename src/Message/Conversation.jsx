import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Layout,
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Divider,
  Empty,
  Spin,
  Alert,
  Breadcrumb,
  Row,
  Col,
  Tooltip,
  Dropdown,
  Menu
} from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  ArrowLeftOutlined,
  EllipsisOutlined,
  UserOutlined,
  DeleteOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useAuth } from '../services/AuthProvider';

const { Text, Title } = Typography;
const { TextArea } = Input;

const Conversation = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [partner, setPartner] = useState(null);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/conversation/${userId}`);
      
      if (response.data.success) {
        setMessages(response.data.messages);
        
        // Set the conversation partner details
        if (response.data.messages.length > 0) {
          const message = response.data.messages[0];
          if (message.sender._id === currentUser.id) {
            setPartner(message.recipient);
          } else {
            setPartner(message.sender);
          }
        }
        
        // Mark unread messages as read
        const unreadMessages = response.data.messages.filter(
          msg => msg.recipient._id === currentUser.id && !msg.isRead
        );
        
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(async (msg) => {
            await axios.patch(`/api/messages/${msg._id}/read`);
          });
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError(err.response?.data?.message || 'Không thể tải cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
    
    // Poll for new messages every 15 seconds
    const interval = setInterval(fetchConversation, 15000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      
      const messageData = {
        recipientId: userId,
        content: newMessage.trim(),
        attachments: []
      };
      
      const response = await axios.post('/api/messages', messageData);
      
      if (response.data.success) {
        setMessages([...messages, response.data.data]);
        setNewMessage('');
        toast.success('Tin nhắn đã được gửi');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleAddAttachment = async () => {
    if (!newAttachmentUrl.trim()) return;
    
    try {
      // Basic URL validation
      new URL(newAttachmentUrl);
      
      // Send the most recent message first if no messages exist
      if (messages.length === 0) {
        const messageData = {
          recipientId: userId,
          content: 'Đã chia sẻ tệp đính kèm',
          attachments: [newAttachmentUrl]
        };
        
        const response = await axios.post('/api/messages', messageData);
        if (response.data.success) {
          setMessages([response.data.data]);
          setNewAttachmentUrl('');
          setShowAttachmentInput(false);
          toast.success('Đã thêm tệp đính kèm');
        }
      } else {
        // Get the latest message from current user
        const latestOwnMessage = [...messages]
          .reverse()
          .find(msg => msg.sender._id === currentUser.id);
          
        if (latestOwnMessage) {
          const response = await axios.post(`/api/messages/${latestOwnMessage._id}/attachments`, {
            attachmentUrl: newAttachmentUrl
          });
          
          if (response.data.success) {
            // Update the message in the list
            const updatedMessages = messages.map(msg => 
              msg._id === latestOwnMessage._id ? response.data.data : msg
            );
            
            setMessages(updatedMessages);
            setNewAttachmentUrl('');
            setShowAttachmentInput(false);
            toast.success('Đã thêm tệp đính kèm');
          }
        } else {
          // If no own message exists, create a new one
          const messageData = {
            recipientId: userId,
            content: 'Đã chia sẻ tệp đính kèm',
            attachments: [newAttachmentUrl]
          };
          
          const response = await axios.post('/api/messages', messageData);
          if (response.data.success) {
            setMessages([...messages, response.data.data]);
            setNewAttachmentUrl('');
            setShowAttachmentInput(false);
            toast.success('Đã thêm tệp đính kèm');
          }
        }
      }
    } catch (err) {
      console.error('Error adding attachment:', err);
      toast.error('Vui lòng nhập URL hợp lệ');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await axios.delete(`/api/messages/${messageId}`);
      
      if (response.data.success) {
        setMessages(messages.filter(msg => msg._id !== messageId));
        toast.success('Tin nhắn đã được xóa');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/dashboard/messages')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách tin nhắn
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Cuộc trò chuyện</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 200px)',
          minHeight: '500px'
        }}
      >
        {/* Conversation header */}
        {partner && (
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Avatar 
                    size={40} 
                    src={partner.avatar}
                    icon={<UserOutlined />}
                  />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {partner.username}
                    </Title>
                    <Text type="secondary">
                      {partner.email}
                    </Text>
                  </div>
                </Space>
              </Col>
            </Row>
          </div>
        )}
        
        {/* Messages area */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert message="Lỗi" description={error} type="error" showIcon />
          ) : messages.length === 0 ? (
            <Empty
              description="Không có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện"
              style={{ margin: 'auto' }}
            />
          ) : (
            <>
              <List
                dataSource={messages}
                renderItem={(message) => {
                  const isOwnMessage = message.sender._id === currentUser.id;
                  
                  return (
                    <List.Item style={{ padding: '8px 0' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          width: '100%'
                        }}
                      >
                        {!isOwnMessage && (
                          <Avatar 
                            src={message.sender.avatar}
                            style={{ marginRight: 12, marginTop: 4 }}
                            icon={<UserOutlined />}
                          />
                        )}
                        
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: isOwnMessage ? '#1890ff' : '#f0f0f0',
                            color: isOwnMessage ? 'white' : 'rgba(0, 0, 0, 0.85)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ marginBottom: 4 }}>
                            {message.content}
                          </div>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              {message.attachments.map((attachment, index) => (
                                <div key={index} style={{ marginTop: 4 }}>
                                  <a 
                                    href={attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: isOwnMessage ? 'white' : '#1890ff' }}
                                  >
                                    <LinkOutlined style={{ marginRight: 4 }} />
                                    Tệp đính kèm {index + 1}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div
                            style={{
                              fontSize: '11px',
                              color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.45)',
                              marginTop: 4,
                              textAlign: 'right'
                            }}
                          >
                            {formatTime(message.created_at)}
                            {message.isRead && isOwnMessage && ' ✓✓'}
                          </div>
                          
                          {isOwnMessage && (
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => handleDeleteMessage(message._id)}
                                    danger
                                  >
                                    Xóa tin nhắn
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <Button
                                type="text"
                                icon={<EllipsisOutlined />}
                                size="small"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  right: 0,
                                  color: 'white',
                                  padding: 2
                                }}
                              />
                            </Dropdown>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Attachment input */}
        {showAttachmentInput && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Nhập URL tệp đính kèm"
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                onPressEnter={handleAddAttachment}
              />
              <Button 
                type="primary" 
                onClick={handleAddAttachment}
                disabled={!newAttachmentUrl.trim()}
              >
                Thêm
              </Button>
              <Button 
                onClick={() => {
                  setShowAttachmentInput(false);
                  setNewAttachmentUrl('');
                }}
              >
                Hủy
              </Button>
            </Space.Compact>
          </div>
        )}
        
        {/* Message input */}
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Row gutter={8}>
            <Col flex="auto">
              <TextArea
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={sending}
              />
            </Col>
            <Col>
              <Space direction="vertical">
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  loading={sending}
                />
              </Space>
            </Col>
          </Row>
        </div>
      </Card>
    </Layout>
  );
};

export default Conversation;