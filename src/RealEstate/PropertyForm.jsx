import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Divider,
  Spin,
  Alert,
  Breadcrumb,
  Card,
  Upload,
  Tag,
  Space,
  InputNumber,
  Image,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'RENTAL',
    title: '',
    description: '',
    price: '',
    location: {
      address: '',
      city: '',
      district: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    features: {
      area: '',
      bedrooms: '',
      bathrooms: '',
      floors: '',
      amenities: []
    },
    images: [],
    status: 'AVAILABLE'
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newAmenity, setNewAmenity] = useState('');

  const [imageFiles, setImageFiles] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thông tin bất động sản khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (isEditMode) {
      fetchPropertyDetails();
    }
  }, [id]);

  // Cập nhật giá trị form khi formData thay đổi
  useEffect(() => {
    form.setFieldsValue({
      type: formData.type,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      status: formData.status,
      'location.address': formData.location.address,
      'location.city': formData.location.city,
      'location.district': formData.location.district,
      'location.coordinates.latitude': formData.location.coordinates.latitude,
      'location.coordinates.longitude': formData.location.coordinates.longitude,
      'features.area': formData.features.area,
      'features.bedrooms': formData.features.bedrooms,
      'features.bathrooms': formData.features.bathrooms,
      'features.floors': formData.features.floors
    });
  }, [formData]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await axios.get(`/api/real-estate/${id}`);
      if (response.data.success) {
        const property = response.data.property;
        // Chuyển đổi dữ liệu phù hợp với cấu trúc form
        setFormData({
          type: property.type,
          title: property.title,
          description: property.description,
          price: property.price,
          location: {
            address: property.location.address || '',
            city: property.location.city || '',
            district: property.location.district || '',
            coordinates: {
              latitude: property.location.coordinates?.latitude || '',
              longitude: property.location.coordinates?.longitude || ''
            }
          },
          features: {
            area: property.features?.area || '',
            bedrooms: property.features?.bedrooms || '',
            bathrooms: property.features?.bathrooms || '',
            floors: property.features?.floors || '',
            amenities: property.features?.amenities || []
          },
          images: property.images || [],
          status: property.status
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin bất động sản:', error);
      setError('Không thể tải thông tin bất động sản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      // Định dạng dữ liệu cho API
      const propertyData = {
        type: values.type,
        title: values.title,
        description: values.description,
        price: Number(values.price),
        status: values.status,
        location: {
          address: values['location.address'],
          city: values['location.city'],
          district: values['location.district'],
          coordinates: {
            latitude: values['location.coordinates.latitude'] ? Number(values['location.coordinates.latitude']) : undefined,
            longitude: values['location.coordinates.longitude'] ? Number(values['location.coordinates.longitude']) : undefined
          }
        },
        features: {
          area: values['features.area'] ? Number(values['features.area']) : undefined,
          bedrooms: values['features.bedrooms'] ? Number(values['features.bedrooms']) : undefined,
          bathrooms: values['features.bathrooms'] ? Number(values['features.bathrooms']) : undefined,
          floors: values['features.floors'] ? Number(values['features.floors']) : undefined,
          amenities: formData.features.amenities
        },
        // Loại bỏ URL ảnh trống
        images: formData.images.filter(url => url.trim() !== '')
      };

      let response;
      let newId;
      
      if (isEditMode) {
        // Cập nhật bất động sản hiện có
        response = await axios.put(`/api/real-estate/${id}`, propertyData);
        newId = id;
      } else {
        // Tạo bất động sản mới
        response = await axios.post('/api/real-estate', propertyData);
        newId = response.data.property._id || response.data.property.id;
      }

      if (response.data.success) {
        // Nếu có tệp ảnh được chọn, tải chúng lên sau khi tạo/cập nhật bất động sản
        if (imageFiles.length > 0) {
          await uploadImages(newId);
        }
        
        toast.success(isEditMode ? 'Cập nhật bất động sản thành công' : 'Tạo bất động sản mới thành công');
        navigate(isEditMode ? `/dashboard/real-estate/${id}` : '/dashboard/real-estate');
      }
    } catch (error) {
      console.error(`Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} bất động sản:`, error);
      toast.error(`Không thể ${isEditMode ? 'cập nhật' : 'tạo'} bất động sản. Vui lòng thử lại.`);
    } finally {
      setSubmitting(false);
    }
  };
  const addAmenity = () => {
    if (newAmenity.trim() && !formData.features.amenities.includes(newAmenity.trim())) {
      // Lấy giá trị hiện tại từ form
      const currentFormValues = form.getFieldsValue();
      
      // Cập nhật formData với các giá trị hiện tại từ form và thêm tiện ích mới
      const updatedFormData = {
        ...formData,
        ...currentFormValues,
        features: {
          ...formData.features,
          ...currentFormValues.features,
          amenities: [...formData.features.amenities, newAmenity.trim()]
        },
        location: {
          ...formData.location,
          ...currentFormValues.location,
          coordinates: {
            ...formData.location.coordinates,
            ...currentFormValues.location?.coordinates
          }
        }
      };
      
      setFormData(updatedFormData);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    // Lấy giá trị hiện tại từ form
    const currentFormValues = form.getFieldsValue();
    
    const updatedAmenities = [...formData.features.amenities];
    updatedAmenities.splice(index, 1);
    
    // Cập nhật formData với các giá trị hiện tại từ form và danh sách tiện ích đã cập nhật
    const updatedFormData = {
      ...formData,
      ...currentFormValues,
      features: {
        ...formData.features,
        ...currentFormValues.features,
        amenities: updatedAmenities
      },
      location: {
        ...formData.location,
        ...currentFormValues.location,
        coordinates: {
          ...formData.location.coordinates,
          ...currentFormValues.location?.coordinates
        }
      }
    };
    
    setFormData(updatedFormData);
  };
  const addImageUrl = () => {
    setFormData({
      ...formData,
      images: [...formData.images, '']
    });
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData({
      ...formData,
      images: updatedImages
    });
  };

  const removeImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages
    });
  };

  // Xử lý khi chọn file để upload
  const handleFilesSelect = (info) => {
    const fileList = info.fileList;
    setImageFiles(fileList.map(file => file.originFileObj));
    
    // Tạo đối tượng preview từ danh sách file
    const previewFiles = fileList.map(file => ({
      uid: file.uid,
      name: file.name,
      url: URL.createObjectURL(file.originFileObj)
    }));
    
    setUploadPreview(previewFiles);
  };

  // Upload ảnh lên server
  const uploadImages = async (propertyId) => {
    if (!imageFiles.length) return false;

    setUploadingImages(true);
    const uploadData = new FormData();
    imageFiles.forEach(file => {
      uploadData.append('images', file);
    });

    try {
      const response = await axios.post(`/api/real-estate/${propertyId}/images`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Tải ảnh lên thành công');
        setImageFiles([]);
        setUploadPreview([]);
        return true;
      } else {
        toast.error('Không thể tải ảnh lên');
        return false;
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh lên:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên');
      return false;
    } finally {
      setUploadingImages(false);
    }
  };

  // Xóa file khỏi danh sách sẽ upload
  const removeFileFromUpload = (file) => {
    setImageFiles(prev => prev.filter((_, index) => 
      uploadPreview[index].uid !== file.uid
    ));
    setUploadPreview(prev => prev.filter(item => item.uid !== file.uid));
  };

  // Hiển thị xác nhận trước khi xóa ảnh
  const showDeleteImageConfirm = (index) => {
    confirm({
      title: 'Xác nhận xóa ảnh',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => removeImage(index),
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/dashboard/real-estate')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách bất động sản
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {isEditMode ? 'Chỉnh sửa bất động sản' : 'Thêm bất động sản mới'}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Card>
        <Title level={4}>{isEditMode ? 'Chỉnh sửa thông tin bất động sản' : 'Thêm bất động sản mới'}</Title>
        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            type: formData.type,
            status: formData.status
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Loại bất động sản"
                rules={[{ required: true, message: 'Vui lòng chọn loại bất động sản' }]}
              >
                <Select>
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
                <Select>
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
                rules={[
                  { required: true, message: 'Vui lòng nhập giá' },
                  { type: 'number', min: 0, message: 'Giá phải là số dương', transform: value => Number(value) }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập giá bất động sản"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Vị trí</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="location.address"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input placeholder="Nhập địa chỉ cụ thể" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="location.city"
                label="Thành phố"
                rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
              >
                <Input placeholder="Nhập thành phố" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="location.district"
                label="Quận/Huyện"
              >
                <Input placeholder="Nhập quận/huyện" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="location.coordinates.latitude"
                label="Vĩ độ"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập vĩ độ (nếu có)"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="location.coordinates.longitude"
                label="Kinh độ"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập kinh độ (nếu có)"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Đặc điểm</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="features.area"
                label="Diện tích (m²)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Nhập diện tích"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="features.bedrooms"
                label="Số phòng ngủ"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Nhập số phòng ngủ"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="features.bathrooms"
                label="Số phòng tắm"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Nhập số phòng tắm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="features.floors"
                label="Số tầng"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Nhập số tầng"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Tiện ích</Divider>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Thêm tiện ích mới"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              style={{ width: 'calc(100% - 110px)', marginRight: 8 }}
              onPressEnter={addAmenity}
            />
            <Button type="primary" onClick={addAmenity} disabled={!newAmenity.trim()}>
              Thêm
            </Button>
          </div>

          <div style={{ marginBottom: 16 }}>
            {formData.features.amenities.map((amenity, index) => (
              <Tag
                closable
                onClose={() => removeAmenity(index)}
                style={{ marginBottom: 8 }}
                key={index}
              >
                {amenity}
              </Tag>
            ))}
            {formData.features.amenities.length === 0 && (
              <Text type="secondary">Chưa có tiện ích nào được thêm.</Text>
            )}
          </div>

          <Divider orientation="left">Hình ảnh bất động sản</Divider>
          
          {/* Phần tải lên hình ảnh - có sẵn trong cả chế độ tạo mới và chỉnh sửa */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f7f7f7', borderRadius: 4 }}>
            <Title level={5}>Tải lên hình ảnh</Title>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                listType="picture-card"
                fileList={uploadPreview}
                onRemove={removeFileFromUpload}
                beforeUpload={() => false} // Ngăn tự động upload
                onChange={handleFilesSelect}
                multiple
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                </div>
              </Upload>
              
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
                * Ảnh sẽ được tải lên sau khi bạn lưu bất động sản
              </div>
            </Space>
          </div>

          {/* Hiển thị ảnh hiện có - chỉ trong chế độ chỉnh sửa */}
          {isEditMode && formData.images && formData.images.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Ảnh hiện có:</Title>
              <Row gutter={[16, 16]}>
                {formData.images.map((image, index) => (
                  <Col xs={12} sm={8} md={6} key={index}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={image}
                        alt={`Ảnh bất động sản ${index + 1}`}
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => showDeleteImageConfirm(index)}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Thêm ảnh bằng URL - có sẵn trong cả chế độ tạo mới và chỉnh sửa */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Thêm ảnh bằng URL:</Title>
            
            {formData.images.map((image, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: 8 }}>
                <Input
                  placeholder={`URL ảnh ${index + 1}`}
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeImage(index)}
                />
              </div>
            ))}
            
            <Button
              type="dashed"
              onClick={addImageUrl}
              icon={<PlusOutlined />}
              style={{ width: '100%', marginTop: 8 }}
            >
              Thêm URL ảnh
            </Button>
          </div>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/dashboard/real-estate')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditMode ? 'Cập nhật bất động sản' : 'Tạo bất động sản mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PropertyForm;