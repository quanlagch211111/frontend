import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Card,
  Button,
  Table,
  Space,
  Tag,
  Typography,
  Breadcrumb,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Spin,
  Empty,
  Alert,
  Tabs,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const AppointmentList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    dateRange: []
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  // Fetch appointments with filters
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        page,
        limit: pageSize
      };

      // Add filters
      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.serviceType) {
        params.serviceType = filters.serviceType;
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      // For staff-specific or user-specific views
      if (activeTab === 'assigned') {
        const response = await axios.get('/api/appointments/staff/appointments', { params });
        setAppointments(response.data.appointments);
        setTotal(response.data.count);
      } else if (activeTab === 'mine') {
        const response = await axios.get('/api/appointments/user/appointments', { params });
        setAppointments(response.data.appointments);
        setTotal(response.data.count);
      } else {
        // All appointments (based on user role)
        const response = await axios.get('/api/appointments', { params });
        setAppointments(response.data.appointments);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách cuộc hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, pageSize, filters, activeTab]);

  const handleTabChange = (activeKey) => {
    setActiveTab(activeKey);
    setPage(1); // Reset to first page when changing tabs
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
    setPage(1); // Reset to first page when changing filters
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      serviceType: '',
      dateRange: []
    });
    setPage(1);
  };

  const handleCreateClick = () => {
    navigate('/dashboard/appointments/create');
  };

  const handleViewDetails = (id) => {
    navigate(`/dashboard/appointments/${id}`);
  };

  const handleEditClick = (id) => {
    navigate(`/dashboard/appointments/edit/${id}`);
  };

  // Function to get status color for tags
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'RESCHEDULED': return 'warning';
      default: return 'default';
    }
  };

  // Function to get status text in Vietnamese
  const getStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'RESCHEDULED': return 'Đã đổi lịch';
      default: return status;
    }
  };

  // Function to get service type text
  const getServiceTypeText = (type) => {
    switch (type) {
      case 'REAL_ESTATE': return 'Bất động sản';
      case 'INSURANCE': return 'Bảo hiểm';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Thuế';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getServiceTypeText(record.serviceType)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{moment(text).format('DD/MM/YYYY')}</Text>
          <Text type="secondary">
            {moment(record.startTime).format('HH:mm')} - {moment(record.endTime).format('HH:mm')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: (client) => (
        <Space>
          <UserOutlined />
          <Text>{client.username}</Text>
        </Space>
      ),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'staff',
      key: 'staff',
      render: (staff) => (
        <Space>
          <UserOutlined />
          <Text>{staff.username}</Text>
        </Space>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        location ? (
          <Space>
            <EnvironmentOutlined />
            <Text>{location}</Text>
          </Space>
        ) : (
          <Text type="secondary">Không có</Text>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record._id)}
            />
          </Tooltip>
          {['ADMIN', 'AGENT', 'SUPPORT'].includes(currentUser?.role) && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditClick(record._id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Determine if current user can see certain tabs
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = ['ADMIN', 'AGENT', 'SUPPORT'].includes(currentUser?.role);

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Trang chủ
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Quản lý cuộc hẹn</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
            >
              Đặt lịch hẹn mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Title level={4}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Danh sách cuộc hẹn
            </Title>
          </Col>

          <Col flex="auto">
            <Row gutter={16} justify="end">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Input
                  placeholder="Tìm kiếm theo tiêu đề"
                  prefix={<SearchOutlined />}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Col>
              <Col>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  type={showAdvancedFilters ? 'primary' : 'default'}
                >
                  Bộ lọc
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>

        {showAdvancedFilters && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Trạng thái"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="SCHEDULED">Đã lên lịch</Option>
                  <Option value="COMPLETED">Đã hoàn thành</Option>
                  <Option value="CANCELLED">Đã hủy</Option>
                  <Option value="RESCHEDULED">Đã đổi lịch</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Loại dịch vụ"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.serviceType}
                  onChange={(value) => handleFilterChange('serviceType', value)}
                >
                  <Option value="REAL_ESTATE">Bất động sản</Option>
                  <Option value="INSURANCE">Bảo hiểm</Option>
                  <Option value="VISA">Visa</Option>
                  <Option value="TAX">Thuế</Option>
                  <Option value="OTHER">Khác</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                  value={filters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                />
              </Col>
            </Row>
            <Row justify="end" style={{ marginTop: 16 }}>
              <Button onClick={clearFilters}>Xóa bộ lọc</Button>
            </Row>
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ marginTop: 16 }}
        >
          <TabPane tab="Tất cả cuộc hẹn" key="all" />
          <TabPane
            tab={
              <Badge count={activeTab === 'mine' ? undefined : null} dot>
                Cuộc hẹn của tôi
              </Badge>
            }
            key="mine"
          />
          {isStaff && (
            <TabPane
              tab={
                <Badge count={activeTab === 'assigned' ? undefined : null} dot>
                  Phân công cho tôi
                </Badge>
              }
              key="assigned"
            />
          )}
        </Tabs>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Lỗi" description={error} type="error" showIcon />
        ) : appointments.length === 0 ? (
          <Empty
            description="Không có cuộc hẹn nào trong khoảng thời gian này"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreateClick}>
              Đặt lịch hẹn mới
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="_id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              onChange: (page, pageSize) => {
                setPage(page);
                setPageSize(pageSize);
              },
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} cuộc hẹn`
            }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </Layout>
  );
};

export default AppointmentList;