import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Spin, 
  Alert, 
  Table, 
  Tag, 
  Tabs,
  Button, 
  List, 
  Avatar, 
  Space,
  Badge,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  ShopOutlined,
  HomeOutlined,
  SafetyOutlined,
  GlobalOutlined,
  FileOutlined,
  SolutionOutlined,
  SettingOutlined,
  PlusOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Content } = Layout;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      new: 0,
      active: 0,
      admins: 0,
      agents: 0,
      support: 0,
      customers: 0
    },
    tickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      waitingCustomer: 0,
      resolved: 0,
      closed: 0
    },
    properties: {
      total: 0,
      active: 0,
      pending: 0,
      sold: 0
    },
    insurance: {
      total: 0,
      active: 0,
      pending: 0,
      expired: 0
    },
    visa: {
      total: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    },
    tax: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    },
    appointments: {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0
    },
    messages: {
      total: 0,
      unread: 0
    }
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập trang quản trị');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  // Fetch admin dashboard data
 // Fetch admin dashboard data
const fetchAdminData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Fetch statistics
    const statsPromises = [
      axios.get('/api/users/admin/statistics'),
      axios.get('/api/tickets/admin/statistics'),
      axios.get('/api/real-estate/admin/statistics'),
      axios.get('/api/insurance/admin/statistics'),
      axios.get('/api/visa/admin/statistics'),
      axios.get('/api/tax/admin/statistics'),
      axios.get('/api/appointments/admin/statistics'),
      axios.get('/api/messages/admin/statistics')
    ];
    
    const responses = await Promise.allSettled(statsPromises);
    
    // Default stats object to ensure all properties exist
    const defaultStats = {
      total: 0,
      new: 0,
      active: 0,
      admins: 0,
      agents: 0,
      support: 0,
      customers: 0,
      open: 0,
      inProgress: 0,
      waitingCustomer: 0,
      resolved: 0, 
      closed: 0,
      pending: 0,
      sold: 0,
      expired: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      unread: 0
    };
    
    // Process the responses - use the fulfilled responses, provide defaults for rejected ones
    const updatedStats = {
      users: responses[0].status === 'fulfilled' ? responses[0].value.data.stats || defaultStats : defaultStats,
      tickets: responses[1].status === 'fulfilled' ? responses[1].value.data.stats || defaultStats : defaultStats,
      properties: responses[2].status === 'fulfilled' ? responses[2].value.data.stats || defaultStats : defaultStats,
      insurance: responses[3].status === 'fulfilled' ? responses[3].value.data.stats || defaultStats : defaultStats,
      visa: responses[4].status === 'fulfilled' ? responses[4].value.data.stats || defaultStats : defaultStats,
      tax: responses[5].status === 'fulfilled' ? responses[5].value.data.stats || defaultStats : defaultStats,
      appointments: responses[6].status === 'fulfilled' ? responses[6].value.data.stats || defaultStats : defaultStats,
      messages: responses[7].status === 'fulfilled' ? responses[7].value.data.stats || defaultStats : defaultStats
    };
    
    setStats(updatedStats);
    
    try {
      // Fetch recent users
      const recentUsersResponse = await axios.get('/api/users?sort=-created_at&limit=5');
      setRecentUsers(recentUsersResponse.data.users || []);
    } catch (err) {
      console.error('Error fetching recent users:', err);
      // Continue execution, don't stop if this fails
    }
    
    try {
      // Fetch recent tickets
      const recentTicketsResponse = await axios.get('/api/tickets?sort=-created_at&limit=5');
      setRecentTickets(recentTicketsResponse.data.tickets || []);
    } catch (err) {
      console.error('Error fetching recent tickets:', err);
      // Continue execution
    }
    
    try {
      // Fetch recent appointments
      const recentAppointmentsResponse = await axios.get('/api/appointments?sort=-created_at&limit=5');
      setRecentAppointments(recentAppointmentsResponse.data.appointments || []);
    } catch (err) {
      console.error('Error fetching recent appointments:', err);
      // Continue execution
    }
    
  } catch (err) {
    console.error('Error fetching admin dashboard data:', err);
    setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.');
  } finally {
    setLoading(false);
  }
};
  
  useEffect(() => {
    fetchAdminData();
  }, []);
  
  const handleRefresh = () => {
    fetchAdminData();
  };
  
  // Format date
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };
  
  // Format time from now
  const formatTimeFromNow = (dateString) => {
    return moment(dateString).fromNow();
  };
  
  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'AGENT': return 'blue';
      case 'SUPPORT': return 'green';
      default: return 'default';
    }
  };
  
  // Get status color
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
  
  // Get ticket priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      case 'URGENT': return 'volcano';
      default: return 'blue';
    }
  };
  
  // Recent users columns
  const userColumns = [
    {
      title: 'Tên người dùng',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/dashboard/admin/users/${record._id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];
  
  // Recent tickets columns
  const ticketColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            #{record._id.slice(-6)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: (client) => client?.username || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatTimeFromNow(date),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/dashboard/tickets/${record._id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];
  
  // Recent appointments columns
  const appointmentColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: (client) => client?.username || 'N/A',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'staff',
      key: 'staff',
      render: (staff) => staff?.username || 'N/A',
    },
    {
      title: 'Thời gian',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime) => formatDate(startTime),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        
        switch (status) {
          case 'SCHEDULED': color = 'processing'; break;
          case 'COMPLETED': color = 'success'; break;
          case 'CANCELLED': color = 'error'; break;
          case 'RESCHEDULED': color = 'warning'; break;
          default: color = 'default';
        }
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/dashboard/appointments/${record._id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={handleRefresh}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <Layout style={{ padding: 0, background: 'transparent' }}>
      <Content>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>Bảng điều khiển quản trị</Title>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
          >
            Làm mới dữ liệu
          </Button>
        </div>

        {/* Phần thống kê tổng quan */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="Tổng số người dùng"
                value={stats.users.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <ArrowUpOutlined style={{ color: '#52c41a' }} /> {stats.users.new} người dùng mới trong tháng này
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="Ticket hỗ trợ"
                value={stats.tickets.total}
                prefix={<CustomerServiceOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="processing" text={`${stats.tickets.open} ticket đang mở`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="Bất động sản"
                value={stats.properties.total}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="success" text={`${stats.properties.active} đang hiển thị`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title="Lịch hẹn"
                value={stats.appointments.total}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="processing" text={`${stats.appointments.scheduled} đã lên lịch`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Hợp đồng bảo hiểm"
                value={stats.insurance.total}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="success" text={`${stats.insurance.active} đang hoạt động`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Hồ sơ Visa"
                value={stats.visa.total}
                prefix={<GlobalOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="processing" text={`${stats.visa.submitted} đang xử lý`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Hồ sơ Thuế"
                value={stats.tax.total}
                prefix={<FileOutlined />}
                valueStyle={{ color: '#fa541c' }}
              />
              <div style={{ marginTop: 8 }}>
                <Badge status="warning" text={`${stats.tax.inProgress} đang xử lý`} style={{ display: 'block' }} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tabs Section */}
        <Card style={{ marginTop: 16 }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={
                <span>
                  <TeamOutlined />
                  Người dùng
                </span>
              } 
              key="1"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>Người dùng mới đăng ký</Title>
                <Button 
                  type="primary" 
                  icon={<UserOutlined />}
                  onClick={() => navigate('/dashboard/admin/users')}
                >
                  Quản lý người dùng
                </Button>
              </div>
              <Table 
                columns={userColumns} 
                dataSource={recentUsers} 
                rowKey="_id"
                pagination={false}
                size="middle"
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <CustomerServiceOutlined />
                  Ticket hỗ trợ
                </span>
              } 
              key="2"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>Ticket hỗ trợ gần đây</Title>
                <Button 
                  type="primary" 
                  icon={<CustomerServiceOutlined />}
                  onClick={() => navigate('/dashboard/admin/tickets')}
                >
                  Quản lý ticket
                </Button>
              </div>
              <Table 
                columns={ticketColumns} 
                dataSource={recentTickets} 
                rowKey="_id"
                pagination={false}
                size="middle"
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <CalendarOutlined />
                  Lịch hẹn
                </span>
              } 
              key="3"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>Lịch hẹn sắp tới</Title>
                <Button 
                  type="primary" 
                  icon={<CalendarOutlined />}
                  onClick={() => navigate('/dashboard/admin/appointments')}
                >
                  Quản lý lịch hẹn
                </Button>
              </div>
              <Table 
                columns={appointmentColumns} 
                dataSource={recentAppointments} 
                rowKey="_id"
                pagination={false}
                size="middle"
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Hệ thống
                </span>
              } 
              key="4"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>Cài đặt hệ thống</Title>
                <Button 
                  type="primary" 
                  icon={<SettingOutlined />}
                  onClick={() => navigate('/dashboard/admin/settings')}
                >
                  Cấu hình hệ thống
                </Button>
              </div>
              
              <Card title="Trạng thái dịch vụ" bordered={false}>
                <List
                  size="large"
                  bordered={false}
                  dataSource={[
                    { name: 'Hệ thống email', status: 'Hoạt động', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                    { name: 'Lưu trữ file', status: 'Hoạt động', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                    { name: 'Bảo mật', status: 'Hoạt động', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                    { name: 'Lịch trình tự động', status: 'Hoạt động', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={item.icon}
                        title={item.name}
                        description={item.status}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          </Tabs>
        </Card>

        {/* Quick Action Shortcuts */}
        <Card title="Truy cập nhanh" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/users')}
                style={{ textAlign: 'center' }}
              >
                <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div style={{ marginTop: 8 }}>Quản lý người dùng</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/properties')}
                style={{ textAlign: 'center' }}
              >
                <HomeOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                <div style={{ marginTop: 8 }}>Bất động sản</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/insurance')}
                style={{ textAlign: 'center' }}
              >
                <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div style={{ marginTop: 8 }}>Bảo hiểm</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/visa')}
                style={{ textAlign: 'center' }}
              >
                <GlobalOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                <div style={{ marginTop: 8 }}>Visa</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/tax')}
                style={{ textAlign: 'center' }}
              >
                <FileOutlined style={{ fontSize: 24, color: '#fa541c' }} />
                <div style={{ marginTop: 8 }}>Thuế</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/tickets')}
                style={{ textAlign: 'center' }}
              >
                <CustomerServiceOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div style={{ marginTop: 8 }}>Ticket hỗ trợ</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => navigate('/dashboard/admin/appointments')}
                style={{ textAlign: 'center' }}
              >
                <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div style={{ marginTop: 8 }}>Lịch gặp</div>
              </Card>
            </Col>
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminDashboard;