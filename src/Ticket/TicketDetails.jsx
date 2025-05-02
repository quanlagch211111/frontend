import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import {
  Layout,
  Typography,
  Card,
  Button,
  Space,
  Tag,
  Divider,
  Spin,
  Alert,
  Avatar,
  Input,
  Modal,
  Form,
  Select,
  Row,
  Col,
  List,
  Badge,
  Breadcrumb,
  Tooltip,
  Timeline
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HighlightOutlined,
  LinkOutlined,
  CustomerServiceOutlined,
  MessageOutlined,
  SyncOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;
const { Content } = Layout;
const { Option } = Select;

// Create a custom comment component to replace the missing antd Comment
const CustomComment = ({ author, avatar, content, datetime, style }) => {
  return (
    <div style={{ display: 'flex', padding: '12px 0', ...style }}>
      <div style={{ marginRight: 12 }}>
        {avatar}
      </div>
      <div style={{ flex: 1 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>{author}</div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }}>{datetime}</div>
          </div>
          <div style={{ marginTop: 4 }}>{content}</div>
        </div>
      </div>
    </div>
  );
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Delete ticket
  const [deletingTicket, setDeletingTicket] = useState(false);
  
  // Status change modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  
  // Assign ticket modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  
  // Attachment modal
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      
      // Fixed API endpoint to match backend
      const response = await axios.get(`/api/tickets/${id}`);
      
      if (response.data.success) {
        setTicket(response.data.ticket);
      } else {
        setError('Failed to fetch ticket details');
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(err.response?.data?.message || 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      setLoadingStaff(true);
      const response = await axios.get('/api/users?role=ADMIN,SUPPORT,AGENT');
      
      if (response.data.success) {
        setStaffUsers(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching staff users:', err);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    
    // Only fetch staff users if user is admin or support
    if (currentUser && (currentUser.isAdmin || currentUser.role === 'ADMIN' || currentUser.role === 'SUPPORT')) {
      fetchStaffUsers();
    }
  }, [id, currentUser]);

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    
    setSendingMessage(true);
    
    try {
      // Fixed API endpoint to match backend
      const response = await axios.post(`/api/tickets/${id}/messages`, {
        content: messageContent,
        attachments
      });
      
      if (response.data.success) {
        setTicket(response.data.ticket);
        setMessageContent('');
        setAttachments([]);
        toast.success('Message sent successfully');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    
    try {
      // Validate URL
      new URL(attachmentUrl);
      
      setAttachments([...attachments, attachmentUrl]);
      setAttachmentUrl('');
      setAttachmentModalVisible(false);
      toast.success('Attachment added');
    } catch (e) {
      toast.error('Please enter a valid URL');
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments(attachments.filter((_, index) => index !== indexToRemove));
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Are you sure you want to delete this ticket?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: handleDeleteTicket
    });
  };

  const handleDeleteTicket = async () => {
    setDeletingTicket(true);
    
    try {
      // Fixed API endpoint to match backend
      const response = await axios.delete(`/api/tickets/${id}`);
      
      if (response.data.success) {
        toast.success('Ticket deleted successfully');
        navigate('/dashboard/tickets');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setDeletingTicket(false);
    }
  };

  const handleStatusChange = async () => {
    setChangingStatus(true);
    
    try {
      // Fixed API endpoint to match backend
      const response = await axios.put(`/api/tickets/${id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setTicket(response.data.ticket);
        setStatusModalVisible(false);
        toast.success(`Status updated to ${getStatusText(newStatus)}`);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAssignTicket = async () => {
    setAssigning(true);
    
    try {
      // Fixed API endpoint to match backend
      const response = await axios.put(`/api/tickets/${id}/assign`, {
        assigneeId: assigneeId || null  // null to unassign
      });
      
      if (response.data.success) {
        setTicket(response.data.ticket);
        setAssignModalVisible(false);
        toast.success(assigneeId ? 'Ticket assigned successfully' : 'Ticket unassigned');
      }
    } catch (err) {
      console.error('Error assigning ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  const isAdmin = currentUser && (currentUser.isAdmin || currentUser.role === 'ADMIN');
  const isSupport = currentUser && currentUser.role === 'SUPPORT';
  const isAgent = currentUser && currentUser.role === 'AGENT';
  
  const canDeleteTicket = isAdmin;
  
  const canAssignTicket = isAdmin || isSupport;
  
  const canChangeStatus = () => {
    if (!ticket || !currentUser) return false;
    
    const isTicketOwner = ticket.user._id === currentUser.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo._id === currentUser.id;
    
    return isAdmin || isSupport || isAgent || isAssigned || isTicketOwner;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'IN_PROGRESS': return 'In Progress';
      case 'WAITING_CUSTOMER': return 'Waiting on Customer';
      case 'RESOLVED': return 'Resolved';
      case 'CLOSED': return 'Closed';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'blue';
      case 'IN_PROGRESS': return 'processing';
      case 'WAITING_CUSTOMER': return 'warning';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN': return <MessageOutlined />;
      case 'IN_PROGRESS': return <SyncOutlined spin />;
      case 'WAITING_CUSTOMER': return <ClockCircleOutlined />;
      case 'RESOLVED': return <CheckCircleOutlined />;
      case 'CLOSED': return <CloseCircleOutlined />;
      default: return <MessageOutlined />;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'LOW': return 'Low';
      case 'MEDIUM': return 'Medium';
      case 'HIGH': return 'High';
      case 'URGENT': return 'Urgent';
      default: return priority;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'blue';
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      default: return 'blue';
    }
  };
  
  const getCategoryText = (category) => {
    switch (category) {
      case 'REAL_ESTATE': return 'Real Estate';
      case 'INSURANCE': return 'Insurance';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Tax';
      case 'GENERAL': return 'General';
      case 'ACCOUNT': return 'Account';
      case 'BILLING': return 'Billing';
      case 'TECHNICAL': return 'Technical';
      case 'SALES': return 'Sales';
      default: return category;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'REAL_ESTATE': return 'green';
      case 'INSURANCE': return 'purple';
      case 'VISA': return 'magenta';
      case 'TAX': return 'orange';
      case 'GENERAL': return 'default';
      case 'ACCOUNT': return 'cyan';
      case 'BILLING': return 'gold';
      case 'TECHNICAL': return 'geekblue';
      case 'SALES': return 'lime';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };

  const formatTimeAgo = (dateString) => {
    return moment(dateString).fromNow();
  };

  const isSystemMessage = (message) => {
    return message.content.startsWith('Ticket') && 
      (message.content.includes('assigned') || 
       message.content.includes('status changed') ||
       message.content.includes('unassigned'));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải phiếu hỗ trợ...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!ticket) {
    return <Alert message="Ticket not found" description="The requested ticket could not be found" type="warning" showIcon />;
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/tickets')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Trở về Chăm Sóc Khách Hàng
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Phiếu Hỗ Trợ #{ticket._id.substring(ticket._id.length - 6)}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          <Col>
            <Space>
              {canChangeStatus() && (
                <Button 
                  type="primary"
                  onClick={() => {
                    setNewStatus(ticket.status);
                    setStatusModalVisible(true);
                  }}
                >
                  Thay Đổi Trạng Thái
                </Button>
              )}
              
              {canAssignTicket && (
                <Button 
                  icon={<UserSwitchOutlined />}
                  onClick={() => {
                    setAssigneeId(ticket.assignedTo?._id || '');
                    setAssignModalVisible(true);
                  }}
                >
                  {ticket.assignedTo ? 'Reassign' : 'Assign'}
                </Button>
              )}
              
              {canDeleteTicket && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={showDeleteConfirm}
                  loading={deletingTicket}
                >
                  Xóa
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Tag color={getCategoryColor(ticket.category)}>{getCategoryText(ticket.category)}</Tag>
                  <Tag color={getPriorityColor(ticket.priority)}>{getPriorityText(ticket.priority)}</Tag>
                  <Tag color={getStatusColor(ticket.status)} icon={getStatusIcon(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </Tag>
                </Space>
                <Title level={4}>{ticket.title}</Title>
              </div>
              <Text type="secondary">Ngày Tạo: {formatDate(ticket.created_at)}</Text>
            </div>

            <Divider />
            
            <Title level={5}>Mô Tả</Title>
            <Paragraph style={{ whiteSpace: 'pre-line' }}>
              {ticket.description}
            </Paragraph>
          </Card>

          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MessageOutlined style={{ marginRight: 8 }} />
                <span>Cuộc hội thoại</span>
              </div>
            }
          >
            <List
              className="comment-list"
              itemLayout="horizontal"
              dataSource={ticket.messages}
              style={{ maxHeight: 500, overflow: 'auto', marginBottom: 24 }}
              renderItem={(message, index) => {
                const isCurrentUser = message.sender._id === currentUser.id;
                const isSystem = isSystemMessage(message);
                
                if (isSystem) {
                  return (
                    <div style={{ 
                      textAlign: 'center', 
                      margin: '16px 0', 
                      padding: '8px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px' 
                    }}>
                      <Text type="secondary">{message.content} • {formatTimeAgo(message.timestamp)}</Text>
                    </div>
                  );
                }
                
                return (
                  <CustomComment
                    key={index}
                    author={
                      <Text strong style={{ color: isCurrentUser ? '#1890ff' : undefined }}>
                        {message.sender.username}
                        {message.sender.role && (
                          <Tag style={{ marginLeft: 8 }} color={
                            message.sender.role === 'ADMIN' ? 'red' : 
                            message.sender.role === 'SUPPORT' ? 'purple' : 'default'
                          }>
                            {message.sender.role}
                          </Tag>
                        )}
                      </Text>
                    }
                    avatar={
                      <Avatar src={message.sender.avatar} icon={<UserOutlined />} 
                        style={{ backgroundColor: isCurrentUser ? '#1890ff' : undefined }} 
                      />
                    }
                    content={
                      <div>
                        <Paragraph style={{ whiteSpace: 'pre-line' }}>
                          {message.content}
                        </Paragraph>
                        {message.attachments && message.attachments.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            {message.attachments.map((attachment, i) => (
                              <div key={i} style={{ marginBottom: 4 }}>
                                <a href={attachment} target="_blank" rel="noopener noreferrer">
                                  <LinkOutlined style={{ marginRight: 8 }} />
                                  Attachment {i + 1}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                    datetime={
                      <Tooltip title={formatDate(message.timestamp)}>
                        <span>{formatTimeAgo(message.timestamp)}</span>
                      </Tooltip>
                    }
                    style={{ 
                      textAlign: isCurrentUser ? 'right' : 'left',
                      backgroundColor: isCurrentUser ? 'rgba(24, 144, 255, 0.05)' : undefined,
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      margin: '8px 0'
                    }}
                  />
                );
              }}
            />

            {ticket.status !== 'CLOSED' && (
              <div>
                <TextArea
                  rows={4}
                  placeholder="Type your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  disabled={sendingMessage}
                  style={{ marginBottom: 16 }}
                />
                
                {attachments.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Attachments:</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {attachments.map((url, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => handleRemoveAttachment(index)}
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            Attachment {index + 1}
                          </a>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    icon={<PaperClipOutlined />}
                    onClick={() => setAttachmentModalVisible(true)}
                    style={{ marginRight: 8 }}
                    disabled={sendingMessage}
                  >
                    Add Attachment
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendingMessage}
                    loading={sendingMessage}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HighlightOutlined style={{ marginRight: 8 }} />
                <span>Thông tin ticket</span>
              </div>
            }
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Text type="secondary">Status</Text>
                <div>
                  <Tag color={getStatusColor(ticket.status)} icon={getStatusIcon(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </Tag>
                </div>
              </div>
              
              <div>
                <Text type="secondary">Mức độ ưu tiên</Text>
                <div>
                  <Tag color={getPriorityColor(ticket.priority)}>
                    {getPriorityText(ticket.priority)}
                  </Tag>
                </div>
              </div>
              
              <div>
                <Text type="secondary">Danh mục </Text>
                <div>
                  <Tag color={getCategoryColor(ticket.category)}>
                    {getCategoryText(ticket.category)}
                  </Tag>
                </div>
              </div>
              
              <div>
                <Text type="secondary">ID</Text>
                <div>
                  <Text code>{ticket._id}</Text>
                </div>
              </div>
              
              <div>
                <Text type="secondary">Ngày tạo</Text>
                <div>
                  <Text>{formatDate(ticket.created_at)}</Text>
                </div>
              </div>
              
              <div>
                <Text type="secondary">Lần cuối cập nhật</Text>
                <div>
                  <Text>{formatDate(ticket.updated_at)}</Text>
                </div>
              </div>
              
              {ticket.relatedService && ticket.relatedService.serviceType && (
                <div>
                  <Text type="secondary">Dịch vụ liên quan</Text>
                  <div>
                    <Tag color="cyan">{ticket.relatedService.serviceType}</Tag>
                    {ticket.relatedService.serviceId && (
                      <div>
                        <Text code>{ticket.relatedService.serviceId}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ marginRight: 8 }} />
                <span>Được tạo bởi</span>
              </div>
            }
            style={{ marginBottom: 24 }}
          >
            {ticket.user && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={ticket.user.avatar} 
                  icon={<UserOutlined />} 
                  size={64} 
                  style={{ marginRight: 16 }}
                />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>
                    {ticket.user.username}
                  </Text>
                  <Text type="secondary">{ticket.user.email}</Text>
                  {ticket.user.phone && (
                    <div>
                      <Text type="secondary">{ticket.user.phone}</Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {ticket.assignedTo ? (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CustomerServiceOutlined style={{ marginRight: 8 }} />
                  <span>Được giao cho</span>
                </div>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={ticket.assignedTo.avatar} 
                  icon={<CustomerServiceOutlined />} 
                  size={64} 
                  style={{ marginRight: 16, backgroundColor: '#722ed1' }}
                />
                <div>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      {ticket.assignedTo.username}
                    </Text>
                    {ticket.assignedTo.role && (
                      <Tag color={
                        ticket.assignedTo.role === 'ADMIN' ? 'red' : 
                        ticket.assignedTo.role === 'SUPPORT' ? 'purple' : 'default'
                      } style={{ marginLeft: 8 }}>
                        {ticket.assignedTo.role}
                      </Tag>
                    )}
                  </div>
                  <Text type="secondary">{ticket.assignedTo.email}</Text>
                </div>
              </div>
            </Card>
          ) : canAssignTicket ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CustomerServiceOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>
                  <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                    Vé này không được giao cho bất kỳ ai
                  </Text>
                  <Button
                    type="primary"
                    icon={<UserSwitchOutlined />}
                    onClick={() => setAssignModalVisible(true)}
                  >
                    Giao ngay
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </Col>
      </Row>

      {/* Status Change Modal */}
      <Modal
        title="Change Ticket Status"
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setStatusModalVisible(false)}>
            Thoát
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={changingStatus}
            onClick={handleStatusChange}
            disabled={newStatus === ticket.status}
          >
            Thay đổi trạng thái
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Chọn trạng thái mới cho vé này:</Text>
        </div>
        <Select
          value={newStatus}
          onChange={setNewStatus}
          style={{ width: '100%' }}
          optionLabelProp="label"
        >
          <Option value="OPEN" label="Open">
            <Space>
              <MessageOutlined />
              <span>Mở</span>
            </Space>
          </Option>
          <Option value="IN_PROGRESS" label="In Progress">
            <Space>
              <SyncOutlined spin />
              <span>Đang tiến hành</span>
            </Space>
          </Option>
          <Option value="WAITING_CUSTOMER" label="Waiting on Customer">
            <Space>
              <ClockCircleOutlined />
              <span>Đang chờ khách hàng</span>
            </Space>
          </Option>
          <Option value="RESOLVED" label="Resolved">
            <Space>
              <CheckCircleOutlined />
              <span>Đã giải quyết</span>
            </Space>
          </Option>
          <Option value="CLOSED" label="Closed">
            <Space>
              <CloseCircleOutlined />
              <span>Đóng</span>
            </Space>
          </Option>
        </Select>
      </Modal>

      {/* Assign Ticket Modal */}
      <Modal
        title="Assign Ticket"
        visible={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setAssignModalVisible(false)}>
            Thoát
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={assigning}
            onClick={handleAssignTicket}
            disabled={ticket.assignedTo?._id === assigneeId}
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Chọn một nhân viên để chỉ định phiếu này:</Text>
        </div>
        {loadingStaff ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin />
          </div>
        ) : (
          <Select
            showSearch
            placeholder="Select a staff member"
            optionFilterProp="children"
            value={assigneeId}
            onChange={setAssigneeId}
            style={{ width: '100%' }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            <Option value="">Chưa được chỉ định</Option>
            {staffUsers.map((user) => (
              <Option key={user._id} value={user._id}>
                {user.username} ({user.role})
              </Option>
            ))}
          </Select>
        )}
      </Modal>

      {/* Add Attachment Modal */}
      <Modal
        title="Add Attachment"
        visible={attachmentModalVisible}
        onCancel={() => setAttachmentModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setAttachmentModalVisible(false)}>
            Thoát 
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddAttachment}
            disabled={!attachmentUrl.trim()}
          >
            Thêm 
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Nhập URL của tệp đính kèm mà bạn muốn thêm:</Text>
        </div>
        <Input
          placeholder="https://example.com/document.pdf"
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
          Lưu ý: Bạn có thể tải tệp lên dịch vụ lưu trữ đám mây và dán liên kết vào đây.          </Text>
        </div>
      </Modal>
    </Layout>
  );
};

export default TicketDetails;