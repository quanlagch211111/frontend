import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import {
  Layout,
  Typography,
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Divider,
  Alert,
  Spin,
  Row,
  Col,
  Breadcrumb
} from 'antd';
import { Modal } from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;
const { confirm } = Modal;

const TicketForm = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingRelatedItems, setLoadingRelatedItems] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState('');

  // Fetch related items when service type changes
  useEffect(() => {
    if (selectedServiceType) {
      fetchRelatedItems(selectedServiceType);
    } else {
      setRelatedItems([]);
    }
  }, [selectedServiceType]);

  const fetchRelatedItems = async (serviceType) => {
    setLoadingRelatedItems(true);
    
    try {
      // Modified to use correct API endpoints based on service type
      let endpoint = '';
      
      switch (serviceType) {
        case 'REAL_ESTATE':
          endpoint = '/api/real-estate';
          break;
        case 'INSURANCE':
          endpoint = '/api/insurance';
          break;
        case 'VISA':
          endpoint = '/api/visa';
          break;
        case 'TAX':
          endpoint = '/api/tax';
          break;
        default:
          setRelatedItems([]);
          setLoadingRelatedItems(false);
          return;
      }
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        // Map response data to a consistent format
        let items = [];
        
        switch (serviceType) {
          case 'REAL_ESTATE':
            items = response.data.properties || [];
            break;
          case 'INSURANCE':
            items = response.data.policies || [];
            break;
          case 'VISA':
            items = response.data.visaApplications || [];
            break;
          case 'TAX':
            items = response.data.taxCases || [];
            break;
          default:
            items = [];
        }
        
        setRelatedItems(items);
      } else {
        setRelatedItems([]);
      }
    } catch (err) {
      console.error('Error fetching related items:', err);
      toast.error(`Không thể tải danh sách ${getServiceTypeText(selectedServiceType)}`);
      setRelatedItems([]);
    } finally {
      setLoadingRelatedItems(false);
    }
  };

  const getServiceTypeText = (type) => {
    switch (type) {
      case 'REAL_ESTATE': return 'bất động sản';
      case 'INSURANCE': return 'bảo hiểm';
      case 'VISA': return 'visa';
      case 'TAX': return 'thuế';
      default: return 'dịch vụ';
    }
  };

  const getItemDisplayName = (item, serviceType) => {
    switch (serviceType) {
      case 'REAL_ESTATE':
        return item.title || `Bất động sản ${item._id.slice(-6)}`;
      case 'INSURANCE':
        return item.policyNumber || `Hợp đồng bảo hiểm ${item._id.slice(-6)}`;
      case 'VISA':
        return `Đơn visa ${item.type || ''} - ${item.destination || item._id.slice(-6)}`;
      case 'TAX':
        return `Hồ sơ thuế ${item.fiscalYear || ''} - ${item._id.slice(-6)}`;
      default:
        return item._id;
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Prepare the ticket data
      const ticketData = {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        relatedService: {}
      };
      
      // Add related service if selected
      if (values.serviceType) {
        ticketData.relatedService = {
          serviceType: values.serviceType,
          serviceId: values.serviceId
        };
      }
      
      const response = await axios.post('/api/tickets', ticketData);
      
      if (response.data.success) {
        toast.success('Ticket hỗ trợ đã được tạo thành công');
        navigate(`/dashboard/tickets/${response.data.ticket._id}`);
      } else {
        setError('Tạo ticket không thành công');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      
      if (err.response?.data?.errors) {
        // Process validation errors from backend
        const errorMessages = err.response.data.errors.join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo ticket. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    confirm({
      title: 'Xác nhận hủy',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn hủy? Tất cả thông tin đã nhập sẽ bị mất.',
      okText: 'Có',
      okType: 'danger',
      cancelText: 'Không',
      onOk() {
        navigate('/dashboard/tickets');
      },
    });
  };

  return (
    <Layout style={{ background: 'transparent', padding: 0 }}>
      <Content>
        <div style={{ marginBottom: 24 }}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <a onClick={() => navigate('/dashboard/tickets')}>
                <ArrowLeftOutlined style={{ marginRight: 8 }} />
                Quay lại danh sách Ticket
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Tạo ticket mới</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <Card>
          <Title level={4}>Tạo Ticket hỗ trợ mới</Title>
          <Paragraph type="secondary">
            Vui lòng cung cấp thông tin chi tiết về vấn đề của bạn để chúng tôi có thể hỗ trợ tốt nhất.
          </Paragraph>
          
          <Divider />
          
          {error && (
            <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 24 }} />
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              category: 'GENERAL',
              priority: 'MEDIUM'
            }}
          >
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Tiêu đề"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tiêu đề' },
                    { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự' },
                    { max: 100, message: 'Tiêu đề không được vượt quá 100 ký tự' }
                  ]}
                >
                  <Input placeholder="Nhập tiêu đề ngắn gọn mô tả vấn đề của bạn" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select placeholder="Chọn danh mục">
                    <Option value="REAL_ESTATE">Bất động sản</Option>
                    <Option value="INSURANCE">Bảo hiểm</Option>
                    <Option value="VISA">Visa</Option>
                    <Option value="TAX">Thuế</Option>
                    <Option value="GENERAL">Chung</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="priority"
                  label="Mức độ ưu tiên"
                  rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên' }]}
                >
                  <Select placeholder="Chọn mức độ ưu tiên">
                    <Option value="LOW">Thấp</Option>
                    <Option value="MEDIUM">Trung bình</Option>
                    <Option value="HIGH">Cao</Option>
                    <Option value="URGENT">Khẩn cấp</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Divider orientation="left">Dịch vụ liên quan (Tùy chọn)</Divider>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="serviceType"
                  label="Loại dịch vụ"
                >
                  <Select 
                    placeholder="Chọn loại dịch vụ" 
                    allowClear
                    onChange={setSelectedServiceType}
                  >
                    <Option value="">Không có</Option>
                    <Option value="REAL_ESTATE">Bất động sản</Option>
                    <Option value="INSURANCE">Bảo hiểm</Option>
                    <Option value="VISA">Visa</Option>
                    <Option value="TAX">Thuế</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              {selectedServiceType && (
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="serviceId"
                    label="Dịch vụ cụ thể"
                    rules={[
                      { 
                        required: !!selectedServiceType, 
                        message: 'Vui lòng chọn dịch vụ' 
                      }
                    ]}
                  >
                    <Select
                      placeholder="Chọn dịch vụ cụ thể"
                      loading={loadingRelatedItems}
                      notFoundContent={loadingRelatedItems ? <Spin size="small" /> : "Không tìm thấy dịch vụ nào"}
                    >
                      {relatedItems.length > 0 ? (
                        relatedItems.map(item => (
                          <Option key={item._id} value={item._id}>
                            {getItemDisplayName(item, selectedServiceType)}
                          </Option>
                        ))
                      ) : (
                        <Option disabled>Không có dịch vụ nào</Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
              )}
              
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Mô tả chi tiết"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mô tả vấn đề' },
                    { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' }
                  ]}
                >
                  <TextArea 
                    rows={6} 
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải. Càng chi tiết, chúng tôi càng có thể hỗ trợ bạn tốt hơn."
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  htmlType="submit"
                  loading={submitting}
                >
                  Gửi ticket
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default TicketForm;