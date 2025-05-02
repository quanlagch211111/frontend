import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import {
  Layout,
  Typography,
  Card,
  Button,
  Table,
  Space,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Tooltip,
  Spin,
  Alert,
  Breadcrumb,
  Divider,
  Badge,
  Tabs,
  Empty
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  EyeOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CustomerServiceOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { Content } = Layout;
const { TabPane } = Tabs;

const TicketList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketCount, setTicketCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my', 'assigned'
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Check if user is staff (admin, support, or agent)
  const isStaff = currentUser && 
    (currentUser.isAdmin || 
     currentUser.role === 'ADMIN' || 
     currentUser.role === 'SUPPORT' || 
     currentUser.role === 'AGENT');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build endpoint based on active tab
      let endpoint = '/api/tickets';
      if (activeTab === 'my') {
        endpoint = '/api/tickets/user/tickets';
      } else if (activeTab === 'assigned') {
        endpoint = '/api/tickets/staff/assigned';
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('search', search);
      
      // Add sorting
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      const response = await axios.get(`${endpoint}?${params.toString()}`);
      
      if (response.data.success) {
        setTickets(response.data.tickets);
        setTicketCount(response.data.total || response.data.count);
      } else {
        setError('Không thể tải danh sách ticket');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, pageSize, activeTab, sortField, sortDirection]);

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchTickets();
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
    setSortField('created_at');
    setSortDirection('desc');
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };

  const handleCreateClick = () => {
    navigate('/dashboard/tickets/create');
  };

  // Utility functions
  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN': return 'Mở';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'WAITING_CUSTOMER': return 'Chờ phản hồi';
      case 'RESOLVED': return 'Đã giải quyết';
      case 'CLOSED': return 'Đóng';
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
      default: return 'blue';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'LOW': return <ArrowDownOutlined />;
      case 'MEDIUM': return <ClockCircleOutlined />;
      case 'HIGH': return <ArrowUpOutlined />;
      case 'URGENT': return <WarningOutlined />;
      default: return null;
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'REAL_ESTATE': return 'Bất động sản';
      case 'INSURANCE': return 'Bảo hiểm';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Thuế';
      case 'GENERAL': return 'Chung';
      case 'ACCOUNT': return 'Tài khoản';
      case 'BILLING': return 'Thanh toán';
      case 'TECHNICAL': return 'Kỹ thuật';
      case 'SALES': return 'Bán hàng';
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

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 80,
      render: id => <Text copyable>{id.slice(-6)}</Text>,
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
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Bất động sản', value: 'REAL_ESTATE' },
        { text: 'Bảo hiểm', value: 'INSURANCE' },
        { text: 'Visa', value: 'VISA' },
        { text: 'Thuế', value: 'TAX' },
        { text: 'Chung', value: 'GENERAL' },
        { text: 'Tài khoản', value: 'ACCOUNT' },
        { text: 'Thanh toán', value: 'BILLING' },
        { text: 'Kỹ thuật', value: 'TECHNICAL' },
        { text: 'Bán hàng', value: 'SALES' },
      ],
      render: category => (
        <Tag color={getCategoryColor(category)}>
          {getCategoryText(category)}
        </Tag>
      ),
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      sorter: true,
      filters: [
        { text: 'Thấp', value: 'LOW' },
        { text: 'Trung bình', value: 'MEDIUM' },
        { text: 'Cao', value: 'HIGH' },
        { text: 'Khẩn cấp', value: 'URGENT' },
      ],
      render: priority => (
        <Tag color={getPriorityColor(priority)} icon={getPriorityIcon(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      filters: [
        { text: 'Mở', value: 'OPEN' },
        { text: 'Đang xử lý', value: 'IN_PROGRESS' },
        { text: 'Chờ phản hồi', value: 'WAITING_CUSTOMER' },
        { text: 'Đã giải quyết', value: 'RESOLVED' },
        { text: 'Đóng', value: 'CLOSED' },
      ],
      render: status => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      responsive: ['md'],
      render: date => formatDate(date),
    },
    {
      title: 'Người tạo',
      dataIndex: 'user',
      key: 'user',
      responsive: ['lg'],
      render: user => user ? user.username : 'N/A',
    },
    {
      title: 'Tin nhắn',
      dataIndex: 'messages',
      key: 'messages',
      responsive: ['lg'],
      render: messages => (
        <Badge count={messages?.length || 0} showZero style={{ backgroundColor: messages?.length ? '#1890ff' : '#d9d9d9' }} />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/dashboard/tickets/${record._id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const getEmptyText = () => {
    if (search || statusFilter || priorityFilter || categoryFilter) {
      return "Không tìm thấy ticket nào phù hợp với điều kiện lọc.";
    }
    
    switch (activeTab) {
      case 'my':
        return "Bạn chưa tạo ticket hỗ trợ nào.";
      case 'assigned':
        return "Không có ticket hỗ trợ nào được phân công cho bạn.";
      default:
        return "Không có ticket hỗ trợ nào.";
    }
  };

  return (
    <Layout style={{ padding: 0, background: 'transparent' }}>
      <Content>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>Hỗ trợ khách hàng</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4}>
            <CustomerServiceOutlined style={{ marginRight: 8 }} />
            Quản lý ticket hỗ trợ
          </Title>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
          >
            Tạo ticket mới
          </Button>
        </div>
        
        <Card>
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane 
              tab={
                <span>
                  <CustomerServiceOutlined />
                  Tất cả ticket
                </span>
              } 
              key="all"
            />
            <TabPane 
              tab={
                <span>
                  <MessageOutlined />
                  Ticket của tôi
                </span>
              } 
              key="my"
            />
            {isStaff && (
              <TabPane 
                tab={
                  <span>
                    <CheckCircleOutlined />
                    Được phân công cho tôi
                  </span>
                } 
                key="assigned"
              />
            )}
          </Tabs>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <Input 
                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            
            <Col xs={24} md={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
                style={{ width: '100%' }}
              >
                Bộ lọc
              </Button>
            </Col>
            
            <Col xs={24} md={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  handleReset();
                  fetchTickets();
                }}
                style={{ width: '100%' }}
              >
                Đặt lại
              </Button>
            </Col>
          </Row>
          
          {showFilters && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={8}>
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
                  <Option value="WAITING_CUSTOMER">Chờ phản hồi</Option>
                  <Option value="RESOLVED">Đã giải quyết</Option>
                  <Option value="CLOSED">Đóng</Option>
                </Select>
              </Col>
              
              <Col xs={24} md={8}>
                <Select
                  placeholder="Lọc theo mức độ ưu tiên"
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
              
              <Col xs={24} md={8}>
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
                  <Option value="REAL_ESTATE">Bất động sản</Option>
                  <Option value="INSURANCE">Bảo hiểm</Option>
                  <Option value="VISA">Visa</Option>
                  <Option value="TAX">Thuế</Option>
                  <Option value="GENERAL">Chung</Option>
                  <Option value="ACCOUNT">Tài khoản</Option>
                  <Option value="BILLING">Thanh toán</Option>
                  <Option value="TECHNICAL">Kỹ thuật</Option>
                  <Option value="SALES">Bán hàng</Option>
                </Select>
              </Col>
            </Row>
          )}
          
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
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: ticketCount,
              showSizeChanger: true,
              showTotal: total => `Tổng cộng ${total} ticket`
            }}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={getEmptyText()}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleCreateClick}
                  >
                    Tạo ticket mới
                  </Button>
                </Empty>
              )
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default TicketList;