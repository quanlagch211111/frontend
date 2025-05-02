import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Card,
  Typography,
  Descriptions,
  Spin,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Alert,
  Timeline,
  Avatar,
  Modal,
  Input,
  Breadcrumb,
  Tooltip,
  Statistic
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);
  
  // Status change modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  
  // Cancellation modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Check permissions
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = ['ADMIN', 'AGENT', 'SUPPORT'].includes(currentUser?.role);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/appointments/${id}`);
      
      if (response.data.success) {
        setAppointment(response.data.appointment);
      } else {
        setError('Không thể tải thông tin cuộc hẹn');
      }
    } catch (err) {
      console.error('Error loading appointment details:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin cuộc hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/appointments/edit/${id}`);
  };

  const handleCancel = () => {
    setCancelModalVisible(true);
  };

  const submitCancellation = async () => {
    try {
      setCancelling(true);
      
      const response = await axios.post(`/api/appointments/${id}/cancel`, {
        reason: cancellationReason
      });
      
      if (response.data.success) {
        setCancelModalVisible(false);
        toast.success('Cuộc hẹn đã được hủy thành công');
        setAppointment(response.data.appointment);
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error(err.response?.data?.message || 'Không thể hủy cuộc hẹn. Vui lòng thử lại sau.');
    } finally {
      setCancelling(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setChangingStatus(true);
      
      const response = await axios.put(`/api/appointments/${id}/status`, {
        status: newStatus,
        notes: statusNote
      });
      
      if (response.data.success) {
        setStatusModalVisible(false);
        toast.success('Đã cập nhật trạng thái cuộc hẹn');
        setAppointment(response.data.appointment);
      }
    } catch (err) {
      console.error('Error changing appointment status:', err);
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại sau.');
    } finally {
      setChangingStatus(false);
    }
  };

  // Function to get status color for tags
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'RESCHEDULED': return 'warning';
      default: return 'default';
    }
  };

  // Function to get status text in Vietnamese
  const getStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'RESCHEDULED': return 'Đã đổi lịch';
      default: return status;
    }
  };

  // Function to get service type text
  const getServiceTypeText = (type) => {
    switch (type) {
      case 'REAL_ESTATE': return 'Bất động sản';
      case 'INSURANCE': return 'Bảo hiểm';
      case 'VISA': return 'Visa';
      case 'TAX': return 'Thuế';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  };

  // Function to check if user can edit the appointment
  const canEdit = () => {
    if (!appointment) return false;
    
    // Admin can always edit
    if (isAdmin) return true;
    
    // Staff assigned to this appointment can edit
    if (isStaff && appointment.staff._id === currentUser.id) return true;
    
    return false;
  };

  // Function to check if user can cancel the appointment
  const canCancel = () => {
    if (!appointment) return false;
    
    // Cannot cancel if already cancelled or completed
    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) return false;
    
    // Admin can always cancel
    if (isAdmin) return true;
    
    // Staff assigned to this appointment can cancel
    if (isStaff && appointment.staff._id === currentUser.id) return true;
    
    // Client can cancel their own appointment
    if (appointment.client._id === currentUser.id) return true;
    
    return false;
  };

  // Function to check if user can change status
  const canChangeStatus = () => {
    if (!appointment) return false;
    
    // Cannot change status if cancelled
    if (appointment.status === 'CANCELLED') return false;
    
    // Admin can always change status
    if (isAdmin) return true;
    
    // Staff assigned to this appointment can change status
    if (isStaff && appointment.staff._id === currentUser.id) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        message="Lỗi" 
        description={error} 
        type="error" 
        showIcon 
      />
    );
  }

  if (!appointment) {
    return (
      <Alert 
        message="Không tìm thấy" 
        description="Không tìm thấy thông tin cuộc hẹn" 
        type="warning" 
        showIcon 
      />
    );
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/appointments')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Danh sách cuộc hẹn
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết cuộc hẹn</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          
          <Col>
            <Space>
              {canChangeStatus() && (
                <Button 
                  type="primary"
                  onClick={() => {
                    setNewStatus(appointment.status);
                    setStatusModalVisible(true);
                  }}
                >
                  Thay đổi trạng thái
                </Button>
              )}
              
              {canEdit() && (
                <Button 
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </Button>
              )}
              
              {canCancel() && (
                <Button 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleCancel}
                >
                  Hủy cuộc hẹn
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 24 }}>
            <Row align="middle" style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Title level={4}>{appointment.title}</Title>
              </Col>
              <Col>
                <Tag color={getStatusColor(appointment.status)}>
                  {getStatusText(appointment.status)}
                </Tag>
              </Col>
            </Row>

            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Loại dịch vụ" span={1}>
                {getServiceTypeText(appointment.serviceType)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngày hẹn" span={1}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {moment(appointment.startTime).format('DD/MM/YYYY')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Thời gian" span={1}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                {moment(appointment.startTime).format('HH:mm')} - {moment(appointment.endTime).format('HH:mm')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Địa điểm" span={1}>
                {appointment.location ? (
                  <>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    {appointment.location}
                  </>
                ) : (
                  <Text type="secondary">Chưa có thông tin</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {appointment.description && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Mô tả</Title>
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {appointment.description}
                </Paragraph>
              </div>
            )}
          </Card>

          <Card>
            <Title level={5}>Dòng thời gian</Title>
            <Timeline>
              <Timeline.Item color="green">
                <p><Text strong>Tạo cuộc hẹn</Text></p>
                <p><Text type="secondary">{moment(appointment.created_at).format('DD/MM/YYYY HH:mm')}</Text></p>
              </Timeline.Item>
              
              {appointment.updated_at !== appointment.created_at && (
                <Timeline.Item color="blue">
                  <p><Text strong>Cập nhật gần nhất</Text></p>
                  <p><Text type="secondary">{moment(appointment.updated_at).format('DD/MM/YYYY HH:mm')}</Text></p>
                </Timeline.Item>
              )}
              
              {appointment.status === 'COMPLETED' && (
                <Timeline.Item color="green">
                  <p><Text strong>Hoàn thành cuộc hẹn</Text></p>
                  <p><Text type="secondary">{moment(appointment.updated_at).format('DD/MM/YYYY HH:mm')}</Text></p>
                </Timeline.Item>
              )}
              
              {appointment.status === 'CANCELLED' && (
                <Timeline.Item color="red">
                  <p><Text strong>Hủy cuộc hẹn</Text></p>
                  <p><Text type="secondary">{moment(appointment.updated_at).format('DD/MM/YYYY HH:mm')}</Text></p>
                </Timeline.Item>
              )}
              
              {appointment.status === 'RESCHEDULED' && (
                <Timeline.Item color="orange">
                  <p><Text strong>Đổi lịch hẹn</Text></p>
                  <p><Text type="secondary">{moment(appointment.updated_at).format('DD/MM/YYYY HH:mm')}</Text></p>
                </Timeline.Item>
              )}
              
              {appointment.status === 'SCHEDULED' && moment(appointment.startTime).isAfter(moment()) && (
                <Timeline.Item color="blue">
                  <p><Text strong>Cuộc hẹn sắp tới</Text></p>
                  <p><Text type="secondary">{moment(appointment.startTime).format('DD/MM/YYYY HH:mm')}</Text></p>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 24 }}>
            <Statistic
              title="Thời gian đến cuộc hẹn"
              value={appointment.status === 'SCHEDULED' ? moment(appointment.startTime).fromNow() : 'N/A'}
              valueStyle={{ 
                color: appointment.status === 'SCHEDULED' ? '#1890ff' : 'rgba(0, 0, 0, 0.45)' 
              }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Thông tin khách hàng</Title>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar 
                size={64} 
                icon={<UserOutlined />}
                src={appointment.client.avatar}
                style={{ marginRight: 16 }}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>{appointment.client.username}</Text>
                <div>
                  <Text type="secondary">Khách hàng</Text>
                </div>
              </div>
            </div>

            {appointment.client.email && (
              <div style={{ marginBottom: 8 }}>
                <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{appointment.client.email}</Text>
              </div>
            )}

            {appointment.client.phone && (
              <div>
                <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{appointment.client.phone}</Text>
              </div>
            )}
          </Card>

          <Card>
            <Title level={5}>Thông tin nhân viên phụ trách</Title>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar 
                size={64} 
                icon={<UserOutlined />}
                src={appointment.staff.avatar}
                style={{ marginRight: 16 }}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>{appointment.staff.username}</Text>
                <div>
                  <Text type="secondary">{appointment.staff.role || 'Nhân viên'}</Text>
                </div>
              </div>
            </div>

            {appointment.staff.email && (
              <div style={{ marginBottom: 8 }}>
                <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{appointment.staff.email}</Text>
              </div>
            )}

            {appointment.staff.phone && (
              <div>
                <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Text>{appointment.staff.phone}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Status Change Modal */}
      <Modal
        title="Thay đổi trạng thái cuộc hẹn"
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setStatusModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={changingStatus}
            onClick={handleStatusChange}
          >
            Cập nhật
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Chọn trạng thái mới:</Text>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button
                type={newStatus === 'SCHEDULED' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => setNewStatus('SCHEDULED')}
              >
                Đã lên lịch
              </Button>
              <Button
                type={newStatus === 'COMPLETED' ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => setNewStatus('COMPLETED')}
                style={{ backgroundColor: newStatus === 'COMPLETED' ? '#52c41a' : undefined, borderColor: newStatus === 'COMPLETED' ? '#52c41a' : undefined }}
              >
                Đã hoàn thành
              </Button>
              <Button
                type={newStatus === 'RESCHEDULED' ? 'primary' : 'default'}
                icon={<SyncOutlined />}
                onClick={() => setNewStatus('RESCHEDULED')}
                style={{ backgroundColor: newStatus === 'RESCHEDULED' ? '#faad14' : undefined, borderColor: newStatus === 'RESCHEDULED' ? '#faad14' : undefined }}
              >
                Đã đổi lịch
              </Button>
            </Space>
          </div>
        </div>
        
        <div>
          <Text>Ghi chú (không bắt buộc):</Text>
          <TextArea
            rows={4}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Nhập ghi chú về thay đổi trạng thái này..."
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal
        title="Hủy cuộc hẹn"
        visible={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalVisible(false)}>
            Quay lại
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={cancelling}
            onClick={submitCancellation}
          >
            Xác nhận hủy
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Cảnh báo"
            description="Việc hủy cuộc hẹn không thể hoàn tác. Cuộc hẹn sẽ bị đánh dấu là đã hủy và thông báo sẽ được gửi cho tất cả các bên liên quan."
            type="warning"
            showIcon
          />
        </div>
        
        <div>
          <Text>Lý do hủy (không bắt buộc):</Text>
          <TextArea
            rows={4}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Nhập lý do hủy cuộc hẹn..."
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default AppointmentDetails;