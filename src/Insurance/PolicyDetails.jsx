import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  Tag,
  Divider,
  Spin,
  Alert,
  Modal,
  Space,
  Breadcrumb,
  Avatar,
  Descriptions,
  Statistic,
  Image,
  Carousel,
  Form,
  Input,
  InputNumber,
  Table
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import { formatCurrency } from '../Utility/formatCurrency';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const PolicyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPolicy, setDeletingPolicy] = useState(false);
  const [beneficiaryModalVisible, setBeneficiaryModalVisible] = useState(false);
  const [beneficiary, setBeneficiary] = useState({
    name: '',
    relationship: '',
    percentage: 0
  });
  const [addingBeneficiary, setAddingBeneficiary] = useState(false);
  const [form] = Form.useForm();
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = React.useRef();

  const fetchPolicyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/insurance/${id}`);
      if (response.data.success) {
        setPolicy(response.data.policy);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin hợp đồng bảo hiểm:', error);
      setError('Không thể tải thông tin hợp đồng bảo hiểm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyDetails();
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/insurance/edit/${id}`);
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa hợp đồng bảo hiểm này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: handleDelete,
    });
  };

  const handleDelete = async () => {
    setDeletingPolicy(true);
    try {
      const response = await axios.delete(`/api/insurance/${id}`);
      if (response.data.success) {
        toast.success('Đã xóa hợp đồng bảo hiểm thành công');
        navigate('/dashboard/insurance');
      }
    } catch (error) {
      console.error('Lỗi khi xóa hợp đồng bảo hiểm:', error);
      toast.error('Không thể xóa hợp đồng bảo hiểm. Vui lòng thử lại.');
    } finally {
      setDeletingPolicy(false);
    }
  };

  const showDeleteImageConfirm = (index) => {
    confirm({
      title: 'Xóa ảnh',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleDeleteImage(index),
    });
  };

  const handleDeleteImage = async (index) => {
    try {
      const response = await axios.delete(`/api/insurance/${id}/images/${index}`);

      if (response.data.success) {
        toast.success('Đã xóa ảnh thành công');
        setPolicy(response.data.policy);
        
        // Cập nhật chỉ số ảnh hiện tại nếu cần
        if (index === currentImageIndex && currentImageIndex > 0) {
          setCurrentImageIndex(currentImageIndex - 1);
          carouselRef.current.goTo(currentImageIndex - 1);
        }
      } else {
        toast.error('Không thể xóa ảnh');
      }
    } catch (err) {
      console.error('Lỗi khi xóa ảnh:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa ảnh');
    }
  };

  const handleBeneficiarySubmit = async () => {
    try {
      const values = await form.validateFields();
      setAddingBeneficiary(true);
      
      try {
        const response = await axios.post(`/api/insurance/${id}/beneficiaries`, values);
        
        if (response.data.success) {
          toast.success('Đã thêm người thụ hưởng thành công');
          setPolicy(response.data.policy);
          setBeneficiaryModalVisible(false);
          form.resetFields();
        } else {
          toast.error('Không thể thêm người thụ hưởng');
        }
      } catch (error) {
        console.error('Lỗi khi thêm người thụ hưởng:', error);
        toast.error(error.response?.data?.message || 'Không thể thêm người thụ hưởng');
      } finally {
        setAddingBeneficiary(false);
      }
    } catch (err) {
      // Validation error
    }
  };

  const handleRemoveBeneficiary = async (index) => {
    try {
      const response = await axios.delete(`/api/insurance/${id}/beneficiaries/${index}`);
      
      if (response.data.success) {
        toast.success('Đã xóa người thụ hưởng thành công');
        setPolicy(response.data.policy);
      } else {
        toast.error('Không thể xóa người thụ hưởng');
      }
    } catch (error) {
      console.error('Lỗi khi xóa người thụ hưởng:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa người thụ hưởng');
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

  const getPaymentFrequency = (freq) => {
    switch (freq) {
      case 'MONTHLY': return 'Hàng tháng';
      case 'QUARTERLY': return 'Hàng quý';
      case 'SEMI_ANNUAL': return 'Nửa năm';
      case 'ANNUAL': return 'Hàng năm';
      default: return freq;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Check if current user can edit/delete policy
  const canEditPolicy = () => {
    if (!currentUser || !policy) return false;
    
    // Admin can edit any policy
    if (currentUser.isAdmin || currentUser.role === 'ADMIN') return true;
    
    // Agent who is assigned to the policy can edit
    if (policy.agent && policy.agent._id === currentUser.id) return true;
    
    return false;
  };

  const canManageBeneficiaries = () => {
    if (!currentUser || !policy) return false;
    
    // Admin can manage beneficiaries
    if (currentUser.isAdmin || currentUser.role === 'ADMIN') return true;
    
    // Policyholder can manage beneficiaries
    if (policy.policyholder && policy.policyholder._id === currentUser.id) return true;
    
    // Agent who is assigned to the policy can manage beneficiaries
    if (policy.agent && policy.agent._id === currentUser.id) return true;
    
    return false;
  };

  const totalBeneficiaryPercentage = policy?.beneficiaries?.reduce(
    (sum, ben) => sum + ben.percentage, 0
  ) || 0;

  const handleCarouselChange = (current) => {
    setCurrentImageIndex(current);
  };

  const openPreview = (src) => {
    setPreviewImage(src);
    setImagePreviewVisible(true);
  };

  const goToSlide = (index) => {
    carouselRef.current.goTo(index);
  };

  const beneficiaryColumns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mối quan hệ',
      dataIndex: 'relationship',
      key: 'relationship',
    },
    {
      title: 'Phần trăm',
      dataIndex: 'percentage',
      key: 'percentage',
      render: percentage => `${percentage}%`,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record, index) => (
        canManageBeneficiaries() && (
          <Button 
            type="text" 
            danger 
            size="small" 
            onClick={() => showRemoveBeneficiaryConfirm(index)}
          >
            Xóa
          </Button>
        )
      ),
    },
  ];

  const showRemoveBeneficiaryConfirm = (index) => {
    confirm({
      title: 'Xác nhận xóa người thụ hưởng',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa người thụ hưởng này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleRemoveBeneficiary(index),
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Lỗi" description={error} type="error" showIcon />;
  }

  if (!policy) {
    return <Alert message="Thông báo" description="Không tìm thấy hợp đồng bảo hiểm" type="warning" showIcon />;
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/insurance')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Danh sách hợp đồng bảo hiểm
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết hợp đồng bảo hiểm</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          {canEditPolicy() && (
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </Button>
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={showDeleteConfirm}
                  loading={deletingPolicy}
                >
                  Xóa
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </div>

      {/* Carousel Image Section */}
      <Card style={{ marginBottom: 24, overflow: 'hidden' }}>
        {policy.images && policy.images.length > 0 ? (
          <div>
            <Carousel 
              ref={carouselRef}
              afterChange={handleCarouselChange}
              arrows
              style={{ position: 'relative' }}
            >
              {policy.images.map((image, index) => (
                <div key={index}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={image}
                      alt={`${policy.provider} - Ảnh ${index + 1}`}
                      style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                      onClick={() => openPreview(image)}
                    />
                    {canEditPolicy() && (
                      <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          opacity: 0.7
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteImageConfirm(index);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </Carousel>
            
            {/* Thumbnail Preview Row */}
            <div style={{ display: 'flex', overflowX: 'auto', marginTop: 8, padding: '8px 0' }}>
              {policy.images.map((image, index) => (
                <div 
                  key={index} 
                  style={{ 
                    margin: '0 4px', 
                    cursor: 'pointer',
                    border: index === currentImageIndex ? '2px solid #1890ff' : '2px solid transparent',
                    borderRadius: 4
                  }}
                  onClick={() => goToSlide(index)}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 2 }}
                  />
                </div>
              ))}
            </div>
            
            <div 
              style={{ 
                textAlign: 'right', 
                padding: '4px 8px',
                color: '#8c8c8c',
                fontSize: 14
              }}
            >
              {currentImageIndex + 1} / {policy.images.length}
            </div>
          </div>
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
            <Text type="secondary">Không có ảnh</Text>
          </div>
        )}
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="top" style={{ marginBottom: 16 }}>
              <Col>
                <Space direction="vertical" size={8} style={{ marginBottom: 8 }}>
                  <Space>
                    <Tag color={getTypeColor(policy.type)}>{getTypeLabel(policy.type)}</Tag>
                    <Tag color={getStatusColor(policy.status)}>{getStatusText(policy.status)}</Tag>
                  </Space>
                  <Title level={4} style={{ margin: 0 }}>{policy.provider}</Title>
                  <div>
                    <Text type="secondary">
                      Mã hợp đồng: {policy.policyNumber}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Statistic 
                  value={policy.coverageDetails.coverageAmount} 
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                  <div>
                    <Text type="secondary">Thời gian hiệu lực</Text>
                    <div>
                      <Text strong>{formatDate(policy.coverageDetails.startDate)} - {formatDate(policy.coverageDetails.endDate)}</Text>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <DollarOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                  <div>
                    <Text type="secondary">Phí bảo hiểm</Text>
                    <div>
                      <Text strong>
                        {formatCurrency(policy.coverageDetails.premium)} / {getPaymentFrequency(policy.coverageDetails.paymentFrequency)}
                      </Text>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24}>
                <Title level={5}>Người thụ hưởng</Title>
                
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">
                    Tổng phần trăm thụ hưởng: <Text strong style={{ color: totalBeneficiaryPercentage > 100 ? '#ff4d4f' : 'inherit' }}>{totalBeneficiaryPercentage}%</Text>
                  </Text>
                  
                  {canManageBeneficiaries() && totalBeneficiaryPercentage < 100 && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setBeneficiaryModalVisible(true)}
                    >
                      Thêm người thụ hưởng
                    </Button>
                  )}
                </div>
                
                {policy.beneficiaries && policy.beneficiaries.length > 0 ? (
                  <Table
                    dataSource={policy.beneficiaries}
                    columns={beneficiaryColumns}
                    pagination={false}
                    rowKey={(record, index) => index}
                    size="small"
                  />
                ) : (
                  <Text type="secondary">Chưa có người thụ hưởng nào được thêm</Text>
                )}
              </Col>
            </Row>

            {policy.description && (
              <>
                <Divider />
                <Title level={5}>Mô tả</Title>
                <Paragraph>
                  {policy.description}
                </Paragraph>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {policy.policyholder && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={5}>Thông tin người mua bảo hiểm</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={policy.policyholder.avatar}
                  style={{ marginRight: 16 }}
                >
                  {policy.policyholder.username ? policy.policyholder.username.charAt(0).toUpperCase() : 'P'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{policy.policyholder.username}</Text>
                  <div>
                    <Text type="secondary">Người mua bảo hiểm</Text>
                  </div>
                </div>
              </div>

              {policy.policyholder.phone && (
                <div style={{ marginBottom: 8 }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{policy.policyholder.phone}</Text>
                </div>
              )}

              {policy.policyholder.email && (
                <div style={{ marginBottom: 8 }}>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{policy.policyholder.email}</Text>
                </div>
              )}

              {policy.policyholder.address && (
                <div>
                  <HomeOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{policy.policyholder.address}</Text>
                </div>
              )}
            </Card>
          )}

          {policy.agent && (
            <Card>
              <Title level={5}>Thông tin đại lý</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={policy.agent.avatar}
                  style={{ marginRight: 16 }}
                >
                  {policy.agent.username ? policy.agent.username.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{policy.agent.username}</Text>
                  <div>
                    <Text type="secondary">{policy.agent.role || 'Đại lý'}</Text>
                  </div>
                </div>
              </div>

              {policy.agent.phone && (
                <div style={{ marginBottom: 8 }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{policy.agent.phone}</Text>
                </div>
              )}

              {policy.agent.email && (
                <div>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{policy.agent.email}</Text>
                </div>
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        footer={null}
        onCancel={() => setImagePreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        <img 
          alt="Xem trước ảnh" 
          style={{ width: '100%' }} 
          src={previewImage} 
        />
      </Modal>

      {/* Add Beneficiary Modal */}
      <Modal
        title="Thêm người thụ hưởng"
        visible={beneficiaryModalVisible}
        onCancel={() => {
          setBeneficiaryModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setBeneficiaryModalVisible(false);
            form.resetFields();
          }}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={addingBeneficiary}
            onClick={handleBeneficiarySubmit}
            disabled={totalBeneficiaryPercentage >= 100}
          >
            Thêm
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ name: '', relationship: '', percentage: 0 }}
        >
          <Form.Item
            name="name"
            label="Tên người thụ hưởng"
            rules={[{ required: true, message: 'Vui lòng nhập tên người thụ hưởng' }]}
          >
            <Input placeholder="Nhập tên người thụ hưởng" />
          </Form.Item>
          
          <Form.Item
            name="relationship"
            label="Mối quan hệ"
            rules={[{ required: true, message: 'Vui lòng nhập mối quan hệ' }]}
          >
            <Input placeholder="Ví dụ: Vợ, Chồng, Con, Bố/Mẹ..." />
          </Form.Item>
          
          <Form.Item
            name="percentage"
            label="Phần trăm thụ hưởng (%)"
            rules={[
              { required: true, message: 'Vui lòng nhập phần trăm thụ hưởng' },
              { type: 'number', min: 1, max: 100 - totalBeneficiaryPercentage, message: `Phần trăm phải từ 1% đến ${100 - totalBeneficiaryPercentage}%` }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="Nhập phần trăm thụ hưởng" 
              min={1} 
              max={100 - totalBeneficiaryPercentage}
            />
          </Form.Item>
          
          <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: -12 }}>
            Phần trăm còn lại có thể phân bổ: {100 - totalBeneficiaryPercentage}%
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PolicyDetails;