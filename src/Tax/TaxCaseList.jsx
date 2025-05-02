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
  Empty,
  Space,
  Statistic,
  Divider
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { formatCurrency } from '../Utility/formatCurrency';

const { Title, Text } = Typography;
const { Option } = Select;

const TaxCaseList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [taxCases, setTaxCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    fiscalYear: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form] = Form.useForm();

  const fetchTaxCases = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      
      const response = await axios.get(`/api/tax?${params.toString()}`);
      
      if (response.data.success) {
        setTaxCases(response.data.taxCases);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      } else {
        setError('Không thể tải danh sách hồ sơ thuế');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hồ sơ thuế:', error);
      setError(error.response?.data?.message || 'Lỗi khi tải danh sách hồ sơ thuế');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCases();
  }, [page, filters]);

  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
    setPage(1); // Reset về trang đầu tiên khi filter thay đổi
  };

  const clearFilters = () => {
    form.resetFields();
    setFilters({
      type: '',
      status: '',
      fiscalYear: ''
    });
    setPage(1);
  };

  const handleViewDetails = (id) => {
    navigate(`/dashboard/tax/${id}`);
  };

  const handleCreateClick = () => {
    navigate('/dashboard/tax/create');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'processing';
      case 'REVISION_NEEDED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'REVISION_NEEDED': return 'Cần chỉnh sửa';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'INCOME_TAX': return 'Thuế thu nhập';
      case 'PROPERTY_TAX': return 'Thuế bất động sản';
      case 'TAX_RETURN': return 'Hoàn thuế';
      case 'TAX_CONSULTATION': return 'Tư vấn thuế';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'INCOME_TAX': return 'blue';
      case 'PROPERTY_TAX': return 'green';
      case 'TAX_RETURN': return 'purple';
      case 'TAX_CONSULTATION': return 'gold';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Kiểm tra nếu người dùng là chuyên viên thuế (admin hoặc support)
  const isTaxProfessional = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPPORT');

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Danh sách Hồ sơ Thuế</Title>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          Tạo hồ sơ thuế mới
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
                placeholder="Tìm kiếm theo năm tài chính"
                prefix={<SearchOutlined />}
                onChange={(e) => handleFilterChange({ fiscalYear: e.target.value }, { ...filters, fiscalYear: e.target.value })}
                value={filters.fiscalYear}
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
                    label="Loại hồ sơ thuế"
                  >
                    <Select placeholder="Tất cả loại">
                      <Option value="">Tất cả loại</Option>
                      <Option value="INCOME_TAX">Thuế thu nhập</Option>
                      <Option value="PROPERTY_TAX">Thuế bất động sản</Option>
                      <Option value="TAX_RETURN">Hoàn thuế</Option>
                      <Option value="TAX_CONSULTATION">Tư vấn thuế</Option>
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
                      <Option value="PENDING">Chờ xử lý</Option>
                      <Option value="IN_PROGRESS">Đang xử lý</Option>
                      <Option value="COMPLETED">Hoàn thành</Option>
                      <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
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
      ) : taxCases.length === 0 ? (
        <Empty
          description={
            filters.type || filters.status || filters.fiscalYear
              ? "Không tìm thấy hồ sơ thuế nào phù hợp với tiêu chí của bạn. Hãy thử điều chỉnh bộ lọc."
              : "Bạn chưa có hồ sơ thuế nào. Hãy tạo hồ sơ thuế mới."
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
            Tạo hồ sơ thuế mới
          </Button>
        </Empty>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text>Tìm thấy {total} hồ sơ thuế</Text>
          </div>

          <Row gutter={[24, 24]}>
            {taxCases.map((taxCase) => (
              <Col xs={24} sm={12} md={8} key={taxCase._id}>
                <Card
                  hoverable
                  onClick={() => handleViewDetails(taxCase._id)}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Tag color={getTypeColor(taxCase.type)}>{getTypeLabel(taxCase.type)}</Tag>
                    <Tag color={getStatusColor(taxCase.status)}>{getStatusText(taxCase.status)}</Tag>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <CalendarOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                    <Title level={5} style={{ margin: 0 }}>
                      Năm tài chính: {taxCase.fiscalYear}
                    </Title>
                  </div>
                  
                  {taxCase.client && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <TeamOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                      <Text>Khách hàng: {taxCase.client.username}</Text>
                    </div>
                  )}
                  
                  {taxCase.details && taxCase.details.totalTaxDue !== undefined && (
                    <Statistic 
                      title="Tổng thuế phải nộp"
                      value={taxCase.details.totalTaxDue} 
                      formatter={(value) => formatCurrency(value)}
                      valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Ngày tạo</Text>
                      <div>
                        <Text>{formatDate(taxCase.created_at)}</Text>
                      </div>
                    </div>
                    
                    {taxCase.details && taxCase.details.filingDeadline && (
                      <div style={{ textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Hạn nộp</Text>
                        <div>
                          <Text>{formatDate(taxCase.details.filingDeadline)}</Text>
                        </div>
                      </div>
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
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination 
              current={page}
              total={total}
              pageSize={9}
              onChange={(page) => setPage(page)}
              showSizeChanger={false}
              showTotal={(total) => `Tổng cộng ${total} hồ sơ thuế`}
            />
          </div>
        </>
      )}
    </Layout>
  );
};

export default TaxCaseList;