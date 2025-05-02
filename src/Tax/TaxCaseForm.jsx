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
  DatePicker,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  FileOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useAuth } from '../services/AuthProvider';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const TaxCaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'INCOME_TAX',
    fiscalYear: new Date().getFullYear().toString(),
    details: {
      totalIncome: '',
      totalDeductions: '',
      totalTaxDue: '',
      filingDeadline: moment(new Date().setMonth(3, 15))
    },
    documents: [],
    notes: '',
    status: 'PENDING'
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [documentFiles, setDocumentFiles] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef(null);

  // Kiểm tra nếu người dùng là chuyên viên thuế (admin hoặc support)
  const isTaxProfessional = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPPORT');

  // Lấy thông tin hồ sơ thuế khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (isEditMode) {
      fetchTaxCaseDetails();
    }
  }, [id]);

  // Cập nhật giá trị form khi formData thay đổi
  useEffect(() => {
    form.setFieldsValue({
      type: formData.type,
      fiscalYear: formData.fiscalYear,
      status: formData.status,
      'details.totalIncome': formData.details.totalIncome,
      'details.totalDeductions': formData.details.totalDeductions,
      'details.totalTaxDue': formData.details.totalTaxDue,
      'details.filingDeadline': formData.details.filingDeadline,
      notes: formData.notes
    });
  }, [formData]);

  const fetchTaxCaseDetails = async () => {
    try {
      const response = await axios.get(`/api/tax/${id}`);
      if (response.data.success) {
        const taxCase = response.data.taxCase;
        // Chuyển đổi dữ liệu phù hợp với cấu trúc form
        setFormData({
          type: taxCase.type,
          fiscalYear: taxCase.fiscalYear,
          details: {
            totalIncome: taxCase.details?.totalIncome || '',
            totalDeductions: taxCase.details?.totalDeductions || '',
            totalTaxDue: taxCase.details?.totalTaxDue || '',
            filingDeadline: taxCase.details?.filingDeadline ? moment(taxCase.details.filingDeadline) : null
          },
          documents: taxCase.documents || [],
          notes: taxCase.notes || '',
          status: taxCase.status || 'PENDING'
        });
      } else {
        setError('Không thể tải thông tin hồ sơ thuế');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin hồ sơ thuế:', error);
      setError(error.response?.data?.message || 'Lỗi khi tải thông tin hồ sơ thuế');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      // Định dạng dữ liệu cho API
      const taxCaseData = {
        type: values.type,
        fiscalYear: values.fiscalYear,
        details: {
          totalIncome: values['details.totalIncome'] ? Number(values['details.totalIncome']) : undefined,
          totalDeductions: values['details.totalDeductions'] ? Number(values['details.totalDeductions']) : undefined,
          totalTaxDue: values['details.totalTaxDue'] ? Number(values['details.totalTaxDue']) : undefined,
          filingDeadline: values['details.filingDeadline'] ? values['details.filingDeadline'].toISOString() : undefined
        },
        notes: values.notes,
        status: values.status,
        documents: formData.documents.filter(url => url.trim() !== '')
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`/api/tax/${id}`, taxCaseData);
      } else {
        response = await axios.post('/api/tax', taxCaseData);
      }

      if (response.data.success) {
        toast.success(isEditMode ? 'Cập nhật hồ sơ thuế thành công' : 'Tạo hồ sơ thuế mới thành công');
        navigate(isEditMode ? `/dashboard/tax/${id}` : '/dashboard/tax');
      }
    } catch (error) {
      console.error(`Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} hồ sơ thuế:`, error);
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.join(', ');
        toast.error(`Lỗi: ${errorMessages}`);
      } else {
        toast.error(`Không thể ${isEditMode ? 'cập nhật' : 'tạo'} hồ sơ thuế. Vui lòng thử lại.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addDocumentUrl = () => {
    if (!newDocumentUrl) return;

    try {
      // Kiểm tra URL hợp lệ
      new URL(newDocumentUrl);

      setFormData({
        ...formData,
        documents: [...formData.documents, newDocumentUrl]
      });
      setNewDocumentUrl('');
    } catch (e) {
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

  // Xử lý khi chọn file để upload
  const handleFilesSelect = (info) => {
    const fileList = info.fileList;
    setDocumentFiles(fileList.map(file => file.originFileObj));
    setFileList(fileList);
  };

  // Upload tài liệu lên server
  const uploadDocuments = async () => {
    if (!documentFiles.length || !id) {
      toast.error('Vui lòng lưu hồ sơ thuế trước khi tải tài liệu lên');
      return;
    }

    setUploadingDocuments(true);
    const uploadData = new FormData();
    documentFiles.forEach(file => {
      uploadData.append('documents', file);
    });

    try {
      const response = await axios.post(`/api/tax/${id}/documents`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Tải tài liệu lên thành công');
        setFormData({
          ...formData,
          documents: response.data.taxCase.documents
        });
        setDocumentFiles([]);
        setFileList([]);
      } else {
        toast.error('Không thể tải tài liệu lên');
      }
    } catch (err) {
      console.error('Lỗi khi tải tài liệu lên:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải tài liệu lên');
    } finally {
      setUploadingDocuments(false);
    }
  };

  // Hiển thị xác nhận trước khi xóa tài liệu
  const showDeleteConfirm = (index) => {
    confirm({
      title: 'Xác nhận xóa tài liệu',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleRemoveDocument(index),
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
            <a onClick={() => navigate('/dashboard/tax')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách hồ sơ thuế
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {isEditMode ? 'Chỉnh sửa hồ sơ thuế' : 'Tạo hồ sơ thuế mới'}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Card>
        <Title level={4}>{isEditMode ? 'Chỉnh sửa thông tin hồ sơ thuế' : 'Tạo hồ sơ thuế mới'}</Title>
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
                label="Loại hồ sơ thuế"
                rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ thuế' }]}
              >
                <Select>
                  <Option value="INCOME_TAX">Thuế thu nhập</Option>
                  <Option value="PROPERTY_TAX">Thuế bất động sản</Option>
                  <Option value="TAX_RETURN">Hoàn thuế</Option>
                  <Option value="TAX_CONSULTATION">Tư vấn thuế</Option>
                </Select>
              </Form.Item>
            </Col>

            {isTaxProfessional && isEditMode && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select>
                    <Option value="PENDING">Chờ xử lý</Option>
                    <Option value="IN_PROGRESS">Đang xử lý</Option>
                    <Option value="COMPLETED">Hoàn thành</Option>
                    <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={isTaxProfessional && isEditMode ? 12 : 12}>
              <Form.Item
                name="fiscalYear"
                label="Năm tài chính"
                rules={[
                  { required: true, message: 'Vui lòng nhập năm tài chính' },
                  {
                    pattern: /^(\d{4})(-\d{4})?$/,
                    message: 'Năm tài chính phải có định dạng YYYY hoặc YYYY-YYYY'
                  }
                ]}
              >
                <Input placeholder="Ví dụ: 2023 hoặc 2023-2024" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Divider orientation="left">Chi tiết thuế</Divider>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="details.totalIncome"
                label="Tổng thu nhập"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập tổng thu nhập"
                  min={0}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="details.totalDeductions"
                label="Tổng khấu trừ"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập tổng khấu trừ"
                  min={0}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="details.totalTaxDue"
                label="Tổng thuế phải nộp"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập tổng thuế phải nộp"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="details.filingDeadline"
                label="Hạn nộp thuế"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Divider orientation="left">Tài liệu hỗ trợ</Divider>
            </Col>

            <Col xs={24}>
              <div style={{ marginBottom: 24, padding: 16, background: '#f7f7f7', borderRadius: 4 }}>
                <Title level={5}>Tải lên tài liệu</Title>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleFilesSelect}
                    beforeUpload={() => false} // Ngăn tự động upload
                    multiple
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Chọn tài liệu</div>
                    </div>
                  </Upload>
                  
                  {documentFiles.length > 0 && (
                    <Button
                      type="primary"
                      onClick={uploadDocuments}
                      loading={uploadingDocuments}
                      disabled={!id}
                      icon={<UploadOutlined />}
                    >
                      {id ? 'Tải lên' : 'Lưu hồ sơ trước khi tải lên'}
                    </Button>
                  )}
                  
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
                    * Tài liệu sẽ được tải lên sau khi bạn lưu hồ sơ thuế
                  </div>
                </Space>
              </div>
            </Col>

            <Col xs={24}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="Thêm URL tài liệu"
                  value={newDocumentUrl}
                  onChange={(e) => setNewDocumentUrl(e.target.value)}
                  style={{ width: 'calc(100% - 110px)', marginRight: 8 }}
                  onPressEnter={addDocumentUrl}
                  prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                />
                <Button type="primary" onClick={addDocumentUrl} disabled={!newDocumentUrl.trim()}>
                  Thêm
                </Button>
              </div>

              <div style={{ marginBottom: 16 }}>
                {formData.documents.map((doc, index) => (
                  <Tag
                    closable
                    onClose={() => showDeleteConfirm(index)}
                    style={{ marginBottom: 8 }}
                    key={index}
                    icon={<FileOutlined />}
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

            <Col xs={24}>
              <Divider orientation="left">Ghi chú</Divider>
              <Form.Item
                name="notes"
                label="Ghi chú bổ sung"
              >
                <TextArea 
                  rows={4} 
                  placeholder="Nhập thông tin bổ sung hoặc ghi chú đặc biệt..." 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/dashboard/tax')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditMode ? 'Cập nhật hồ sơ thuế' : 'Tạo hồ sơ thuế mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TaxCaseForm;