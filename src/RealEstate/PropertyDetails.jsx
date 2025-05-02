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
  Carousel,
  Descriptions,
  Statistic,
  Image
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  ExperimentOutlined,
  AreaChartOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import { formatCurrency } from '../Utility/formatCurrency';
// Import Leaflet components
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const carouselRef = React.useRef();

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/real-estate/${id}`);
      if (response.data.success) {
        setProperty(response.data.property);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin bất động sản:', error);
      setError('Không thể tải thông tin bất động sản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/real-estate/edit/${id}`);
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa bất động sản này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: handleDelete,
    });
  };

  const handleDelete = async () => {
    setDeletingProperty(true);
    try {
      const response = await axios.delete(`/api/real-estate/${id}`);
      if (response.data.success) {
        toast.success('Đã xóa bất động sản thành công');
        navigate('/dashboard/real-estate');
      }
    } catch (error) {
      console.error('Lỗi khi xóa bất động sản:', error);
      toast.error('Không thể xóa bất động sản. Vui lòng thử lại.');
    } finally {
      setDeletingProperty(false);
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
      const response = await axios.delete(`/api/real-estate/${id}/images/${index}`);

      if (response.data.success) {
        toast.success('Đã xóa ảnh thành công');
        setProperty(response.data.property);
        
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

  // Check if current user can edit/delete property
  const canEditProperty = () => {
    if (!currentUser || !property) return false;

    // Admin can edit any property
    if (currentUser.isAdmin || currentUser.role === 'ADMIN') return true;

    // Owner can edit their property
    if (property.owner && property.owner._id === currentUser.id) return true;

    // Assigned agent can edit property
    if (property.agent && property.agent._id === currentUser.id) return true;

    return false;
  };

  // Check if coordinates are valid for map display
  const hasValidCoordinates = () => {
    return (
      property &&
      property.location &&
      property.location.coordinates &&
      property.location.coordinates.latitude &&
      property.location.coordinates.longitude &&
      !isNaN(Number(property.location.coordinates.latitude)) &&
      !isNaN(Number(property.location.coordinates.longitude))
    );
  };

  const handleCarouselChange = (current) => {
    setCurrentImageIndex(current);
  };

  const openPreview = (src) => {
    setPreviewImage(src);
    setPreviewVisible(true);
  };

  const goToSlide = (index) => {
    carouselRef.current.goTo(index);
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

  if (!property) {
    return <Alert message="Thông báo" description="Không tìm thấy bất động sản" type="warning" showIcon />;
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/real-estate')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Danh sách bất động sản
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết bất động sản</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          {canEditProperty() && (
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
                  loading={deletingProperty}
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
        {property.images && property.images.length > 0 ? (
          <div>
            <Carousel 
              ref={carouselRef}
              afterChange={handleCarouselChange}
              arrows
              style={{ position: 'relative' }}
            >
              {property.images.map((image, index) => (
                <div key={index}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={image}
                      alt={`${property.title} - Ảnh ${index + 1}`}
                      style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                      onClick={() => openPreview(image)}
                    />
                    {canEditProperty() && (
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
              {property.images.map((image, index) => (
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
              {currentImageIndex + 1} / {property.images.length}
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
                    <Tag color={getTypeColor(property.type)}>{getTypeLabel(property.type)}</Tag>
                    <Tag color={getStatusColor(property.status)}>{getStatusText(property.status)}</Tag>
                  </Space>
                  <Title level={4} style={{ margin: 0 }}>{property.title}</Title>
                  <div>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                    <Text type="secondary">
                      {property.location.address}, {property.location.city}
                      {property.location.district && `, ${property.location.district}`}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Statistic 
                  value={property.price} 
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
                {property.type === 'RENTAL' && 
                  <Text type="secondary" style={{ fontSize: '14px' }}>/tháng</Text>
                }
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={[24, 16]}>
              {property.features && (
                <>
                  {property.features.bedrooms != null && (
                    <Col xs={12} sm={6}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <HomeOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Phòng ngủ</Text>
                          <div><Text strong>{property.features.bedrooms}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}

                  {property.features.bathrooms != null && (
                    <Col xs={12} sm={6}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ExperimentOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Phòng tắm</Text>
                          <div><Text strong>{property.features.bathrooms}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}

                  {property.features.area != null && (
                    <Col xs={12} sm={6}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AreaChartOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Diện tích</Text>
                          <div><Text strong>{property.features.area} m²</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}

                  {property.features.floors != null && (
                    <Col xs={12} sm={6}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BuildOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Số tầng</Text>
                          <div><Text strong>{property.features.floors}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}
                </>
              )}
            </Row>

            <Divider />

            <Title level={5}>Mô tả</Title>
            <Paragraph>
              {property.description}
            </Paragraph>

            {property.features && property.features.amenities && property.features.amenities.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Tiện ích</Title>
                <Row gutter={[16, 16]}>
                  {property.features.amenities.map((amenity, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text>{amenity}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {property.agent && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={5}>Thông tin môi giới</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={property.agent.avatar}
                  style={{ marginRight: 16 }}
                >
                  {property.agent.username ? property.agent.username.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{property.agent.username}</Text>
                  <div>
                    <Text type="secondary">{property.agent.role || 'Môi giới'}</Text>
                  </div>
                </div>
              </div>

              {property.agent.phone && (
                <div style={{ marginBottom: 8 }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{property.agent.phone}</Text>
                </div>
              )}

              {property.agent.email && (
                <div>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{property.agent.email}</Text>
                </div>
              )}
            </Card>
          )}

          <Card>
            <Title level={5}>Vị trí</Title>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
              <EnvironmentOutlined style={{ marginRight: 8, color: '#8c8c8c', marginTop: 4 }} />
              <Text>
                {property.location.address}, {property.location.city}
                {property.location.district && `, ${property.location.district}`}
              </Text>
            </div>

            {/* Leaflet Map Integration */}
            {hasValidCoordinates() ? (
              <div style={{ height: 250, width: '100%', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <MapContainer 
                  center={[
                    Number(property.location.coordinates.latitude), 
                    Number(property.location.coordinates.longitude)
                  ]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker 
                    position={[
                      Number(property.location.coordinates.latitude), 
                      Number(property.location.coordinates.longitude)
                    ]}
                  >
                    <Popup>
                      <div>
                        <Text strong style={{ display: 'block' }}>{property.title}</Text>
                        <Text>{property.location.address}</Text>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div style={{ 
                height: 200, 
                background: '#f5f5f5', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: 4, 
                marginBottom: 16
              }}>
                <Text type="secondary">Không có thông tin tọa độ</Text>
              </div>
            )}
            
            {/* Display coordinates if available */}
            {hasValidCoordinates() && (
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  Vĩ độ: {property.location.coordinates.latitude}
                </Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  Kinh độ: {property.location.coordinates.longitude}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
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
    </Layout>
  );
};

export default PropertyDetails;