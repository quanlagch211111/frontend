import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Typography,
  Card,
  Button,
  Descriptions,
  Space,
  Divider,
  Spin,
  Alert,
  Tag,
  Modal,
  Avatar,
  Breadcrumb,
  Input,
  List,
  Row,
  Col,
  Timeline
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  GlobalOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { confirm } = Modal;

const VisaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [visa, setVisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const fetchVisa = async () => {
    try {
      const response = await axios.get(`/api/visa/${id}`);
      if (response.data.success) {
        setVisa(response.data.visaApplication);
      } else {
        setError('Không thể tải hồ sơ visa');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết visa:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải hồ sơ visa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisa();
  }, [id]);

  const canEditVisa = () => {
    if (!visa || !currentUser) return false;
    
    const isOwner = visa.applicant._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    const isAgent = visa.agent && visa.agent._id === currentUser.id;
    
    // Cho phép chỉnh sửa nếu bạn là người nộp đơn và trạng thái là ĐÃ NỘP hoặc YÊU CẦU BỔ SUNG
    if (isOwner && ['SUBMITTED', 'ADDITIONAL_INFO_REQUIRED'].includes(visa.status)) {
      return true;
    }
    
    // Quản trị viên và đại lý được chỉ định luôn có thể chỉnh sửa
    return isAdmin || isAgent;
  };

  const canDeleteVisa = () => {
    if (!visa || !currentUser) return false;
    
    const isOwner = visa.applicant._id === currentUser.id;
    const isAdmin = currentUser.isAdmin || currentUser.role === 'ADMIN';
    
    // Chỉ cho phép xóa nếu trạng thái là ĐÃ NỘP hoặc bạn là quản trị viên
    if (isOwner && visa.status === 'SUBMITTED') {
      return true;
    }
    
    return isAdmin;
  };

  const handleEditClick = () => {
    navigate(`/dashboard/visa/edit/${id}`);
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Xác nhận xóa hồ sơ visa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa hồ sơ visa này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: handleConfirmDelete,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/visa/${id}`);
      if (response.data.success) {
        toast.success('Hồ sơ visa đã được xóa thành công');
        navigate('/dashboard/visa');
      } else {
        toast.error('Không thể xóa hồ sơ visa');
      }
    } catch (err) {
      console.error('Lỗi khi xóa hồ sơ visa:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa hồ sơ visa');
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument) return;
    
    try {
      // Kiểm tra URL cơ bản
      new URL(newDocument);
      
      setSubmittingDoc(true);
      const response = await axios.post(`/api/visa/${id}/documents`, {
        documentUrl: newDocument
      });
      
      if (response.data.success) {
        toast.success('Tài liệu đã được thêm thành công');
        setVisa(response.data.visaApplication);
        setNewDocument('');
        setDocumentDialogOpen(false);
      } else {
        toast.error('Không thể thêm tài liệu');
      }
    } catch (err) {
      console.error('Lỗi khi thêm tài liệu:', err);
      toast.error(err.response?.data?.message || 'Vui lòng nhập URL hợp lệ');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleRemoveDocument = async (index) => {
    try {
      const response = await axios.delete(`/api/visa/${id}/documents/${index}`);
      if (response.data.success) {
        toast.success('Tài liệu đã được xóa thành công');
        setVisa(response.data.visaApplication);
      } else {
        toast.error('Không thể xóa tài liệu');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PROCESSING': return 'processing';
      case 'ADDITIONAL_INFO_REQUIRED': return 'warning';
      case 'SUBMITTED': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'PROCESSING': return 'Đang xử lý';
      case 'ADDITIONAL_INFO_REQUIRED': return 'Yêu cầu bổ sung';
      case 'SUBMITTED': return 'Đã nộp';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircleOutlined />;
      case 'REJECTED': return <CloseCircleOutlined />;
      case 'PROCESSING': return <SyncOutlined spin />;
      case 'ADDITIONAL_INFO_REQUIRED': return <WarningOutlined />;
      case 'SUBMITTED': return <FileOutlined />;
      default: return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'TOURIST': return 'Du lịch';
      case 'BUSINESS': return 'Công tác';
      case 'STUDENT': return 'Du học';
      case 'WORK': return 'Làm việc';
      case 'PERMANENT': return 'Định cư';
      case 'TRANSIT': return 'Quá cảnh';
      case 'GUARANTOR': return 'Bảo lãnh';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'TOURIST': return 'blue';
      case 'BUSINESS': return 'purple';
      case 'STUDENT': return 'cyan';
      case 'WORK': return 'orange';
      case 'PERMANENT': return 'green';
      case 'TRANSIT': return 'lime';
      case 'GUARANTOR': return 'gold';
      default: return 'default';
    }
  };

  const getEntryTypeText = (entryType) => {
    switch (entryType) {
      case 'SINGLE': return 'Một lần';
      case 'MULTIPLE': return 'Nhiều lần';
      case 'TRANSIT': return 'Quá cảnh';
      default: return entryType;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD/MM/YYYY');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin hồ sơ visa...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message="Lỗi" description={error} type="error" showIcon />;
  }

  if (!visa) {
    return <Alert message="Không tìm thấy" description="Không tìm thấy hồ sơ visa này" type="warning" showIcon />;
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/visa')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Quay lại danh sách hồ sơ visa
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết hồ sơ visa</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          <Col>
            <Space>
              {canEditVisa() && (
                <Button 
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEditClick}
                >
                  Chỉnh sửa
                </Button>
              )}
              
              {canDeleteVisa() && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={showDeleteConfirm}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Tag color={getTypeColor(visa.type)}>{getTypeLabel(visa.type)}</Tag>
                  <Tag color={getStatusColor(visa.status)} icon={getStatusIcon(visa.status)}>
                    {getStatusText(visa.status)}
                  </Tag>
                </Space>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <Title level={4}>{visa.destination}</Title>
                </div>
              </div>
              <div>
                <Text type="secondary">Ngày nộp đơn</Text>
                <div>
                  <Text>{formatDate(visa.applicationDetails.appliedDate)}</Text>
                </div>
              </div>
            </div>

            <Divider />

            <Title level={5}>Mục đích chuyến đi</Title>
            <Paragraph style={{ whiteSpace: 'pre-line' }}>
              {visa.purpose}
            </Paragraph>

            <Divider />

            <Title level={5}>Thông tin hộ chiếu</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                  <Text type="secondary">Số hộ chiếu</Text>
                  <div>
                    <Text strong>{visa.applicationDetails.passportNumber}</Text>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                  <Text type="secondary">Loại nhập cảnh</Text>
                  <div>
                    <Text strong>{getEntryTypeText(visa.applicationDetails.entryType || 'SINGLE')}</Text>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                  <Text type="secondary">Ngày cấp</Text>
                  <div>
                    <Text strong>{formatDate(visa.applicationDetails.issueDate)}</Text>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                  <Text type="secondary">Ngày hết hạn</Text>
                  <div>
                    <Text strong>{formatDate(visa.applicationDetails.expiryDate)}</Text>
                  </div>
                </Card>
              </Col>
              
              {visa.applicationDetails.durationOfStay && (
                <Col xs={24} sm={12}>
                  <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                    <Text type="secondary">Thời gian lưu trú</Text>
                    <div>
                      <Text strong>{visa.applicationDetails.durationOfStay} ngày</Text>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Tài liệu hỗ trợ</Title>
              {canEditVisa() && (
                <Button
                  type="primary"
                  ghost
                  icon={<PlusOutlined />}
                  onClick={() => setDocumentDialogOpen(true)}
                >
                  Thêm tài liệu
                </Button>
              )}
            </div>

            {visa.documents && visa.documents.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={visa.documents}
                renderItem={(doc, index) => (
                  <List.Item
                    actions={canEditVisa() ? [
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveDocument(index)}
                      />
                    ] : []}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                      title={`Tài liệu ${index + 1}`}
                      description={
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          {doc}
                        </a>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">
                Chưa có tài liệu nào được tải lên.
              </Text>
            )}

            {visa.notes && (
              <>
                <Divider />
                <Title level={5}>Ghi chú</Title>
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {visa.notes}
                </Paragraph>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Thông tin người nộp đơn</Title>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar 
                size={64} 
                src={visa.applicant.avatar}
                style={{ marginRight: 16 }}
              >
                {visa.applicant.username ? visa.applicant.username.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: 16 }}>{visa.applicant.username}</Text>
                <div>
                  <Text type="secondary">Người nộp đơn</Text>
                </div>
              </div>
            </div>

            {visa.applicant.email && (
              <div style={{ marginBottom: 8 }}>
                <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{visa.applicant.email}</Text>
              </div>
            )}

            {visa.applicant.phone && (
              <div>
                <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{visa.applicant.phone}</Text>
              </div>
            )}
          </Card>

          {visa.agent && (
            <Card style={{ marginBottom: 24 }}>
              <Title level={5}>Đại lý được chỉ định</Title>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={64} 
                  src={visa.agent.avatar}
                  style={{ marginRight: 16, backgroundColor: '#722ed1' }}
                >
                  {visa.agent.username ? visa.agent.username.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{visa.agent.username}</Text>
                  <div>
                    <Text type="secondary">{visa.agent.role || 'Đại lý'}</Text>
                  </div>
                </div>
              </div>

              {visa.agent.email && (
                <div style={{ marginBottom: 8 }}>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{visa.agent.email}</Text>
                </div>
              )}

              {visa.agent.phone && (
                <div>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text>{visa.agent.phone}</Text>
                </div>
              )}
            </Card>
          )}

          <Card>
            <Title level={5}>Lịch sử hồ sơ</Title>
            <Timeline>
              <Timeline.Item color="blue">
                <p><Text strong>Đã nộp đơn</Text></p>
                <p><Text type="secondary">{formatDate(visa.created_at)}</Text></p>
              </Timeline.Item>
              
              {visa.updated_at !== visa.created_at && (
                <Timeline.Item color="green">
                  <p><Text strong>Cập nhật gần nhất</Text></p>
                  <p><Text type="secondary">{formatDate(visa.updated_at)}</Text></p>
                </Timeline.Item>
              )}
              
              {visa.status === 'PROCESSING' && (
                <Timeline.Item color="blue">
                  <p><Text strong>Đang xử lý</Text></p>
                </Timeline.Item>
              )}
              
              {visa.status === 'ADDITIONAL_INFO_REQUIRED' && (
                <Timeline.Item color="orange">
                  <p><Text strong>Yêu cầu thông tin bổ sung</Text></p>
                </Timeline.Item>
              )}
              
              {visa.status === 'APPROVED' && (
                <Timeline.Item color="green">
                  <p><Text strong>Đã duyệt</Text></p>
                </Timeline.Item>
              )}
              
              {visa.status === 'REJECTED' && (
                <Timeline.Item color="red">
                  <p><Text strong>Từ chối</Text></p>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Add Document Modal */}
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
            loading={submittingDoc}
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
          Nhập URL của tài liệu bạn muốn thêm vào hồ sơ visa này.
        </Text>
      </Modal>
    </Layout>
  );
};

export default VisaDetails;