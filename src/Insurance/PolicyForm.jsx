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
  Modal,
  DatePicker,
  message
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
import moment from 'moment';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const PolicyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'HEALTH',
    provider: '',
    policyNumber: '',
    description: '',
    coverageDetails: {
      startDate: moment(),
      endDate: moment().add(1, 'year'),
      coverageAmount: '',
      premium: '',
      paymentFrequency: 'MONTHLY'
    },
    beneficiaries: [],
    images: [],
    status: 'PENDING'
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [imageFiles, setImageFiles] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thông tin hợp đồng bảo hiểm khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (isEditMode) {
      fetchPolicyDetails();
    }
  }, [id]);

  // Cập nhật giá trị form khi formData thay đổi
  useEffect(() => {
    form.setFieldsValue({
      type: formData.type,
      provider: formData.provider,
      policyNumber: formData.policyNumber,
      description: formData.description,
      status: formData.status,
      'coverageDetails.coverageAmount': formData.coverageDetails.coverageAmount,
      'coverageDetails.premium': formData.coverageDetails.premium,
      'coverageDetails.paymentFrequency': formData.coverageDetails.paymentFrequency,
      'coverageDetails.dateRange': formData.coverageDetails.startDate && formData.coverageDetails.endDate 
        ? [moment(formData.coverageDetails.startDate), moment(formData.coverageDetails.endDate)]
        : undefined,
    });
  }, [formData]);

  const fetchPolicyDetails = async () => {
    try {
      const response = await axios.get(`/api/insurance/${id}`);
      if (response.data.success) {
        const policy = response.data.policy;
        // Chuyển đổi dữ liệu phù hợp với cấu trúc form
        setFormData({
          type: policy.type,
          provider: policy.provider,
          policyNumber: policy.policyNumber || '',
          description: policy.description || '',
          coverageDetails: {
            startDate: moment(policy.coverageDetails.startDate),
            endDate: moment(policy.coverageDetails.endDate),
            coverageAmount: policy.coverageDetails.coverageAmount,
            premium: policy.coverageDetails.premium,
            paymentFrequency: policy.coverageDetails.paymentFrequency || 'MONTHLY'
          },
          beneficiaries: policy.beneficiaries || [],
          images: policy.images || [],
          status: policy.status
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin hợp đồng bảo hiểm:', error);
      setError('Không thể tải thông tin hợp đồng bảo hiểm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      // Định dạng dữ liệu cho API
      const policyData = {
        type: values.type,
        provider: values.provider,
        policyNumber: values.policyNumber,
        description: values.description,
        status: values.status,
        coverageDetails: {
          startDate: values['coverageDetails.dateRange'][0].toISOString(),
          endDate: values['coverageDetails.dateRange'][1].toISOString(),
          coverageAmount: Number(values['coverageDetails.coverageAmount']),
          premium: Number(values['coverageDetails.premium']),
          paymentFrequency: values['coverageDetails.paymentFrequency']
        },
        beneficiaries: formData.beneficiaries,
        // Loại bỏ URL ảnh trống
        images: formData.images.filter(url => url.trim() !== '')
      };

      let response;
      let newId;
      
      if (isEditMode) {
        // Cập nhật hợp đồng bảo hiểm hiện có
        response = await axios.put(`/api/insurance/${id}`, policyData);
        newId = id;
      } else {
        // Tạo hợp đồng bảo hiểm mới
        response = await axios.post('/api/insurance', policyData);
        newId = response.data.policy._id || response.data.policy.id;
      }

      if (response.data.success) {
        // Nếu có tệp ảnh được chọn, tải chúng lên sau khi tạo/cập nhật hợp đồng bảo hiểm
        if (imageFiles.length > 0) {
          await uploadImages(newId);
        }
        
        toast.success(isEditMode ? 'Cập nhật hợp đồng bảo hiểm thành công' : 'Tạo hợp đồng bảo hiểm mới thành công');
        navigate(isEditMode ? `/dashboard/insurance/${id}` : '/dashboard/insurance');
      }
    } catch (error) {
      console.error(`Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} hợp đồng bảo hiểm:`, error);
      toast.error(`Không thể ${isEditMode ? 'cập nhật' : 'tạo'} hợp đồng bảo hiểm. Vui lòng thử lại.`);
    } finally {
      setSubmitting(false);
    }
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
  const uploadImages = async (policyId) => {
    if (!imageFiles.length) return false;

    setUploadingImages(true);
    const uploadData = new FormData();
    imageFiles.forEach(file => {
      uploadData.append('images', file);
    });

    try {
      const response = await axios.post(`/api/insurance/${policyId}/images`, uploadData, {
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
            <a onClick={() => navigate('/dashboard/insurance')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách hợp đồng bảo hiểm
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {isEditMode ? 'Chỉnh sửa hợp đồng bảo hiểm' : 'Thêm hợp đồng bảo hiểm mới'}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Card>
        <Title level={4}>{isEditMode ? 'Chỉnh sửa thông tin hợp đồng bảo hiểm' : 'Thêm hợp đồng bảo hiểm mới'}</Title>
        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            type: formData.type,
            status: formData.status,
            'coverageDetails.paymentFrequency': 'MONTHLY'
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Loại bảo hiểm"
                rules={[{ required: true, message: 'Vui lòng chọn loại bảo hiểm' }]}
              >
                <Select>
                  <Option value="LIFE">Bảo hiểm nhân thọ</Option>
                  <Option value="HEALTH">Bảo hiểm sức khỏe</Option>
                  <Option value="AUTO">Bảo hiểm xe</Option>
                  <Option value="HOME">Bảo hiểm nhà</Option>
                  <Option value="TRAVEL">Bảo hiểm du lịch</Option>
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
                  <Option value="PENDING">Đang chờ xử lý</Option>
                  <Option value="ACTIVE">Đang hoạt động</Option>
                  <Option value="EXPIRED">Đã hết hạn</Option>
                  <Option value="CANCELLED">Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="provider"
                label="Nhà cung cấp bảo hiểm"
                rules={[{ required: true, message: 'Vui lòng nhập nhà cung cấp bảo hiểm' }]}
              >
                <Input placeholder="Nhập tên công ty bảo hiểm" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="policyNumber"
                label="Mã hợp đồng"
              >
                <Input placeholder="Nhập mã hợp đồng bảo hiểm (nếu có)" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Chi tiết bảo hiểm</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="coverageDetails.dateRange"
                label="Thời gian hiệu lực"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  locale={locale}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="coverageDetails.paymentFrequency"
                label="Tần suất thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn tần suất thanh toán' }]}
              >
                <Select>
                  <Option value="MONTHLY">Hàng tháng</Option>
                  <Option value="QUARTERLY">Hàng quý</Option>
                  <Option value="SEMI_ANNUAL">Nửa năm</Option>
                  <Option value="ANNUAL">Hàng năm</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="coverageDetails.coverageAmount"
                label="Số tiền bảo hiểm"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền bảo hiểm' },
                  { type: 'number', min: 0, message: 'Số tiền phải là số dương', transform: value => Number(value) }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập số tiền bảo hiểm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="coverageDetails.premium"
                label="Phí bảo hiểm"
                rules={[
                  { required: true, message: 'Vui lòng nhập phí bảo hiểm' },
                  { type: 'number', min: 0, message: 'Phí bảo hiểm phải là số dương', transform: value => Number(value) }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập phí bảo hiểm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Hình ảnh hợp đồng</Divider>
          
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
                * Ảnh sẽ được tải lên sau khi bạn lưu hợp đồng bảo hiểm
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
                        alt={`Ảnh hợp đồng ${index + 1}`}
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
              <Button onClick={() => navigate('/dashboard/insurance')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditMode ? 'Cập nhật hợp đồng bảo hiểm' : 'Tạo hợp đồng bảo hiểm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PolicyForm;