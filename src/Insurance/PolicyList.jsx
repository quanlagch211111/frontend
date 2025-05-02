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
  InputNumber,
  Statistic,
  Image
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  SafetyOutlined,
  HeartOutlined,
  CarOutlined,
  HomeOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { formatCurrency } from '../Utility/formatCurrency';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const PolicyList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    provider: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form] = Form.useForm();

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.provider) params.append('provider', filters.provider);
      
      const response = await axios.get(`/api/insurance?${params.toString()}`);
      
      if (response.data.success) {
        setPolicies(response.data.policies);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      } else {
        setError('Không thể tải danh sách hợp đồng bảo hiểm');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hợp đồng bảo hiểm:', error);
      setError(error.response?.data?.message || 'Lỗi khi tải danh sách hợp đồng bảo hiểm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [page, filters]);

  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    form.resetFields();
    setFilters({
      type: '',
      status: '',
      provider: ''
    });
    setPage(1);
  };

  const handlePolicyClick = (id) => {
    navigate(`/dashboard/insurance/${id}`);
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
      case 'LIFE': return 'purple';
      case 'HEALTH': return 'green';
      case 'AUTO': return 'blue';
      case 'HOME': return 'orange';
      case 'TRAVEL': return 'cyan';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LIFE': return <HeartOutlined />;
      case 'HEALTH': return <SafetyOutlined />;
      case 'AUTO': return <CarOutlined />;
      case 'HOME': return <HomeOutlined />;
      case 'TRAVEL': return <GlobalOutlined />;
      default: return <SafetyOutlined />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const getPaymentFrequency = (freq) => {
    switch (freq) {
      case 'MONTHLY': return 'tháng';
      case 'QUARTERLY': return 'quý';
      case 'SEMI_ANNUAL': return '6 tháng';
      case 'ANNUAL': return 'năm';
      default: return freq;
    }
  };

  const isAgentOrAdmin = currentUser && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN');

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Danh sách Hợp đồng Bảo hiểm</Title>
        
        {isAgentOrAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/insurance/create')}
          >
            Thêm hợp đồng bảo hiểm mới
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
                placeholder="Tìm kiếm theo nhà cung cấp"
                prefix={<SearchOutlined />}
                onChange={(e) => handleFilterChange({ provider: e.target.value }, { ...filters, provider: e.target.value })}
                value={filters.provider}
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
                    label="Loại bảo hiểm"
                  >
                    <Select placeholder="Tất cả loại">
                      <Option value="">Tất cả loại</Option>
                      <Option value="LIFE">Bảo hiểm nhân thọ</Option>
                      <Option value="HEALTH">Bảo hiểm sức khỏe</Option>
                      <Option value="AUTO">Bảo hiểm xe</Option>
                      <Option value="HOME">Bảo hiểm nhà</Option>
                      <Option value="TRAVEL">Bảo hiểm du lịch</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Form.Item 
                    name="status" 
                    label="Trạng thái"
                  >
                    <Select placeholder="Tất cả trạng thái">
                      <Option value="">Tất cả trạng thái</Option>
                      <Option value="ACTIVE">Đang hoạt động</Option>
                      <Option value="PENDING">Đang chờ xử lý</Option>
                      <Option value="EXPIRED">Đã hết hạn</Option>
                      <Option value="CANCELLED">Đã hủy</Option>
                    </Select>
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
      ) : policies.length === 0 ? (
        <Empty
          description="Không tìm thấy hợp đồng bảo hiểm nào phù hợp với tiêu chí của bạn. Hãy thử điều chỉnh bộ lọc."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {policies.map((policy) => (
              <Col xs={24} sm={12} lg={8} key={policy._id}>
                <Card
                  hoverable
                  onClick={() => handlePolicyClick(policy._id)}
                  cover={
                    policy.images && policy.images.length > 0 ? (
                      <div style={{ height: 200, overflow: 'hidden' }}>
                        <img 
                          alt={policy.provider}
                          src={policy.images[0]}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          height: 200, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f5f5f5',
                          fontSize: 64,
                          color: '#aaa'
                        }}
                      >
                        {getTypeIcon(policy.type)}
                      </div>
                    )
                  }
                  style={{ height: '100%' }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Tag color={getTypeColor(policy.type)}>{getTypeLabel(policy.type)}</Tag>
                      <Tag color={getStatusColor(policy.status)}>{getStatusText(policy.status)}</Tag>
                    </Space>
                  </div>
                  
                  <Title level={5} style={{ margin: '8px 0', height: 48, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {policy.provider}
                  </Title>
                  
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Mã hợp đồng: {policy.policyNumber || 'N/A'}
                  </Text>
                  
                  <Statistic 
                    value={policy.coverageDetails.coverageAmount} 
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                  />
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Phí bảo hiểm</Text>
                      <div>
                        <Text>
                          {formatCurrency(policy.coverageDetails.premium)}/{getPaymentFrequency(policy.coverageDetails.paymentFrequency)}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Hiệu lực đến</Text>
                      <div>
                        <Text>{formatDate(policy.coverageDetails.endDate)}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination 
              current={page}
              total={total}
              pageSize={9}
              onChange={(page) => setPage(page)}
              showSizeChanger={false}
              showTotal={(total) => `Tổng cộng ${total} hợp đồng bảo hiểm`}
            />
          </div>
        </>
      )}
    </Layout>
  );
};

export default PolicyList;