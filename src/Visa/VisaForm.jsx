import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Layout, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Card, 
  Divider, 
  Spin, 
  Alert, 
  Breadcrumb, 
  Row, 
  Col, 
  Space, 
  InputNumber, 
  Upload, 
  message, 
  Tag
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Modal } from 'antd';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const VisaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'TOURIST',
    destination: '',
    purpose: '',
    applicationDetails: {
      passportNumber: '',
      issueDate: moment(),
      expiryDate: moment().add(5, 'years'),
      entryType: 'SINGLE',
      durationOfStay: 30,
      appliedDate: moment()
    },
    documents: [],
    notes: '',
    images: []
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newDocumentUrl, setNewDocumentUrl] = useState('');

  const [imageFiles, setImageFiles] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thông tin hồ sơ visa khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (isEditMode) {
      const fetchVisaApplication = async () => {
        try {
          const response = await axios.get(`/api/visa/${id}`);
          if (response.data.success) {
            const visaData = response.data.visaApplication;
            setFormData({
              type: visaData.type || 'TOURIST',
              destination: visaData.destination || '',
              purpose: visaData.purpose || '',
              applicationDetails: {
                passportNumber: visaData.applicationDetails.passportNumber || '',
                issueDate: moment(visaData.applicationDetails.issueDate),
                expiryDate: moment(visaData.applicationDetails.expiryDate),
                entryType: visaData.applicationDetails.entryType || 'SINGLE',
                durationOfStay: visaData.applicationDetails.durationOfStay || 30,
                appliedDate: moment(visaData.applicationDetails.appliedDate)
              },
              documents: visaData.documents || [],
              notes: visaData.notes || '',
              images: visaData.images || []
            });
          } else {
            setError('Không thể tải thông tin hồ sơ visa');
          }
        } catch (err) {
          console.error('Lỗi khi tải thông tin hồ sơ visa:', err);
          setError(err.response?.data?.message || 'Lỗi khi tải thông tin hồ sơ visa');
        } finally {
          setLoading(false);
        }
      };

      fetchVisaApplication();
    }
  }, [id]);

  // Cập nhật giá trị form khi formData thay đổi
  useEffect(() => {
    form.setFieldsValue({
      type: formData.type,
      destination: formData.destination,
      purpose: formData.purpose,
      'applicationDetails.passportNumber': formData.applicationDetails.passportNumber,
      'applicationDetails.issueDate': formData.applicationDetails.issueDate,
      'applicationDetails.expiryDate': formData.applicationDetails.expiryDate,
      'applicationDetails.entryType': formData.applicationDetails.entryType,
      'applicationDetails.durationOfStay': formData.applicationDetails.durationOfStay,
      notes: formData.notes
    });
  }, [formData]);

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      // Định dạng dữ liệu cho API
      const visaData = {
        type: values.type,
        destination: values.destination,
        purpose: values.purpose,
        applicationDetails: {
          passportNumber: values['applicationDetails.passportNumber'],
          issueDate: values['applicationDetails.issueDate'].toISOString(),
          expiryDate: values['applicationDetails.expiryDate'].toISOString(),
          entryType: values['applicationDetails.entryType'],
          durationOfStay: Number(values['applicationDetails.durationOfStay']),
          appliedDate: formData.applicationDetails.appliedDate.toISOString()
        },
        notes: values.notes,
        documents: formData.documents.filter(url => url.trim() !== ''),
        images: formData.images.filter(url => url.trim() !== '')
      };

      let response;
      let newId;
      
      if (isEditMode) {
        // Cập nhật hồ sơ visa hiện có
        response = await axios.put(`/api/visa/${id}`, visaData);
        newId = id;
      } else {
        // Tạo hồ sơ visa mới
        response = await axios.post('/api/visa', visaData);
        newId = response.data.visaApplication._id || response.data.visaApplication.id;
      }

      if (response.data.success) {
        // Nếu có tệp ảnh được chọn, tải chúng lên sau khi tạo/cập nhật hồ sơ visa
        if (imageFiles.length > 0) {
          await uploadImages(newId);
        }
        
        toast.success(isEditMode ? 'Cập nhật hồ sơ visa thành công' : 'Tạo hồ sơ visa mới thành công');
        navigate(isEditMode ? `/dashboard/visa/${id}` : '/dashboard/visa');
      }
    } catch (error) {
      console.error(`Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} hồ sơ visa:`, error);
      toast.error(`Không thể ${isEditMode ? 'cập nhật' : 'tạo'} hồ sơ visa. Vui lòng thử lại.`);
    } finally {
      setSubmitting(false);
    }
  };

  const addDocumentUrl = () => {
    if (!newDocumentUrl.trim()) return;
    
    try {
      // Basic URL validation
      new URL(newDocumentUrl);
      
      setFormData({
        ...formData,
        documents: [...formData.documents, newDocumentUrl]
      });
      setNewDocumentUrl('');
    } catch (err) {
      toast.error('Vui lòng nhập URL hợp lệ');
    }
  };

  const handleRemoveDocument = (index) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments.splice(index, 1);
    setFormData({
      ...formData,
      documents: updatedDocuments
    });
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
  const uploadImages = async (visaId) => {
    if (!imageFiles.length) return false;

    setUploadingImages(true);
    const uploadData = new FormData();
    imageFiles.forEach(file => {
      uploadData.append('images', file);
    });

    try {
      const response = await axios.post(`/api/visa/${visaId}/images`, uploadData, {
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
            <a onClick={() => navigate('/dashboard/visa')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách hồ sơ visa
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {isEditMode ? 'Chỉnh sửa hồ sơ visa' : 'Tạo hồ sơ visa mới'}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Card>
        <Title level={4}>{isEditMode ? 'Chỉnh sửa thông tin hồ sơ visa' : 'Tạo hồ sơ visa mới'}</Title>
        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            type: formData.type,
            'applicationDetails.entryType': 'SINGLE'
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="type"
                label="Loại visa"
                rules={[{ required: true, message: 'Vui lòng chọn loại visa' }]}
              >
                <Select>
                  <Option value="TOURIST">Du lịch</Option>
                  <Option value="BUSINESS">Công việc</Option>
                  <Option value="GUARANTOR">Bảo lãnh</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={16}>
              <Form.Item
                name="destination"
                label="Quốc gia đến"
                rules={[{ required: true, message: 'Vui lòng nhập quốc gia đến' }]}
              >
                <Input placeholder="Nhập tên quốc gia" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="purpose"
                label="Mục đích chuyến đi"
                rules={[
                  { required: true, message: 'Vui lòng nhập mục đích chuyến đi' },
                  { min: 10, message: 'Mục đích cần ít nhất 10 ký tự' }
                ]}
              >
                <TextArea rows={4} placeholder="Mô tả chi tiết mục đích chuyến đi của bạn" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Thông tin hộ chiếu</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="applicationDetails.passportNumber"
                label="Số hộ chiếu"
                rules={[{ required: true, message: 'Vui lòng nhập số hộ chiếu' }]}
              >
                <Input placeholder="Nhập số hộ chiếu" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="applicationDetails.entryType"
                label="Loại nhập cảnh"
                rules={[{ required: true, message: 'Vui lòng chọn loại nhập cảnh' }]}
              >
                <Select>
                  <Option value="SINGLE">Một lần</Option>
                  <Option value="MULTIPLE">Nhiều lần</Option>
                  <Option value="TRANSIT">Quá cảnh</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="applicationDetails.issueDate"
                label="Ngày cấp"
                rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="applicationDetails.expiryDate"
                label="Ngày hết hạn"
                rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="applicationDetails.durationOfStay"
                label="Thời gian lưu trú (ngày)"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian lưu trú' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="Nhập số ngày lưu trú"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Tài liệu hỗ trợ</Divider>
          
          <Row gutter={16}>
            <Col xs={24}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="Thêm URL tài liệu"
                  value={newDocumentUrl}
                  onChange={(e) => setNewDocumentUrl(e.target.value)}
                  style={{ width: 'calc(100% - 110px)', marginRight: 8 }}
                  onPressEnter={addDocumentUrl}
                />
                <Button type="primary" onClick={addDocumentUrl} disabled={!newDocumentUrl.trim()}>
                  Thêm
                </Button>
              </div>

              <div style={{ marginBottom: 16 }}>
                {formData.documents.map((doc, index) => (
                  <Tag
                    closable
                    onClose={() => handleRemoveDocument(index)}
                    style={{ marginBottom: 8 }}
                    key={index}
                  >
                    <a href={doc} target="_blank" rel="noopener noreferrer">
                      Tài liệu {index + 1}
                    </a>
                  </Tag>
                ))}
                {formData.documents.length === 0 && (
                  <Text type="secondary">Chưa có tài liệu nào được thêm.</Text>
                )}
              </div>
            </Col>
          </Row>

          <Divider orientation="left">Hình ảnh</Divider>
          
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
                * Ảnh sẽ được tải lên sau khi bạn lưu hồ sơ visa
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
                        alt={`Ảnh hồ sơ ${index + 1}`}
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

          <Divider orientation="left">Ghi chú bổ sung</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="notes"
                label="Ghi chú"
              >
                <TextArea rows={4} placeholder="Nhập ghi chú hoặc thông tin bổ sung" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/dashboard/visa')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditMode ? 'Cập nhật hồ sơ visa' : 'Tạo hồ sơ visa mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default VisaForm;