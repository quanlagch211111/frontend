import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  Tag,
  Input,
  Select,
  Form,
  Pagination,
  Spin,
  Alert,
  Divider,
  Space,
  Empty,
  Collapse,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  AreaChartOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { formatCurrency } from '../Utility/formatCurrency';

const { Title, Text } = Typography;
const { Meta } = Card;
const { Option } = Select;
const { Panel } = Collapse;

const PropertyList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form] = Form.useForm();

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);
      
      if (filters.type) params.append('type', filters.type);
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);

      const response = await axios.get(`/api/real-estate?${params.toString()}`);
      
      if (response.data.success) {
        setProperties(response.data.properties);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Không thể tải danh sách bất động sản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, filters]);

  const handlePageChange = (value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    form.resetFields();
    setFilters({
      type: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: ''
    });
    setPage(1);
  };

  const handlePropertyClick = (id) => {
    navigate(`/dashboard/real-estate/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'PENDING': return 'warning';
      case 'SOLD': return 'error';
      case 'RENTED': return 'processing';
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

  const isAgentOrAdmin = currentUser && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN');

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Danh sách Bất động sản</Title>
        
        {isAgentOrAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/real-estate/create')}
          >
            Thêm bất động sản mới
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={filters}
          onValuesChange={handleFilterChange}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={16} md={18}>
              <Input
                placeholder="Tìm kiếm theo địa điểm"
                prefix={<SearchOutlined />}
                onChange={(e) => handleFilterChange({ city: e.target.value }, { ...filters, city: e.target.value })}
                value={filters.city}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
              >
                Bộ lọc
              </Button>
            </Col>
          </Row>

          {showFilters && (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item 
                    name="type" 
                    label="Loại bất động sản"
                  >
                    <Select placeholder="Tất cả loại">
                      <Option value="">Tất cả loại</Option>
                      <Option value="RENTAL">Cho thuê</Option>
                      <Option value="PURCHASE">Đang bán</Option>
                      <Option value="BDS_INVESTMENT">Đầu tư</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Form.Item 
                    name="bedrooms" 
                    label="Số phòng ngủ"
                  >
                    <Select placeholder="Tất cả">
                      <Option value="">Tất cả</Option>
                      <Option value="1">1+</Option>
                      <Option value="2">2+</Option>
                      <Option value="3">3+</Option>
                      <Option value="4">4+</Option>
                      <Option value="5">5+</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={12} sm={12} md={6}>
                  <Form.Item 
                    name="minPrice" 
                    label="Giá thấp nhất"
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="Giá tối thiểu"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} sm={12} md={6}>
                  <Form.Item 
                    name="maxPrice" 
                    label="Giá cao nhất"
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="Giá tối đa"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col xs={24} style={{ textAlign: 'right' }}>
                  <Button onClick={clearFilters}>Xóa bộ lọc</Button>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message="Lỗi" description={error} type="error" showIcon />
      ) : properties.length === 0 ? (
        <Empty
          description="Không tìm thấy bất động sản nào phù hợp với tiêu chí của bạn. Hãy thử điều chỉnh bộ lọc."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text>Tìm thấy {total} bất động sản</Text>
          </div>

          <Row gutter={[16, 16]}>
            {properties.map((property) => (
              <Col xs={24} sm={12} md={8} key={property._id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <img
                        alt={property.title}
                        src={property.images && property.images.length > 0 
                          ? property.images[0] 
                          : 'https://via.placeholder.com/300x200?text=Không+có+ảnh'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  }
                  onClick={() => handlePropertyClick(property._id)}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Tag color={getTypeColor(property.type)}>{getTypeLabel(property.type)}</Tag>
                    <Tag color={getStatusColor(property.status)}>{getStatusText(property.status)}</Tag>
                  </div>
                  
                  <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>{property.title}</Title>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <EnvironmentOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                    <Text type="secondary" ellipsis>
                      {property.location.address}, {property.location.city}
                    </Text>
                  </div>
                  
                  <Title level={4} style={{ color: '#1890ff', marginTop: 'auto', marginBottom: 16 }}>
                    {formatCurrency(property.price)}
                    {property.type === 'RENTAL' && <Text type="secondary" style={{ fontSize: '14px' }}>/tháng</Text>}
                  </Title>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {property.features && (
                      <>
                        {property.features.bedrooms && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <HomeOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                            <Text type="secondary">{property.features.bedrooms} PN</Text>
                          </div>
                        )}
                        
                        {property.features.bathrooms && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BankOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                            <Text type="secondary">{property.features.bathrooms} WC</Text>
                          </div>
                        )}
                        
                        {property.features.area && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <AreaChartOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                            <Text type="secondary">{property.features.area} m²</Text>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Button type="link" style={{ padding: 0 }}>
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <Pagination 
              current={page} 
              total={total} 
              onChange={handlePageChange} 
              showSizeChanger={false}
              pageSize={9}
              showTotal={(total) => `Tổng ${total} bất động sản`}
            />
          </div>
        </>
      )}
    </Layout>
  );
};

export default PropertyList;