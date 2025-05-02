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
  Statistic,
  List,
  Input,
  Form,
  Select
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import { formatCurrency } from '../Utility/formatCurrency';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { TextArea } = Input;

const TaxCaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [taxCase, setTaxCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTaxCase = async () => {
    try {
      const response = await axios.get(`/api/tax/${id}`);
      if (response.data.success) {
        setTaxCase(response.data.taxCase);
      } else {
        setError('Không thể tải thông tin hồ sơ thuế');
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin hồ sơ thuế:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin hồ sơ thuế');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCase();
  }, [id]);

  const canEditTaxCase = () => {
    if (!taxCase || !currentUser) return false;
    
    const isOwner = taxCase.client._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    const isSupport = currentUser.role === 'SUPPORT';
    const isAssignedProfessional = taxCase.taxProfessional && taxCase.taxProfessional._id === currentUser.id;
    
    // Allow edits if you're the client and status is PENDING or REVISION_NEEDED
    if (isOwner && ['PENDING', 'REVISION_NEEDED'].includes(taxCase.status)) {
      return true;
    }
    
    // Tax professionals and admins can always edit
    return isAdmin || isSupport || isAssignedProfessional;
  };

  const canDeleteTaxCase = () => {
    if (!taxCase || !currentUser) return false;
    
    const isOwner = taxCase.client._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    
    // Only allow deletion if PENDING status or you're an admin
    if (isOwner && taxCase.status === 'PENDING') {
      return true;
    }
    
    return isAdmin;
  };

  const canChangeStatus = () => {
    if (!taxCase || !currentUser) return false;
    
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    const isSupport = currentUser.role === 'SUPPORT';
    const isAssignedProfessional = taxCase.taxProfessional && taxCase.taxProfessional._id === currentUser.id;
    
    return isAdmin || isSupport || isAssignedProfessional;
  };

  const handleEdit = () => {
    navigate(`/dashboard/tax/edit/${id}`);
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa hồ sơ thuế này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: handleDelete,
    });
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const response = await axios.delete(`/api/tax/${id}`);
      if (response.data.success) {
        toast.success('Đã xóa hồ sơ thuế thành công');
        navigate('/dashboard/tax');
      } else {
        toast.error('Không thể xóa hồ sơ thuế');
      }
    } catch (err) {
      console.error('Lỗi khi xóa hồ sơ thuế:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa hồ sơ thuế');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument) return;
    
    try {
      // Kiểm tra URL hợp lệ
      new URL(newDocument);
      
      setSubmitting(true);
      const response = await axios.post(`/api/tax/${id}/documents`, {
        documentUrl: newDocument
      });
      
      if (response.data.success) {
        toast.success('Đã thêm tài liệu thành công');
        setTaxCase(response.data.taxCase);
        setNewDocument('');
        setDocumentDialogOpen(false);
      } else {
        toast.error('Không thể thêm tài liệu');
      }
    } catch (err) {
      console.error('Lỗi khi thêm tài liệu:', err);
      toast.error(err.response?.data?.message || 'Vui lòng nhập URL hợp lệ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDocument = async (index) => {
    confirm({
      title: 'Xác nhận xóa tài liệu',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/tax/${id}/documents/${index}`);
          if (response.data.success) {
            toast.success('Đã xóa tài liệu thành công');
            setTaxCase(response.data.taxCase);
          } else {
            toast.error('Không thể xóa tài liệu');
          }
        } catch (err) {
          console.error('Lỗi khi xóa tài liệu:', err);
          toast.error(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
        }
      }
    });
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    
    setSubmitting(true);
    try {
      const response = await axios.put(`/api/tax/${id}/status`, {
        status: newStatus,
        notes: statusNote
      });
      
      if (response.data.success) {
        toast.success('Cập nhật trạng thái thành công');
        setTaxCase(response.data.taxCase);
        setStatusDialogOpen(false);
        setNewStatus('');
        setStatusNote('');
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
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
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
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

  if (!taxCase) {
    return <Alert message="Thông báo" description="Không tìm thấy hồ sơ thuế" type="warning" showIcon />;
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/tax')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Danh sách hồ sơ thuế
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết hồ sơ thuế</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          <Col>
            <Space>
              {canChangeStatus() && (
                <Button 
                  type="primary"
                  onClick={() => {
                    setNewStatus(taxCase.status);
                    setStatusDialogOpen(true);
                  }}
                >
                  Thay đổi trạng thái
                </Button>
              )}
              
              {canEditTaxCase() && (
                <Button 
                  icon={<EditOutlined />} 
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </Button>
              )}
              
              {canDeleteTaxCase() && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={showDeleteConfirm}
                  loading={submitting}
                >
                  Xóa
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="top" style={{ marginBottom: 16 }}>
              <Col>
                <Space direction="vertical" size={8} style={{ marginBottom: 8 }}>
                  <Space>
                    <Tag color={getTypeColor(taxCase.type)}>{getTypeLabel(taxCase.type)}</Tag>
                    <Tag color={getStatusColor(taxCase.status)}>{getStatusText(taxCase.status)}</Tag>
                  </Space>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                    <Title level={4} style={{ margin: 0 }}>Năm tài chính: {taxCase.fiscalYear}</Title>
                  </div>
                </Space>
              </Col>
              {taxCase.details && taxCase.details.totalTaxDue !== undefined && (
                <Statistic 
                  title="Tổng thuế phải nộp"
                  value={taxCase.details.totalTaxDue} 
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              )}
            </Row>

            <Divider />

            <Title level={5}>Chi tiết tài chính</Title>
            <Row gutter={[24, 16]}>
              {taxCase.details && (
                <>
                  {taxCase.details.totalIncome !== undefined && (
                    <Col xs={12} sm={8}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DollarOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Tổng thu nhập</Text>
                          <div><Text strong>{formatCurrency(taxCase.details.totalIncome)}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {taxCase.details.totalDeductions !== undefined && (
                    <Col xs={12} sm={8}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DollarOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Tổng khấu trừ</Text>
                          <div><Text strong>{formatCurrency(taxCase.details.totalDeductions)}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {taxCase.details.totalTaxDue !== undefined && (
                    <Col xs={12} sm={8}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DollarOutlined style={{ fontSize: 18, color: '#1890ff', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Tổng thuế phải nộp</Text>
                          <div><Text strong>{formatCurrency(taxCase.details.totalTaxDue)}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {taxCase.details.filingDeadline && (
                    <Col xs={24}>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                        <CalendarOutlined style={{ fontSize: 18, color: '#fa8c16', marginRight: 8 }} />
                        <div>
                          <Text type="secondary">Hạn nộp thuế</Text>
                          <div><Text strong>{formatDate(taxCase.details.filingDeadline)}</Text></div>
                        </div>
                      </div>
                    </Col>
                  )}
                </>
              )}
            </Row>

            <Divider />

            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Tài liệu</Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDocumentDialogOpen(true)}
              >
                Thêm tài liệu
              </Button>
            </Row>

            {taxCase.documents && taxCase.documents.length > 0 ? (
              <List
                dataSource={taxCase.documents}
                renderItem={(doc, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveDocument(index)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          Tài liệu {index + 1}
                        </a>
                      }
                      description={doc}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">
                Chưa có tài liệu nào được thêm vào hồ sơ này.
              </Text>
            )}

            {taxCase.notes && (
              <>
                <Divider />
                <Title level={5}>Ghi chú</Title>
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {taxCase.notes}
                </Paragraph>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {taxCase.client && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={5}>Thông tin khách hàng</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={taxCase.client.avatar}
                  style={{ marginRight: 16 }}
                >
                  {taxCase.client.username ? taxCase.client.username.charAt(0).toUpperCase() : 'C'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{taxCase.client.username}</Text>
                  <div>
                    <Text type="secondary">Khách hàng</Text>
                  </div>
                </div>
              </div>

              {taxCase.client.email && (
                <div style={{ marginBottom: 8 }}>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{taxCase.client.email}</Text>
                </div>
              )}

              {taxCase.client.phone && (
                <div>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{taxCase.client.phone}</Text>
                </div>
              )}
            </Card>
          )}

          {taxCase.taxProfessional && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={5}>Thông tin chuyên viên thuế</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={taxCase.taxProfessional.avatar}
                  style={{ marginRight: 16 }}
                >
                  {taxCase.taxProfessional.username ? taxCase.taxProfessional.username.charAt(0).toUpperCase() : 'TP'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{taxCase.taxProfessional.username}</Text>
                  <div>
                    <Text type="secondary">{taxCase.taxProfessional.role || 'Chuyên viên thuế'}</Text>
                  </div>
                </div>
              </div>

              {taxCase.taxProfessional.email && (
                <div style={{ marginBottom: 8 }}>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{taxCase.taxProfessional.email}</Text>
                </div>
              )}

              {taxCase.taxProfessional.phone && (
                <div>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{taxCase.taxProfessional.phone}</Text>
                </div>
              )}
            </Card>
          )}

          <Card>
            <Title level={5}>Dòng thời gian</Title>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <FileTextOutlined style={{ fontSize: 16, color: '#1890ff', marginTop: 4, marginRight: 8 }} />
                <div>
                  <Text strong>Tạo hồ sơ</Text>
                  <div>
                    <Text type="secondary">{formatDate(taxCase.created_at)}</Text>
                  </div>
                </div>
              </div>
              
              {taxCase.updated_at !== taxCase.created_at && (
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <FileTextOutlined style={{ fontSize: 16, color: '#1890ff', marginTop: 4, marginRight: 8 }} />
                  <div>
                    <Text strong>Cập nhật gần nhất</Text>
                    <div>
                      <Text type="secondary">{formatDate(taxCase.updated_at)}</Text>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Thêm tài liệu Modal */}
      <Modal
        title="Thêm tài liệu"
        visible={documentDialogOpen}
        onCancel={() => setDocumentDialogOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setDocumentDialogOpen(false)}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleAddDocument}
            loading={submitting}
            disabled={!newDocument}
          >
            Thêm
          </Button>
        ]}
      >
        <Input
          placeholder="Nhập URL tài liệu"
          value={newDocument}
          onChange={(e) => setNewDocument(e.target.value)}
          prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary">
          Nhập URL của tài liệu bạn muốn thêm vào hồ sơ thuế này.
        </Text>
      </Modal>

      {/* Thay đổi trạng thái Modal */}
      <Modal
        title="Thay đổi trạng thái hồ sơ thuế"
        visible={statusDialogOpen}
        onCancel={() => setStatusDialogOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setStatusDialogOpen(false)}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleStatusChange}
            loading={submitting}
            disabled={!newStatus}
          >
            Cập nhật
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item
            label="Trạng thái"
            required
          >
            <Select
              value={newStatus}
              onChange={(value) => setNewStatus(value)}
            >
              <Option value="PENDING">Chờ xử lý</Option>
              <Option value="IN_PROGRESS">Đang xử lý</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Ghi chú (Tùy chọn)"
          >
            <TextArea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Thêm ghi chú về sự thay đổi trạng thái này..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default TaxCaseDetails;