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
  InputNumber,
  DatePicker,
  Breadcrumb,
  Divider,
  Avatar,
  Image
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  SafetyOutlined,
  UserOutlined,
  FileProtectOutlined
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
const { confirm } = Modal;

const InsuranceManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policyCount, setPolicyCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create policy modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit policy modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editForm] = Form.useForm();
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý bảo hiểm');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      
      if (search) {
        params.append('search', search);
      }
      
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (providerFilter) {
        params.append('provider', providerFilter);
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/insurance/admin/all-policies?${params.toString()}`);
      
      if (response.data.success) {
        setPolicies(response.data.policies);
        setPolicyCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch insurance policies');
      }
    } catch (err) {
      console.error('Error fetching insurance policies:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching insurance policies');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPolicies();
  }, [page, pageSize, typeFilter, statusFilter, providerFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchPolicies();
  };
  
  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setProviderFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchPolicies();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create policy functions
  const showCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: 'PENDING',
      type: 'HEALTH',
      'coverageDetails.paymentFrequency': 'MONTHLY',
      'coverageDetails.dateRange': [moment(), moment().add(1, 'year')]
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
      
      // Format data for API
      const policyData = {
        type: values.type,
        provider: values.provider,
        policyNumber: values.policyNumber,
        description: values.description,
        status: values.status,
        coverageDetails: {
          startDate: values['coverageDetails.dateRange'][0].toISOString(),
          endDate: values['coverageDetails.dateRange'][1].toISOString(),
          coverageAmount: Number(values['coverageDetails.coverageAmount']),
          premium: Number(values['coverageDetails.premium']),
          paymentFrequency: values['coverageDetails.paymentFrequency']
        },
        policyholder: values.policyholder // ID of policyholder
      };
      
      const response = await axios.post('/api/insurance', policyData);
      
      if (response.data.success) {
        toast.success('Tạo hợp đồng bảo hiểm mới thành công');
        setCreateModalVisible(false);
        fetchPolicies();
      } else {
        toast.error(response.data.message || 'Tạo hợp đồng bảo hiểm thất bại');
      }
    } catch (err) {
      console.error('Create policy error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo hợp đồng bảo hiểm');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit policy functions
  const showEditModal = (policy) => {
    setEditingPolicy(policy);
    editForm.setFieldsValue({
      type: policy.type,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      description: policy.description,
      status: policy.status,
      'coverageDetails.coverageAmount': policy.coverageDetails?.coverageAmount,
      'coverageDetails.premium': policy.coverageDetails?.premium,
      'coverageDetails.paymentFrequency': policy.coverageDetails?.paymentFrequency,
      'coverageDetails.dateRange': [
        moment(policy.coverageDetails?.startDate),
        moment(policy.coverageDetails?.endDate)
      ],
      policyholder: policy.policyholder?._id
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingPolicy(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const policyData = {
        type: values.type,
        provider: values.provider,
        policyNumber: values.policyNumber,
        description: values.description,
        status: values.status,
        coverageDetails: {
          startDate: values['coverageDetails.dateRange'][0].toISOString(),
          endDate: values['coverageDetails.dateRange'][1].toISOString(),
          coverageAmount: Number(values['coverageDetails.coverageAmount']),
          premium: Number(values['coverageDetails.premium']),
          paymentFrequency: values['coverageDetails.paymentFrequency']
        },
        policyholder: values.policyholder
      };
      
      const response = await axios.put(`/api/insurance/${editingPolicy._id}`, policyData);
      
      if (response.data.success) {
        toast.success('Cập nhật hợp đồng bảo hiểm thành công');
        setEditModalVisible(false);
        fetchPolicies();
      } else {
        toast.error(response.data.message || 'Cập nhật hợp đồng bảo hiểm thất bại');
      }
    } catch (err) {
      console.error('Edit policy error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật hợp đồng bảo hiểm');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete policy function
  const showDeleteConfirm = (policy) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa hợp đồng bảo hiểm này?',
      icon: <ExclamationCircleOutlined />,
      content: `Mã hợp đồng: ${policy.policyNumber || policy._id}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/insurance/${policy._id}`);
          
          if (response.data.success) {
            toast.success('Xóa hợp đồng bảo hiểm thành công');
            fetchPolicies();
          } else {
            toast.error(response.data.message || 'Xóa hợp đồng bảo hiểm thất bại');
          }
        } catch (err) {
          console.error('Delete policy error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa hợp đồng bảo hiểm');
        }
      }
    });
  };
  
  // Utilities
  const getTypeLabel = (type) => {
    switch (type) {
      case 'LIFE': return 'Bảo hiểm nhân thọ';
      case 'HEALTH': return 'Bảo hiểm sức khỏe';
      case 'AUTO': return 'Bảo hiểm xe';
      case 'HOME': return 'Bảo hiểm nhà';
      case 'TRAVEL': return 'Bảo hiểm du lịch';
      default: return type;
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'LIFE': return 'magenta';
      case 'HEALTH': return 'green';
      case 'AUTO': return 'blue';
      case 'HOME': return 'orange';
      case 'TRAVEL': return 'purple';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'EXPIRED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'PENDING': return 'Đang chờ xử lý';
      case 'EXPIRED': return 'Đã hết hạn';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const getPaymentFrequencyText = (frequency) => {
    switch (frequency) {
      case 'MONTHLY': return 'Hàng tháng';
      case 'QUARTERLY': return 'Hàng quý';
      case 'SEMI_ANNUALLY': return 'Nửa năm';
      case 'ANNUALLY': return 'Hàng năm';
      case 'ONE_TIME': return 'Một lần';
      default: return frequency;
    }
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
      title: 'Mã hợp đồng',
      dataIndex: 'policyNumber',
      key: 'policyNumber',
      render: (policyNumber, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{policyNumber || '(Chưa có mã)'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {formatDate(record.created_at)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'policyholder',
      key: 'policyholder',
      render: policyholder => (
        <Space>
          <Avatar
            src={policyholder?.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{policyholder?.username || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Bảo hiểm nhân thọ', value: 'LIFE' },
        { text: 'Bảo hiểm sức khỏe', value: 'HEALTH' },
        { text: 'Bảo hiểm xe', value: 'AUTO' },
        { text: 'Bảo hiểm nhà', value: 'HOME' },
        { text: 'Bảo hiểm du lịch', value: 'TRAVEL' },
      ],
      render: type => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'provider',
      key: 'provider',
      responsive: ['md'],
    },
    {
      title: 'Phí BH',
      dataIndex: 'coverageDetails',
      key: 'premium',
      sorter: true,
      render: coverageDetails => (
        <Text style={{ fontWeight: 500, color: '#f50' }}>
          {coverageDetails?.premium ? formatPrice(coverageDetails.premium) : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Hiệu lực',
      dataIndex: 'coverageDetails',
      key: 'dates',
      responsive: ['lg'],
      render: coverageDetails => (
        <Space direction="vertical" size={0}>
          <Text>Từ: {formatDate(coverageDetails?.startDate)}</Text>
          <Text>Đến: {formatDate(coverageDetails?.endDate)}</Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Đang hoạt động', value: 'ACTIVE' },
        { text: 'Đang chờ xử lý', value: 'PENDING' },
        { text: 'Đã hết hạn', value: 'EXPIRED' },
        { text: 'Đã hủy', value: 'CANCELLED' },
      ],
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
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
              onClick={() => navigate(`/dashboard/insurance/${record._id}`)}
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

  // Get available policyholders
  const [policyholders, setPolicyholders] = useState([]);
  const [loadingPolicyholders, setLoadingPolicyholders] = useState(false);

  const fetchPolicyholders = async () => {
    try {
      setLoadingPolicyholders(true);
      const response = await axios.get('/api/users?role=USER');
      if (response.data.success) {
        setPolicyholders(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching policyholders:', err);
    } finally {
      setLoadingPolicyholders(false);
    }
  };

  useEffect(() => {
    fetchPolicyholders();
  }, []);

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
              <Breadcrumb.Item>Quản lý bảo hiểm</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <SafetyOutlined style={{ marginRight: 8 }} />
                Quản lý hợp đồng bảo hiểm
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm hợp đồng bảo hiểm mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input 
                placeholder="Tìm kiếm theo mã, nhà cung cấp..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Lọc theo loại bảo hiểm"
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={value => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="LIFE">Bảo hiểm nhân thọ</Option>
                <Option value="HEALTH">Bảo hiểm sức khỏe</Option>
                <Option value="AUTO">Bảo hiểm xe</Option>
                <Option value="HOME">Bảo hiểm nhà</Option>
                <Option value="TRAVEL">Bảo hiểm du lịch</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
                <Option value="ACTIVE">Đang hoạt động</Option>
                <Option value="PENDING">Đang chờ xử lý</Option>
                <Option value="EXPIRED">Đã hết hạn</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
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
            dataSource={policies}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: policyCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} hợp đồng bảo hiểm`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Policy Modal */}
        <Modal
          title="Thêm hợp đồng bảo hiểm mới"
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
                  name="type"
                  label="Loại bảo hiểm"
                  rules={[{ required: true, message: 'Vui lòng chọn loại bảo hiểm' }]}
                >
                  <Select>
                    <Option value="LIFE">Bảo hiểm nhân thọ</Option>
                    <Option value="HEALTH">Bảo hiểm sức khỏe</Option>
                    <Option value="AUTO">Bảo hiểm xe</Option>
                    <Option value="HOME">Bảo hiểm nhà</Option>
                    <Option value="TRAVEL">Bảo hiểm du lịch</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select>
                    <Option value="PENDING">Đang chờ xử lý</Option>
                    <Option value="ACTIVE">Đang hoạt động</Option>
                    <Option value="EXPIRED">Đã hết hạn</Option>
                    <Option value="CANCELLED">Đã hủy</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="provider"
                  label="Nhà cung cấp"
                  rules={[{ required: true, message: 'Vui lòng nhập nhà cung cấp' }]}
                >
                  <Input placeholder="Nhập tên công ty bảo hiểm" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="policyNumber"
                  label="Mã hợp đồng"
                >
                  <Input placeholder="Nhập mã hợp đồng (nếu có)" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                >
                  <Input.TextArea rows={3} placeholder="Nhập mô tả về hợp đồng bảo hiểm" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="policyholder"
                  label="Chủ hợp đồng"
                  rules={[{ required: true, message: 'Vui lòng chọn chủ hợp đồng' }]}
                >
                  <Select
                    placeholder="Chọn khách hàng"
                    showSearch
                    loading={loadingPolicyholders}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {policyholders.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Divider orientation="left">Chi tiết bảo hiểm</Divider>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="coverageDetails.dateRange"
                  label="Thời gian hiệu lực"
                  rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
                >
                  <RangePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="coverageDetails.paymentFrequency"
                  label="Tần suất thanh toán"
                  rules={[{ required: true, message: 'Vui lòng chọn tần suất thanh toán' }]}
                >
                  <Select>
                    <Option value="MONTHLY">Hàng tháng</Option>
                    <Option value="QUARTERLY">Hàng quý</Option>
                    <Option value="SEMI_ANNUALLY">Nửa năm</Option>
                    <Option value="ANNUALLY">Hàng năm</Option>
                    <Option value="ONE_TIME">Một lần</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="coverageDetails.coverageAmount"
                  label="Số tiền bảo hiểm"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số tiền bảo hiểm' },
                    { type: 'number', min: 0, message: 'Số tiền phải là số dương', transform: value => Number(value) }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="Nhập số tiền bảo hiểm"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="coverageDetails.premium"
                  label="Phí bảo hiểm"
                  rules={[
                    { required: true, message: 'Vui lòng nhập phí bảo hiểm' },
                    { type: 'number', min: 0, message: 'Phí bảo hiểm phải là số dương', transform: value => Number(value) }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="Nhập phí bảo hiểm"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Policy Modal */}
        <Modal
          title="Chỉnh sửa hợp đồng bảo hiểm"
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
          {editingPolicy && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="type"
                    label="Loại bảo hiểm"
                    rules={[{ required: true, message: 'Vui lòng chọn loại bảo hiểm' }]}
                  >
                    <Select>
                      <Option value="LIFE">Bảo hiểm nhân thọ</Option>
                      <Option value="HEALTH">Bảo hiểm sức khỏe</Option>
                      <Option value="AUTO">Bảo hiểm xe</Option>
                      <Option value="HOME">Bảo hiểm nhà</Option>
                      <Option value="TRAVEL">Bảo hiểm du lịch</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select>
                      <Option value="PENDING">Đang chờ xử lý</Option>
                      <Option value="ACTIVE">Đang hoạt động</Option>
                      <Option value="EXPIRED">Đã hết hạn</Option>
                      <Option value="CANCELLED">Đã hủy</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="provider"
                    label="Nhà cung cấp"
                    rules={[{ required: true, message: 'Vui lòng nhập nhà cung cấp' }]}
                  >
                    <Input placeholder="Nhập tên công ty bảo hiểm" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="policyNumber"
                    label="Mã hợp đồng"
                  >
                    <Input placeholder="Nhập mã hợp đồng (nếu có)" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả về hợp đồng bảo hiểm" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="policyholder"
                    label="Chủ hợp đồng"
                    rules={[{ required: true, message: 'Vui lòng chọn chủ hợp đồng' }]}
                  >
                    <Select
                      placeholder="Chọn khách hàng"
                      showSearch
                      loading={loadingPolicyholders}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {policyholders.map(user => (
                        <Option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Divider orientation="left">Chi tiết bảo hiểm</Divider>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="coverageDetails.dateRange"
                    label="Thời gian hiệu lực"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
                  >
                    <RangePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="coverageDetails.paymentFrequency"
                    label="Tần suất thanh toán"
                    rules={[{ required: true, message: 'Vui lòng chọn tần suất thanh toán' }]}
                  >
                    <Select>
                      <Option value="MONTHLY">Hàng tháng</Option>
                      <Option value="QUARTERLY">Hàng quý</Option>
                      <Option value="SEMI_ANNUALLY">Nửa năm</Option>
                      <Option value="ANNUALLY">Hàng năm</Option>
                      <Option value="ONE_TIME">Một lần</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="coverageDetails.coverageAmount"
                    label="Số tiền bảo hiểm"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số tiền bảo hiểm' },
                      { type: 'number', min: 0, message: 'Số tiền phải là số dương', transform: value => Number(value) }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Nhập số tiền bảo hiểm"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="coverageDetails.premium"
                    label="Phí bảo hiểm"
                    rules={[
                      { required: true, message: 'Vui lòng nhập phí bảo hiểm' },
                      { type: 'number', min: 0, message: 'Phí bảo hiểm phải là số dương', transform: value => Number(value) }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Nhập phí bảo hiểm"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default InsuranceManagement;