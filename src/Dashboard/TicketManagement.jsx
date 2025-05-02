import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import {
  Layout,
  Typography,
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Spin,
  Alert,
  Row,
  Col,
  DatePicker,
  Breadcrumb,
  Divider,
  Avatar,
  Badge,
  Timeline
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/es/date-picker/locale/vi_VN';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const TicketManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketCount, setTicketCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create ticket modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit ticket modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm] = Form.useForm();
  
  // Add response modal
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [respondingTicketId, setRespondingTicketId] = useState(null);
  const [responseForm] = Form.useForm();
  
  // Staff assignment
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [assignForm] = Form.useForm();
  const [availableStaff, setAvailableStaff] = useState([]);
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý ticket');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      
      if (search) {
        params.append('search', search);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (priorityFilter) {
        params.append('priority', priorityFilter);
      }
      
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/tickets/admin/all-tickets?${params.toString()}`);
      
      if (response.data.success) {
        setTickets(response.data.tickets);
        setTicketCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching tickets');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch available staff
  const fetchAvailableStaff = async () => {
    try {
      const response = await axios.get('/api/users?role=ADMIN,SUPPORT');
      if (response.data.success) {
        setAvailableStaff(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching available staff:', err);
      toast.error('Không thể tải danh sách nhân viên');
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAvailableStaff();
  }, [page, pageSize, statusFilter, priorityFilter, categoryFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchTickets();
  };
  
  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDateRange(null);
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchTickets();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create ticket functions
  const showCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: 'OPEN',
      priority: 'MEDIUM',
    });
    setCreateModalVisible(true);
  };
  
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };
  
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      
      const ticketData = {
        title: values.title,
        description: values.description,
        client: values.client, // ID of the client
        category: values.category,
        priority: values.priority,
        status: values.status,
        assignedTo: values.assignedTo // Optional: ID of staff assigned
      };
      
      const response = await axios.post('/api/tickets', ticketData);
      
      if (response.data.success) {
        toast.success('Tạo ticket mới thành công');
        setCreateModalVisible(false);
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Tạo ticket thất bại');
      }
    } catch (err) {
      console.error('Create ticket error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo ticket');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit ticket functions
  const showEditModal = (ticket) => {
    setEditingTicket(ticket);
    editForm.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      client: ticket.client?._id,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo?._id
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingTicket(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      const ticketData = {
        title: values.title,
        description: values.description,
        client: values.client,
        category: values.category,
        priority: values.priority,
        status: values.status,
        assignedTo: values.assignedTo
      };
      
      const response = await axios.put(`/api/tickets/${editingTicket._id}`, ticketData);
      
      if (response.data.success) {
        toast.success('Cập nhật ticket thành công');
        setEditModalVisible(false);
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Cập nhật ticket thất bại');
      }
    } catch (err) {
      console.error('Edit ticket error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật ticket');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete ticket function
  const showDeleteConfirm = (ticket) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa ticket này?',
      icon: <ExclamationCircleOutlined />,
      content: `Tiêu đề: ${ticket.title}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/tickets/${ticket._id}`);
          
          if (response.data.success) {
            toast.success('Xóa ticket thành công');
            fetchTickets();
          } else {
            toast.error(response.data.message || 'Xóa ticket thất bại');
          }
        } catch (err) {
          console.error('Delete ticket error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa ticket');
        }
      }
    });
  };
  
  // Add response functions
  const showResponseModal = (ticketId) => {
    setRespondingTicketId(ticketId);
    responseForm.resetFields();
    setResponseModalVisible(true);
  };
  
  const handleResponseCancel = () => {
    setResponseModalVisible(false);
    setRespondingTicketId(null);
  };
  
  const handleResponseSubmit = async () => {
    try {
      const values = await responseForm.validateFields();
      setSubmitting(true);
      
      const responseData = {
        message: values.message,
        updateStatus: values.updateStatus
      };
      
      const response = await axios.post(`/api/tickets/${respondingTicketId}/responses`, responseData);
      
      if (response.data.success) {
        toast.success('Phản hồi ticket thành công');
        setResponseModalVisible(false);
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Phản hồi ticket thất bại');
      }
    } catch (err) {
      console.error('Response error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi phản hồi ticket');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Assign staff functions
  const showAssignModal = (ticketId) => {
    setAssigningTicketId(ticketId);
    const ticket = tickets.find(t => t._id === ticketId);
    
    assignForm.setFieldsValue({
      assignedTo: ticket?.assignedTo?._id
    });
    
    setAssignModalVisible(true);
  };
  
  const handleAssignCancel = () => {
    setAssignModalVisible(false);
    setAssigningTicketId(null);
  };
  
  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      setSubmitting(true);
      
      const response = await axios.put(`/api/tickets/${assigningTicketId}/assign`, {
        assignedTo: values.assignedTo
      });
      
      if (response.data.success) {
        toast.success('Phân công nhân viên thành công');
        setAssignModalVisible(false);
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Phân công nhân viên thất bại');
      }
    } catch (err) {
      console.error('Assign staff error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi phân công nhân viên');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await axios.put(`/api/tickets/${ticketId}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success(`Cập nhật trạng thái ticket thành công: ${getStatusText(newStatus)}`);
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Cập nhật trạng thái ticket thất bại');
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật trạng thái ticket');
    }
  };
  
  // Utilities
  const getCategoryText = (category) => {
    switch (category) {
      case 'GENERAL': return 'Chung';
      case 'ACCOUNT': return 'Tài khoản';
      case 'BILLING': return 'Thanh toán';
      case 'TECHNICAL': return 'Kỹ thuật';
      case 'SALES': return 'Bán hàng';
      case 'REAL_ESTATE': return 'Bất động sản';
      case 'INSURANCE': return 'Bảo hiểm';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Thuế';
      default: return category;
    }
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'GENERAL': return 'default';
      case 'ACCOUNT': return 'blue';
      case 'BILLING': return 'gold';
      case 'TECHNICAL': return 'geekblue';
      case 'SALES': return 'cyan';
      case 'REAL_ESTATE': return 'green';
      case 'INSURANCE': return 'purple';
      case 'VISA': return 'magenta';
      case 'TAX': return 'orange';
      default: return 'default';
    }
  };
  
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      case 'URGENT': return 'Khẩn cấp';
      default: return priority;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'blue';
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN': return 'Mở';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'WAITING_CUSTOMER': return 'Chờ khách hàng';
      case 'RESOLVED': return 'Đã giải quyết';
      case 'CLOSED': return 'Đã đóng';
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
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };
  
  const formatTimeAgo = (dateString) => {
    return moment(dateString).fromNow();
  };
  
  // Get available clients (users)
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await axios.get('/api/users?role=USER');
      if (response.data.success) {
        setClients(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      render: id => <Text code>{id.slice(-6)}</Text>,
      width: 80,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (title, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {formatTimeAgo(record.created_at)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: client => (
        <Space>
          <Avatar
            src={client?.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{client?.username || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Chung', value: 'GENERAL' },
        { text: 'Tài khoản', value: 'ACCOUNT' },
        { text: 'Thanh toán', value: 'BILLING' },
        { text: 'Kỹ thuật', value: 'TECHNICAL' },
        { text: 'Bán hàng', value: 'SALES' },
        { text: 'Bất động sản', value: 'REAL_ESTATE' },
        { text: 'Bảo hiểm', value: 'INSURANCE' },
        { text: 'Visa', value: 'VISA' },
        { text: 'Thuế', value: 'TAX' },
      ],
      render: category => <Tag color={getCategoryColor(category)}>{getCategoryText(category)}</Tag>,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      filters: [
        { text: 'Thấp', value: 'LOW' },
        { text: 'Trung bình', value: 'MEDIUM' },
        { text: 'Cao', value: 'HIGH' },
        { text: 'Khẩn cấp', value: 'URGENT' },
      ],
      render: priority => <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Mở', value: 'OPEN' },
        { text: 'Đang xử lý', value: 'IN_PROGRESS' },
        { text: 'Chờ khách hàng', value: 'WAITING_CUSTOMER' },
        { text: 'Đã giải quyết', value: 'RESOLVED' },
        { text: 'Đã đóng', value: 'CLOSED' },
      ],
      render: status => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      responsive: ['lg'],
      render: staff => staff ? (
        <Space>
          <Avatar
            src={staff.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{staff.username}</Text>
        </Space>
      ) : (
        <Text type="secondary">Chưa phân công</Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/dashboard/tickets/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Phản hồi">
            <Button 
              type="default" 
              size="small" 
              icon={<MessageOutlined />} 
              onClick={() => showResponseModal(record._id)}
            />
          </Tooltip>
          <Tooltip title="Phân công">
            <Button 
              type="default" 
              size="small" 
              icon={<UserOutlined />} 
              onClick={() => showAssignModal(record._id)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="default" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => showDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 0, background: 'transparent' }}>
      <Content>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/admin')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Quản trị hệ thống
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Quản lý ticket hỗ trợ</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <CustomerServiceOutlined style={{ marginRight: 8 }} />
                Quản lý ticket hỗ trợ
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Tạo ticket mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <Input 
                placeholder="Tìm kiếm theo tiêu đề, nội dung..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={value => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="OPEN">Mở</Option>
                <Option value="IN_PROGRESS">Đang xử lý</Option>
                <Option value="WAITING_CUSTOMER">Chờ khách hàng</Option>
                <Option value="RESOLVED">Đã giải quyết</Option>
                <Option value="CLOSED">Đã đóng</Option>
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Lọc theo ưu tiên"
                style={{ width: '100%' }}
                value={priorityFilter}
                onChange={value => {
                  setPriorityFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="LOW">Thấp</Option>
                <Option value="MEDIUM">Trung bình</Option>
                <Option value="HIGH">Cao</Option>
                <Option value="URGENT">Khẩn cấp</Option>
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Lọc theo danh mục"
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={value => {
                  setCategoryFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="GENERAL">Chung</Option>
                <Option value="ACCOUNT">Tài khoản</Option>
                <Option value="BILLING">Thanh toán</Option>
                <Option value="TECHNICAL">Kỹ thuật</Option>
                <Option value="SALES">Bán hàng</Option>
                <Option value="REAL_ESTATE">Bất động sản</Option>
                <Option value="INSURANCE">Bảo hiểm</Option>
                <Option value="VISA">Visa</Option>
                <Option value="TAX">Thuế</Option>
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Space>
                <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </Space>
            </Col>
          </Row>
          
          <Row style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <RangePicker 
                style={{ width: '100%', maxWidth: 400 }}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                locale={locale}
                value={dateRange}
                onChange={dates => {
                  setDateRange(dates);
                  if (dates) {
                    setPage(1);
                  }
                }}
              />
            </Col>
          </Row>
          
          {error && (
            <Alert 
              message="Lỗi" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
          )}
          
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: ticketCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} ticket`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Ticket Modal */}
        <Modal
          title="Tạo ticket mới"
          visible={createModalVisible}
          onCancel={handleCreateCancel}
          width={800}
          footer={[
            <Button key="back" onClick={handleCreateCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleCreateSubmit}
            >
              Tạo
            </Button>,
          ]}
        >
          <Form
            form={createForm}
            layout="vertical"
            requiredMark={true}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="client"
                  label="Khách hàng"
                  rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                >
                  <Select
                    placeholder="Chọn khách hàng"
                    showSearch
                    loading={loadingClients}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {clients.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="assignedTo"
                  label="Nhân viên xử lý"
                >
                  <Select
                    placeholder="Chọn nhân viên xử lý"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {availableStaff.map(staff => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.username} ({staff.role})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select placeholder="Chọn danh mục">
                    <Option value="GENERAL">Chung</Option>
                    <Option value="ACCOUNT">Tài khoản</Option>
                    <Option value="BILLING">Thanh toán</Option>
                    <Option value="TECHNICAL">Kỹ thuật</Option>
                    <Option value="SALES">Bán hàng</Option>
                    <Option value="REAL_ESTATE">Bất động sản</Option>
                    <Option value="INSURANCE">Bảo hiểm</Option>
                    <Option value="VISA">Visa</Option>
                    <Option value="TAX">Thuế</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="priority"
                  label="Mức độ ưu tiên"
                  rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên' }]}
                >
                  <Select placeholder="Chọn mức độ ưu tiên">
                    <Option value="LOW">Thấp</Option>
                    <Option value="MEDIUM">Trung bình</Option>
                    <Option value="HIGH">Cao</Option>
                    <Option value="URGENT">Khẩn cấp</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Tiêu đề"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                >
                  <Input placeholder="Nhập tiêu đề ticket" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Mô tả vấn đề"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả vấn đề' }]}
                >
                  <TextArea rows={5} placeholder="Nhập mô tả chi tiết về vấn đề" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="OPEN">Mở</Option>
                    <Option value="IN_PROGRESS">Đang xử lý</Option>
                    <Option value="WAITING_CUSTOMER">Chờ khách hàng</Option>
                    <Option value="RESOLVED">Đã giải quyết</Option>
                    <Option value="CLOSED">Đã đóng</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Ticket Modal */}
        <Modal
          title="Chỉnh sửa ticket"
          visible={editModalVisible}
          onCancel={handleEditCancel}
          width={800}
          footer={[
            <Button key="back" onClick={handleEditCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleEditSubmit}
            >
              Cập nhật
            </Button>,
          ]}
        >
          {editingTicket && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="client"
                    label="Khách hàng"
                    rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                  >
                    <Select
                      placeholder="Chọn khách hàng"
                      showSearch
                      loading={loadingClients}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {clients.map(user => (
                        <Option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="assignedTo"
                    label="Nhân viên xử lý"
                  >
                    <Select
                      placeholder="Chọn nhân viên xử lý"
                      showSearch
                      allowClear
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {availableStaff.map(staff => (
                        <Option key={staff._id} value={staff._id}>
                          {staff.username} ({staff.role})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="category"
                    label="Danh mục"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                  >
                    <Select placeholder="Chọn danh mục">
                      <Option value="GENERAL">Chung</Option>
                      <Option value="ACCOUNT">Tài khoản</Option>
                      <Option value="BILLING">Thanh toán</Option>
                      <Option value="TECHNICAL">Kỹ thuật</Option>
                      <Option value="SALES">Bán hàng</Option>
                      <Option value="REAL_ESTATE">Bất động sản</Option>
                      <Option value="INSURANCE">Bảo hiểm</Option>
                      <Option value="VISA">Visa</Option>
                      <Option value="TAX">Thuế</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="priority"
                    label="Mức độ ưu tiên"
                    rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên' }]}
                  >
                    <Select placeholder="Chọn mức độ ưu tiên">
                      <Option value="LOW">Thấp</Option>
                      <Option value="MEDIUM">Trung bình</Option>
                      <Option value="HIGH">Cao</Option>
                      <Option value="URGENT">Khẩn cấp</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                  >
                    <Input placeholder="Nhập tiêu đề ticket" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả vấn đề"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả vấn đề' }]}
                  >
                    <TextArea rows={5} placeholder="Nhập mô tả chi tiết về vấn đề" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="OPEN">Mở</Option>
                      <Option value="IN_PROGRESS">Đang xử lý</Option>
                      <Option value="WAITING_CUSTOMER">Chờ khách hàng</Option>
                      <Option value="RESOLVED">Đã giải quyết</Option>
                      <Option value="CLOSED">Đã đóng</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>
        
        {/* Add Response Modal */}
        <Modal
          title="Thêm phản hồi"
          visible={responseModalVisible}
          onCancel={handleResponseCancel}
          footer={[
            <Button key="back" onClick={handleResponseCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleResponseSubmit}
            >
              Gửi phản hồi
            </Button>,
          ]}
        >
          <Form
            form={responseForm}
            layout="vertical"
            requiredMark={true}
          >
            <Form.Item
              name="message"
              label="Nội dung phản hồi"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung phản hồi' }]}
            >
              <TextArea rows={5} placeholder="Nhập nội dung phản hồi" />
            </Form.Item>
            
            <Form.Item
              name="updateStatus"
              label="Cập nhật trạng thái"
              initialValue={null}
            >
              <Select placeholder="Chọn trạng thái mới (nếu cần)" allowClear>
                <Option value="IN_PROGRESS">Đang xử lý</Option>
                <Option value="WAITING_CUSTOMER">Chờ khách hàng</Option>
                <Option value="RESOLVED">Đã giải quyết</Option>
                <Option value="CLOSED">Đã đóng</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
        
        {/* Assign Staff Modal */}
        <Modal
          title="Phân công nhân viên"
          visible={assignModalVisible}
          onCancel={handleAssignCancel}
          footer={[
            <Button key="back" onClick={handleAssignCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleAssignSubmit}
            >
              Phân công
            </Button>,
          ]}
        >
          <Form
            form={assignForm}
            layout="vertical"
            requiredMark={true}
          >
            <Form.Item
              name="assignedTo"
              label="Nhân viên xử lý"
              rules={[{ required: true, message: 'Vui lòng chọn nhân viên xử lý' }]}
            >
              <Select
                placeholder="Chọn nhân viên xử lý"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {availableStaff.map(staff => (
                  <Option key={staff._id} value={staff._id}>
                    {staff.username} ({staff.role})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default TicketManagement;