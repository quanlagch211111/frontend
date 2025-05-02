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
  TimePicker,
  Breadcrumb,
  Divider,
  Avatar,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/es/date-picker/locale/vi_VN';

moment.locale('vi');

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { confirm } = Modal;

const AppointmentManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [sortField, setSortField] = useState('startTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create appointment modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit appointment modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editForm] = Form.useForm();
  
  // Change status modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [changingAppointmentId, setChangingAppointmentId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusForm] = Form.useForm();
  const [changingStatus, setChangingStatus] = useState(false);
  
  // Service types and staff lists
  const [services, setServices] = useState([]);
  const [serviceType, setServiceType] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý lịch hẹn');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchAppointments = async () => {
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
      
      if (serviceTypeFilter) {
        params.append('serviceType', serviceTypeFilter);
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/appointments/admin/all?${params.toString()}`);
      
      if (response.data.success) {
        setAppointments(response.data.appointments);
        setAppointmentCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch staff members for assignment
  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      const response = await axios.get('/api/users?role=AGENT,SUPPORT,ADMIN');
      
      if (response.data.success) {
        setStaffMembers(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingStaff(false);
    }
  };
  
  // Fetch services based on service type
  const fetchServicesByType = async (type) => {
    if (!type) return;
    
    try {
      setLoadingServices(true);
      setServices([]);
      
      // Different API endpoints based on service type
      let endpoint = '/api/services';
      switch (type) {
        case 'REAL_ESTATE':
          endpoint = '/api/real-estate';
          break;
        case 'INSURANCE':
          endpoint = '/api/insurance/products';
          break;
        case 'VISA':
          endpoint = '/api/visa/services';
          break;
        case 'TAX':
          endpoint = '/api/tax/services';
          break;
        default:
          endpoint = '/api/services';
      }
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setServices(
          response.data.services ||
          response.data.properties ||
          response.data.products ||
          response.data.visaServices ||
          response.data.taxServices ||
          []
        );
      }
    } catch (err) {
      console.error(`Error fetching services for type ${type}:`, err);
      toast.error(`Không thể tải danh sách dịch vụ ${type}`);
    } finally {
      setLoadingServices(false);
    }
  };
  
  useEffect(() => {
    fetchAppointments();
    fetchStaffMembers();
  }, [page, pageSize, statusFilter, serviceTypeFilter, sortField, sortDirection]);
  
  // Fetch services when service type changes
  useEffect(() => {
    if (serviceType) {
      fetchServicesByType(serviceType);
    }
  }, [serviceType]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchAppointments();
  };
  
  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setServiceTypeFilter('');
    setDateRange(null);
    setSortField('startTime');
    setSortDirection('desc');
    setPage(1);
    fetchAppointments();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create appointment functions
  const showCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      date: moment(),
      timeRange: [moment().hour(9).minute(0), moment().hour(10).minute(0)],
      serviceType: 'CONSULTATION',
      status: 'SCHEDULED'
    });
    setServiceType('CONSULTATION');
    setCreateModalVisible(true);
  };
  
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };
  
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const date = values.date.format('YYYY-MM-DD');
      const startTime = values.timeRange[0].format('HH:mm:ss');
      const endTime = values.timeRange[1].format('HH:mm:ss');
      
      // Combine date and time
      const startDateTime = `${date}T${startTime}`;
      const endDateTime = `${date}T${endTime}`;
      
      const appointmentData = {
        title: values.title,
        description: values.description,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
        client: values.client, // ID of client
        staff: values.staff, // ID of staff
        serviceType: values.serviceType,
        serviceId: values.serviceId,
        location: values.location,
        status: values.status
      };
      
      const response = await axios.post('/api/appointments', appointmentData);
      
      if (response.data.success) {
        toast.success('Tạo lịch hẹn mới thành công');
        setCreateModalVisible(false);
        fetchAppointments();
      } else {
        toast.error(response.data.message || 'Tạo lịch hẹn thất bại');
      }
    } catch (err) {
      console.error('Create appointment error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo lịch hẹn');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit appointment functions
  const showEditModal = (appointment) => {
    setEditingAppointment(appointment);
    
    // Convert ISO date strings to moment objects
    const startTime = moment(appointment.startTime);
    const endTime = moment(appointment.endTime);
    
    editForm.setFieldsValue({
      title: appointment.title,
      description: appointment.description,
      date: startTime,
      timeRange: [startTime, endTime],
      client: appointment.client?._id,
      staff: appointment.staff?._id,
      serviceType: appointment.serviceType,
      serviceId: appointment.serviceId,
      location: appointment.location,
      status: appointment.status
    });
    
    setServiceType(appointment.serviceType);
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingAppointment(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const date = values.date.format('YYYY-MM-DD');
      const startTime = values.timeRange[0].format('HH:mm:ss');
      const endTime = values.timeRange[1].format('HH:mm:ss');
      
      // Combine date and time
      const startDateTime = `${date}T${startTime}`;
      const endDateTime = `${date}T${endTime}`;
      
      const appointmentData = {
        title: values.title,
        description: values.description,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
        client: values.client,
        staff: values.staff,
        serviceType: values.serviceType,
        serviceId: values.serviceId,
        location: values.location,
        status: values.status
      };
      
      const response = await axios.put(`/api/appointments/${editingAppointment._id}`, appointmentData);
      
      if (response.data.success) {
        toast.success('Cập nhật lịch hẹn thành công');
        setEditModalVisible(false);
        fetchAppointments();
      } else {
        toast.error(response.data.message || 'Cập nhật lịch hẹn thất bại');
      }
    } catch (err) {
      console.error('Edit appointment error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật lịch hẹn');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete appointment function
  const showDeleteConfirm = (appointment) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa lịch hẹn này?',
      icon: <ExclamationCircleOutlined />,
      content: `Tiêu đề: ${appointment.title}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/appointments/${appointment._id}`);
          
          if (response.data.success) {
            toast.success('Xóa lịch hẹn thành công');
            fetchAppointments();
          } else {
            toast.error(response.data.message || 'Xóa lịch hẹn thất bại');
          }
        } catch (err) {
          console.error('Delete appointment error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa lịch hẹn');
        }
      }
    });
  };
  
  // Change status functions
  const showStatusModal = (appointmentId) => {
    const appointment = appointments.find(a => a._id === appointmentId);
    setChangingAppointmentId(appointmentId);
    setNewStatus(appointment.status);
    statusForm.setFieldsValue({
      status: appointment.status,
      notes: ''
    });
    setStatusModalVisible(true);
  };
  
  const handleStatusCancel = () => {
    setStatusModalVisible(false);
    setChangingAppointmentId(null);
  };
  
  const handleStatusSubmit = async () => {
    try {
      const values = await statusForm.validateFields();
      setChangingStatus(true);
      
      const response = await axios.put(`/api/appointments/${changingAppointmentId}/status`, {
        status: values.status,
        notes: values.notes
      });
      
      if (response.data.success) {
        toast.success(`Trạng thái lịch hẹn đã được cập nhật thành ${getStatusText(values.status)}`);
        setStatusModalVisible(false);
        fetchAppointments();
      } else {
        toast.error(response.data.message || 'Cập nhật trạng thái lịch hẹn thất bại');
      }
    } catch (err) {
      console.error('Change status error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật trạng thái');
    } finally {
      setChangingStatus(false);
    }
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
  
  // Utilities
  const getServiceTypeText = (type) => {
    switch (type) {
      case 'CONSULTATION': return 'Tư vấn';
      case 'REAL_ESTATE': return 'Bất động sản';
      case 'INSURANCE': return 'Bảo hiểm';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Thuế';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  };
  
  const getServiceTypeColor = (type) => {
    switch (type) {
      case 'CONSULTATION': return 'blue';
      case 'REAL_ESTATE': return 'green';
      case 'INSURANCE': return 'purple';
      case 'VISA': return 'magenta';
      case 'TAX': return 'orange';
      case 'OTHER': return 'default';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'RESCHEDULED': return 'Đã đổi lịch';
      default: return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'RESCHEDULED': return 'warning';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED': return <ClockCircleOutlined />;
      case 'COMPLETED': return <CheckCircleOutlined />;
      case 'CANCELLED': return <CloseCircleOutlined />;
      case 'RESCHEDULED': return <SyncOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const formatTime = (dateString) => {
    return moment(dateString).format('HH:mm');
  };
  
  const formatDateTime = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };
  
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
            {getServiceTypeText(record.serviceType)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: client => client ? (
        <Space>
          <Avatar
            src={client.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{client.username}</Text>
        </Space>
      ) : (
        <Text type="secondary">N/A</Text>
      ),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'staff',
      key: 'staff',
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
      title: 'Ngày',
      dataIndex: 'startTime',
      key: 'date',
      sorter: true,
      render: (startTime, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatDate(startTime)}</Text>
          <Text type="secondary">
            {formatTime(startTime)} - {formatTime(record.endTime)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceType',
      key: 'serviceType',
      filters: [
        { text: 'Tư vấn', value: 'CONSULTATION' },
        { text: 'Bất động sản', value: 'REAL_ESTATE' },
        { text: 'Bảo hiểm', value: 'INSURANCE' },
        { text: 'Visa', value: 'VISA' },
        { text: 'Thuế', value: 'TAX' },
        { text: 'Khác', value: 'OTHER' },
      ],
      render: type => <Tag color={getServiceTypeColor(type)}>{getServiceTypeText(type)}</Tag>,
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      responsive: ['lg'],
      render: location => location ? (
        <Space>
          <EnvironmentOutlined />
          <Text>{location}</Text>
        </Space>
      ) : (
        <Text type="secondary">Chưa có</Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Đã lên lịch', value: 'SCHEDULED' },
        { text: 'Đã hoàn thành', value: 'COMPLETED' },
        { text: 'Đã hủy', value: 'CANCELLED' },
        { text: 'Đã đổi lịch', value: 'RESCHEDULED' },
      ],
      render: status => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
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
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/dashboard/appointments/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái">
            <Button 
              type="default" 
              size="small" 
              icon={getStatusIcon(record.status)} 
              onClick={() => showStatusModal(record._id)}
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
              <Breadcrumb.Item>Quản lý lịch hẹn</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Quản lý lịch hẹn
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm lịch hẹn mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={7}>
              <Input 
                placeholder="Tìm kiếm theo tiêu đề, khách hàng..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} md={5}>
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
                <Option value="SCHEDULED">Đã lên lịch</Option>
                <Option value="COMPLETED">Đã hoàn thành</Option>
                <Option value="CANCELLED">Đã hủy</Option>
                <Option value="RESCHEDULED">Đã đổi lịch</Option>
              </Select>
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Lọc theo loại dịch vụ"
                style={{ width: '100%' }}
                value={serviceTypeFilter}
                onChange={value => {
                  setServiceTypeFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="CONSULTATION">Tư vấn</Option>
                <Option value="REAL_ESTATE">Bất động sản</Option>
                <Option value="INSURANCE">Bảo hiểm</Option>
                <Option value="VISA">Visa</Option>
                <Option value="TAX">Thuế</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </Col>
            <Col xs={24} md={7}>
              <Space>
                <RangePicker 
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
                  style={{ width: 230 }}
                />
                <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </Space>
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
            dataSource={appointments}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: appointmentCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} lịch hẹn`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Appointment Modal */}
        <Modal
          title="Thêm lịch hẹn mới"
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
                  name="staff"
                  label="Nhân viên phụ trách"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên phụ trách' }]}
                >
                  <Select
                    placeholder="Chọn nhân viên"
                    showSearch
                    loading={loadingStaff}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {staffMembers.map(staff => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.username} ({staff.role})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Tiêu đề cuộc hẹn"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề cuộc hẹn' }]}
                >
                  <Input placeholder="Nhập tiêu đề cuộc hẹn" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="date"
                  label="Ngày hẹn"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                    disabledDate={current => {
                      // Disable dates before today
                      return current && current < moment().startOf('day');
                    }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="timeRange"
                  label="Thời gian"
                  rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                >
                  <TimePicker.RangePicker 
                    style={{ width: '100%' }} 
                    format="HH:mm"
                    minuteStep={15}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="serviceType"
                  label="Loại dịch vụ"
                  rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
                >
                  <Select 
                    placeholder="Chọn loại dịch vụ"
                    onChange={(value) => setServiceType(value)}
                  >
                    <Option value="CONSULTATION">Tư vấn</Option>
                    <Option value="REAL_ESTATE">Bất động sản</Option>
                    <Option value="INSURANCE">Bảo hiểm</Option>
                    <Option value="VISA">Visa</Option>
                    <Option value="TAX">Thuế</Option>
                    <Option value="OTHER">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="serviceId"
                  label="Dịch vụ cụ thể"
                >
                  <Select
                    placeholder="Chọn dịch vụ"
                    loading={loadingServices}
                    disabled={!serviceType || serviceType === 'OTHER' || services.length === 0}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {services.map(service => (
                      <Option key={service._id || service.id} value={service._id || service.id}>
                        {service.title || service.name || service.policyName || service.description || 'Dịch vụ'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="location"
                  label="Địa điểm"
                >
                  <Input 
                    placeholder="Nhập địa điểm cuộc hẹn" 
                    prefix={<EnvironmentOutlined />} 
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="SCHEDULED">Đã lên lịch</Option>
                    <Option value="COMPLETED">Đã hoàn thành</Option>
                    <Option value="CANCELLED">Đã hủy</Option>
                    <Option value="RESCHEDULED">Đã đổi lịch</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                >
                  <TextArea rows={4} placeholder="Nhập mô tả chi tiết về cuộc hẹn" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Appointment Modal */}
        <Modal
          title="Chỉnh sửa lịch hẹn"
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
          {editingAppointment && (
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
                    name="staff"
                    label="Nhân viên phụ trách"
                    rules={[{ required: true, message: 'Vui lòng chọn nhân viên phụ trách' }]}
                  >
                    <Select
                      placeholder="Chọn nhân viên"
                      showSearch
                      loading={loadingStaff}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {staffMembers.map(staff => (
                        <Option key={staff._id} value={staff._id}>
                          {staff.username} ({staff.role})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="title"
                    label="Tiêu đề cuộc hẹn"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề cuộc hẹn' }]}
                  >
                    <Input placeholder="Nhập tiêu đề cuộc hẹn" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="date"
                    label="Ngày hẹn"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="timeRange"
                    label="Thời gian"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                  >
                    <TimePicker.RangePicker 
                      style={{ width: '100%' }} 
                      format="HH:mm"
                      minuteStep={15}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="serviceType"
                    label="Loại dịch vụ"
                    rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
                  >
                    <Select 
                      placeholder="Chọn loại dịch vụ"
                      onChange={(value) => setServiceType(value)}
                    >
                      <Option value="CONSULTATION">Tư vấn</Option>
                      <Option value="REAL_ESTATE">Bất động sản</Option>
                      <Option value="INSURANCE">Bảo hiểm</Option>
                      <Option value="VISA">Visa</Option>
                      <Option value="TAX">Thuế</Option>
                      <Option value="OTHER">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="serviceId"
                    label="Dịch vụ cụ thể"
                  >
                    <Select
                      placeholder="Chọn dịch vụ"
                      loading={loadingServices}
                      disabled={!serviceType || serviceType === 'OTHER' || services.length === 0}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {services.map(service => (
                        <Option key={service._id || service.id} value={service._id || service.id}>
                          {service.title || service.name || service.policyName || service.description || 'Dịch vụ'}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="location"
                    label="Địa điểm"
                  >
                    <Input 
                      placeholder="Nhập địa điểm cuộc hẹn" 
                      prefix={<EnvironmentOutlined />} 
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="SCHEDULED">Đã lên lịch</Option>
                      <Option value="COMPLETED">Đã hoàn thành</Option>
                      <Option value="CANCELLED">Đã hủy</Option>
                      <Option value="RESCHEDULED">Đã đổi lịch</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                  >
                    <TextArea rows={4} placeholder="Nhập mô tả chi tiết về cuộc hẹn" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>
        
        {/* Change Status Modal */}
        <Modal
          title="Thay đổi trạng thái lịch hẹn"
          visible={statusModalVisible}
          onCancel={handleStatusCancel}
          footer={[
            <Button key="back" onClick={handleStatusCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={changingStatus} 
              onClick={handleStatusSubmit}
            >
              Cập nhật
            </Button>,
          ]}
        >
          <Form
            form={statusForm}
            layout="vertical"
            requiredMark={true}
          >
            <Form.Item
              name="status"
              label="Trạng thái mới"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái mới' }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="SCHEDULED">
                  <Space>
                    <ClockCircleOutlined />
                    <span>Đã lên lịch</span>
                  </Space>
                </Option>
                <Option value="COMPLETED">
                  <Space>
                    <CheckCircleOutlined />
                    <span>Đã hoàn thành</span>
                  </Space>
                </Option>
                <Option value="CANCELLED">
                  <Space>
                    <CloseCircleOutlined />
                    <span>Đã hủy</span>
                  </Space>
                </Option>
                <Option value="RESCHEDULED">
                  <Space>
                    <SyncOutlined />
                    <span>Đã đổi lịch</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Ghi chú"
            >
              <TextArea rows={4} placeholder="Nhập ghi chú về thay đổi trạng thái này (nếu có)" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default AppointmentManagement;