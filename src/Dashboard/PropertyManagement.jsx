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
  Switch,
  Breadcrumb,
  Divider,
  Image,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const PropertyManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyCount, setPropertyCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create property modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit property modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm] = Form.useForm();
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý bất động sản');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchProperties = async () => {
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
      
      if (cityFilter) {
        params.append('city', cityFilter);
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/real-estate/admin/all-properties?${params.toString()}`);
      
      if (response.data.success) {
        setProperties(response.data.properties);
        setPropertyCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching properties');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperties();
  }, [page, pageSize, typeFilter, statusFilter, cityFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchProperties();
  };
  
  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setCityFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchProperties();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create property functions
  const showCreateModal = () => {
    createForm.resetFields();
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
      const propertyData = {
        ...values,
        price: Number(values.price),
        features: {
          area: values.area ? Number(values.area) : undefined,
          bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
          bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
          floors: values.floors ? Number(values.floors) : undefined,
        },
        location: {
          address: values.address,
          city: values.city,
          district: values.district,
        }
      };
      
      const response = await axios.post('/api/real-estate', propertyData);
      
      if (response.data.success) {
        toast.success('Tạo bất động sản mới thành công');
        setCreateModalVisible(false);
        fetchProperties();
      } else {
        toast.error(response.data.message || 'Tạo bất động sản thất bại');
      }
    } catch (err) {
      console.error('Create property error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo bất động sản');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit property functions
  const showEditModal = (property) => {
    setEditingProperty(property);
    editForm.setFieldsValue({
      title: property.title,
      description: property.description,
      type: property.type,
      status: property.status,
      price: property.price,
      address: property.location?.address,
      city: property.location?.city,
      district: property.location?.district,
      area: property.features?.area,
      bedrooms: property.features?.bedrooms,
      bathrooms: property.features?.bathrooms,
      floors: property.features?.floors,
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingProperty(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const propertyData = {
        ...values,
        price: Number(values.price),
        features: {
          area: values.area ? Number(values.area) : undefined,
          bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
          bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
          floors: values.floors ? Number(values.floors) : undefined,
        },
        location: {
          address: values.address,
          city: values.city,
          district: values.district,
        }
      };
      
      const response = await axios.put(`/api/real-estate/${editingProperty._id}`, propertyData);
      
      if (response.data.success) {
        toast.success('Cập nhật bất động sản thành công');
        setEditModalVisible(false);
        fetchProperties();
      } else {
        toast.error(response.data.message || 'Cập nhật bất động sản thất bại');
      }
    } catch (err) {
      console.error('Edit property error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật bất động sản');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete property function
  const showDeleteConfirm = (property) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bất động sản này?',
      icon: <ExclamationCircleOutlined />,
      content: `Tiêu đề: ${property.title}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/real-estate/${property._id}`);
          
          if (response.data.success) {
            toast.success('Xóa bất động sản thành công');
            fetchProperties();
          } else {
            toast.error(response.data.message || 'Xóa bất động sản thất bại');
          }
        } catch (err) {
          console.error('Delete property error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa bất động sản');
        }
      }
    });
  };
  
  // Utilities
  const getTypeLabel = (type) => {
    switch (type) {
      case 'RENTAL': return 'Cho thuê';
      case 'PURCHASE': return 'Đang bán';
      case 'BDS_INVESTMENT': return 'Đầu tư';
      default: return type;
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'RENTAL': return 'blue';
      case 'PURCHASE': return 'green';
      case 'BDS_INVESTMENT': return 'purple';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'green';
      case 'PENDING': return 'gold';
      case 'SOLD': return 'red';
      case 'RENTED': return 'purple';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'Sẵn sàng';
      case 'PENDING': return 'Đang giao dịch';
      case 'SOLD': return 'Đã bán';
      case 'RENTED': return 'Đã cho thuê';
      default: return status;
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Table columns
  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      key: 'images',
      render: (images) => (
        <Image 
          width={60}
          height={60}
          src={images && images.length > 0 ? images[0] : 'https://via.placeholder.com/60?text=No+Image'}
          style={{ objectFit: 'cover' }}
          preview={{
            mask: <EyeOutlined />,
            maskClassName: 'custom-mask'
          }}
        />
      ),
      width: 80,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space direction="vertical" size={0}>
          <Text strong ellipsis={{ tooltip: title }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            #{record._id.slice(-6)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Cho thuê', value: 'RENTAL' },
        { text: 'Đang bán', value: 'PURCHASE' },
        { text: 'Đầu tư', value: 'BDS_INVESTMENT' },
      ],
      render: type => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      render: price => (
        <Text style={{ fontWeight: 500, color: '#f50' }}>{formatPrice(price)}</Text>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      render: location => (
        <Text ellipsis={{ tooltip: `${location?.city}, ${location?.district}` }}>
          {location?.city && `${location.city}`}
          {location?.district && `, ${location.district}`}
        </Text>
      ),
    },
    {
      title: 'Đặc điểm',
      dataIndex: 'features',
      key: 'features',
      responsive: ['lg'],
      render: features => (
        <Space>
          {features?.area && (
            <Badge count={`${features.area}m²`} style={{ backgroundColor: '#52c41a' }} />
          )}
          {features?.bedrooms && (
            <Badge count={`${features.bedrooms} PN`} style={{ backgroundColor: '#1890ff' }} />
          )}
          {features?.bathrooms && (
            <Badge count={`${features.bathrooms} VS`} style={{ backgroundColor: '#722ed1' }} />
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Sẵn sàng', value: 'AVAILABLE' },
        { text: 'Đang giao dịch', value: 'PENDING' },
        { text: 'Đã bán', value: 'SOLD' },
        { text: 'Đã cho thuê', value: 'RENTED' },
      ],
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'owner',
      key: 'owner',
      responsive: ['lg'],
      render: owner => owner?.username || 'N/A',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      responsive: ['xl'],
      render: date => formatDate(date)
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
              onClick={() => navigate(`/dashboard/real-estate/${record._id}`)}
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
              <Breadcrumb.Item>Quản lý bất động sản</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <HomeOutlined style={{ marginRight: 8 }} />
                Quản lý bất động sản
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm bất động sản mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8} md={6}>
              <Input 
                placeholder="Tìm kiếm theo tiêu đề..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Lọc theo loại"
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={value => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="RENTAL">Cho thuê</Option>
                <Option value="PURCHASE">Đang bán</Option>
                <Option value="BDS_INVESTMENT">Đầu tư</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
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
                <Option value="AVAILABLE">Sẵn sàng</Option>
                <Option value="PENDING">Đang giao dịch</Option>
                <Option value="SOLD">Đã bán</Option>
                <Option value="RENTED">Đã cho thuê</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
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
            dataSource={properties}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: propertyCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} bất động sản`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Property Modal */}
        <Modal
          title="Thêm bất động sản mới"
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
                  label="Loại bất động sản"
                  rules={[{ required: true, message: 'Vui lòng chọn loại bất động sản' }]}
                >
                  <Select placeholder="Chọn loại bất động sản">
                    <Option value="RENTAL">Cho thuê</Option>
                    <Option value="PURCHASE">Đang bán</Option>
                    <Option value="BDS_INVESTMENT">Đầu tư</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  initialValue="AVAILABLE"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="AVAILABLE">Sẵn sàng</Option>
                    <Option value="PENDING">Đang giao dịch</Option>
                    <Option value="SOLD">Đã bán</Option>
                    <Option value="RENTED">Đã cho thuê</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Tiêu đề"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                >
                  <Input placeholder="Nhập tiêu đề bất động sản" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                >
                  <TextArea rows={4} placeholder="Nhập mô tả chi tiết về bất động sản" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="price"
                  label="Giá"
                  rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="Nhập giá bất động sản"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="area"
                  label="Diện tích (m²)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Nhập diện tích"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={6}>
                <Form.Item
                  name="bedrooms"
                  label="Số phòng ngủ"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Số phòng ngủ"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={6}>
                <Form.Item
                  name="bathrooms"
                  label="Số phòng tắm"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Số phòng tắm"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={6}>
                <Form.Item
                  name="floors"
                  label="Số tầng"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Số tầng"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Divider style={{ margin: '8px 0 16px' }}>Địa chỉ</Divider>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                >
                  <Input placeholder="Nhập địa chỉ bất động sản" />
                </Form.Item>
              </Col>
              
              <Col xs={12}>
                <Form.Item
                  name="city"
                  label="Thành phố"
                  rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
                >
                  <Input placeholder="Nhập thành phố" />
                </Form.Item>
              </Col>
              
              <Col xs={12}>
                <Form.Item
                  name="district"
                  label="Quận/Huyện"
                  rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
                >
                  <Input placeholder="Nhập quận/huyện" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Property Modal */}
        <Modal
          title="Chỉnh sửa bất động sản"
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
          {editingProperty && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="type"
                    label="Loại bất động sản"
                    rules={[{ required: true, message: 'Vui lòng chọn loại bất động sản' }]}
                  >
                    <Select placeholder="Chọn loại bất động sản">
                      <Option value="RENTAL">Cho thuê</Option>
                      <Option value="PURCHASE">Đang bán</Option>
                      <Option value="BDS_INVESTMENT">Đầu tư</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="AVAILABLE">Sẵn sàng</Option>
                      <Option value="PENDING">Đang giao dịch</Option>
                      <Option value="SOLD">Đã bán</Option>
                      <Option value="RENTED">Đã cho thuê</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                  >
                    <Input placeholder="Nhập tiêu đề bất động sản" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                  >
                    <TextArea rows={4} placeholder="Nhập mô tả chi tiết về bất động sản" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="price"
                    label="Giá"
                    rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Nhập giá bất động sản"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="area"
                    label="Diện tích (m²)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Nhập diện tích"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} sm={6}>
                  <Form.Item
                    name="bedrooms"
                    label="Số phòng ngủ"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Số phòng ngủ"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} sm={6}>
                  <Form.Item
                    name="bathrooms"
                    label="Số phòng tắm"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Số phòng tắm"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} sm={6}>
                  <Form.Item
                    name="floors"
                    label="Số tầng"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Số tầng"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Divider style={{ margin: '8px 0 16px' }}>Địa chỉ</Divider>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="address"
                    label="Địa chỉ"
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                  >
                    <Input placeholder="Nhập địa chỉ bất động sản" />
                  </Form.Item>
                </Col>
                
                <Col xs={12}>
                  <Form.Item
                    name="city"
                    label="Thành phố"
                    rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
                  >
                    <Input placeholder="Nhập thành phố" />
                  </Form.Item>
                </Col>
                
                <Col xs={12}>
                  <Form.Item
                    name="district"
                    label="Quận/Huyện"
                    rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
                  >
                    <Input placeholder="Nhập quận/huyện" />
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

export default PropertyManagement;