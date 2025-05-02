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
  Collapse
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  GlobalOutlined,
  PlusOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Paragraph } = Typography;


const VisaList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [visaApplications, setVisaApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    destination: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form] = Form.useForm();

  const fetchVisaApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.destination) params.append('destination', filters.destination);
      
      const response = await axios.get(`/api/visa?${params.toString()}`);
      
      if (response.data.success) {
        setVisaApplications(response.data.visaApplications);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      } else {
        setError('Không thể tải danh sách hồ sơ visa');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hồ sơ visa:', error);
      setError(error.response?.data?.message || 'Lỗi khi tải danh sách hồ sơ visa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisaApplications();
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
      destination: ''
    });
    setPage(1);
  };

  const handleViewDetails = (id) => {
    navigate(`/dashboard/visa/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PROCESSING': return 'processing';
      case 'ADDITIONAL_INFO_REQUIRED': return 'warning';
      case 'SUBMITTED': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'Đã nộp';
      case 'PROCESSING': return 'Đang xử lý';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'ADDITIONAL_INFO_REQUIRED': return 'Yêu cầu bổ sung';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'TOURIST': return 'Du lịch';
      case 'BUSINESS': return 'Công việc';
      case 'GUARANTOR': return 'Bảo lãnh';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'TOURIST': return 'blue';
      case 'BUSINESS': return 'green';
      case 'GUARANTOR': return 'purple';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Danh sách Hồ sơ Visa</Title>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/visa/create')}
        >
          Tạo hồ sơ visa mới
        </Button>
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
                placeholder="Tìm kiếm theo quốc gia"
                prefix={<SearchOutlined />}
                onChange={(e) => handleFilterChange({ destination: e.target.value }, { ...filters, destination: e.target.value })}
                value={filters.destination}
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
                    label="Loại visa"
                  >
                    <Select placeholder="Tất cả loại">
                      <Option value="">Tất cả loại</Option>
                      <Option value="TOURIST">Du lịch</Option>
                      <Option value="BUSINESS">Công việc</Option>
                      <Option value="GUARANTOR">Bảo lãnh</Option>
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
                      <Option value="SUBMITTED">Đã nộp</Option>
                      <Option value="PROCESSING">Đang xử lý</Option>
                      <Option value="APPROVED">Đã duyệt</Option>
                      <Option value="REJECTED">Từ chối</Option>
                      <Option value="ADDITIONAL_INFO_REQUIRED">Yêu cầu bổ sung</Option>
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
      ) : visaApplications.length === 0 ? (
        <Empty
          description="Không tìm thấy hồ sơ visa nào phù hợp với tiêu chí của bạn. Hãy thử điều chỉnh bộ lọc."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text>Tìm thấy {total} hồ sơ visa</Text>
          </div>

          <Row gutter={[24, 24]}>
            {visaApplications.map((visa) => (
              <Col xs={24} sm={12} md={8} key={visa._id}>
                <Card
                  hoverable
                  onClick={() => handleViewDetails(visa._id)}
                  cover={
                    visa.images && visa.images.length > 0 ? (
                      <div style={{ height: 200, overflow: 'hidden' }}>
                        <img 
                          alt={visa.destination}
                          src={visa.images[0]}
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
                        <GlobalOutlined />
                      </div>
                    )
                  }
                  style={{ height: '100%' }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Tag color={getTypeColor(visa.type)}>{getTypeLabel(visa.type)}</Tag>
                      <Tag color={getStatusColor(visa.status)}>{getStatusText(visa.status)}</Tag>
                    </Space>
                  </div>
                  
                  <Title level={5} style={{ margin: '8px 0' }}>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    {visa.destination}
                  </Title>
                  
                  <Paragraph 
                    ellipsis={{ rows: 2 }}
                    style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 16 }}
                  >
                    {visa.purpose}
                  </Paragraph>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <IdcardOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                      <Text type="secondary">{visa.applicationDetails.passportNumber}</Text>
                    </div>
                    
                    <div>
                      <CalendarOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                      <Text type="secondary">{formatDate(visa.applicationDetails.appliedDate)}</Text>
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
              showTotal={(total) => `Tổng cộng ${total} hồ sơ visa`}
            />
          </div>
        </>
      )}
    </Layout>
  );
};

export default VisaList;