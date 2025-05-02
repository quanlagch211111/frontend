import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  TimePicker,
  Spin,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Alert,
  Breadcrumb,
  Tooltip,
  Modal
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  
  // For service selection
  const [serviceType, setServiceType] = useState('');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // For staff selection
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch appointment details in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchAppointmentDetails();
    }
  }, [id]);

  // Reset form when appointment data is loaded
  useEffect(() => {
    if (appointment) {
      form.setFieldsValue({
        title: appointment.title,
        description: appointment.description,
        date: moment(appointment.startTime),
        timeRange: [
          moment(appointment.startTime),
          moment(appointment.endTime)
        ],
        serviceType: appointment.serviceType,
        serviceId: appointment.serviceId,
        staff: appointment.staff._id,
        location: appointment.location,
        status: appointment.status
      });
      setServiceType(appointment.serviceType);
    }
  }, [appointment, form]);

  // Fetch services when service type changes
  useEffect(() => {
    if (serviceType) {
      fetchServicesByType(serviceType);
    }
  }, [serviceType]);

  // Fetch staff members for assignment
  useEffect(() => {
    fetchStaffMembers();
  }, []);

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

  const fetchServicesByType = async (type) => {
    try {
      setLoadingServices(true);
      let endpoint = '';
      
      switch (type) {
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
          setServices([]);
          setLoadingServices(false);
          return;
      }
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        // Map the response data according to service type
        let mappedServices = [];
        
        switch (type) {
          case 'REAL_ESTATE':
            mappedServices = response.data.properties.map(p => ({
              id: p._id,
              name: p.title,
              description: p.location?.address
            }));
            break;
          case 'INSURANCE':
            mappedServices = response.data.policies.map(p => ({
              id: p._id,
              name: p.provider,
              description: p.type
            }));
            break;
          case 'VISA':
            mappedServices = response.data.visaApplications.map(v => ({
              id: v._id,
              name: v.destination,
              description: v.type
            }));
            break;
          case 'TAX':
            mappedServices = response.data.taxCases.map(t => ({
              id: t._id,
              name: `Hồ sơ thuế ${t.fiscalYear}`,
              description: t.type
            }));
            break;
        }
        
        setServices(mappedServices);
      }
    } catch (err) {
      console.error(`Error fetching ${type} services:`, err);
      toast.error(`Không thể tải danh sách dịch vụ ${type}`);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      
      // In a real application, you would have an endpoint to fetch staff members
      // Here we'll simulate with a fixed list or fetch from users with certain roles
      const response = await axios.get('/api/users?role=AGENT,SUPPORT,ADMIN');
      
      if (response.data.success) {
        setStaffMembers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Extract date and time values
      const date = values.date.format('YYYY-MM-DD');
      const startTime = values.timeRange[0].format('HH:mm:ss');
      const endTime = values.timeRange[1].format('HH:mm:ss');
      
      // Combine date and time
      const startDateTime = `${date}T${startTime}`;
      const endDateTime = `${date}T${endTime}`;
      
      const appointmentData = {
        title: values.title,
        description: values.description,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
        serviceType: values.serviceType,
        serviceId: values.serviceId,
        location: values.location,
        ...(isEditMode && { status: values.status }), // Only include status in edit mode
        ...(currentUser?.role === 'ADMIN' && { staff: values.staff }) // Admin can assign staff
      };
      
      let response;
      
      if (isEditMode) {
        // Update existing appointment
        response = await axios.put(`/api/appointments/${id}`, appointmentData);
        toast.success('Cập nhật cuộc hẹn thành công');
      } else {
        // Create new appointment
        response = await axios.post('/api/appointments', appointmentData);
        toast.success('Đặt lịch hẹn thành công');
      }
      
      if (response.data.success) {
        navigate('/dashboard/appointments');
      }
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError(err.response?.data?.message || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} cuộc hẹn. Vui lòng thử lại sau.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    confirm({
      title: 'Xác nhận hủy',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn hủy? Tất cả thay đổi sẽ không được lưu.',
      okText: 'Có',
      okType: 'danger',
      cancelText: 'Không',
      onOk() {
        navigate('/dashboard/appointments');
      }
    });
  };

  const validateTimeRange = (_, value) => {
    if (!value || value.length !== 2) {
      return Promise.reject(new Error('Vui lòng chọn khoảng thời gian'));
    }
    
    const startTime = value[0];
    const endTime = value[1];
    
    if (!startTime || !endTime) {
      return Promise.reject(new Error('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc'));
    }
    
    if (endTime.isSameOrBefore(startTime)) {
      return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu'));
    }
    
    return Promise.resolve();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/dashboard/appointments')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách cuộc hẹn
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {isEditMode ? 'Chỉnh sửa cuộc hẹn' : 'Đặt lịch hẹn mới'}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Title level={4}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          {isEditMode ? 'Chỉnh sửa thông tin cuộc hẹn' : 'Đặt lịch hẹn mới'}
        </Title>

        {error && (
          <Alert 
            message="Lỗi" 
            description={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: moment(),
            timeRange: [
              moment().hour(9).minute(0).second(0),
              moment().hour(10).minute(0).second(0)
            ],
            serviceType: 'OTHER'
          }}
        >
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="title"
                label="Tiêu đề cuộc hẹn"
                rules={[
                  { required: true, message: 'Vui lòng nhập tiêu đề cuộc hẹn' }
                ]}
              >
                <Input placeholder="Nhập tiêu đề cuộc hẹn" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label="Ngày hẹn"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày hẹn' },
                  {
                    validator: (_, value) => {
                      if (value && value.isBefore(moment().startOf('day'))) {
                        return Promise.reject(new Error('Không thể chọn ngày trong quá khứ'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="timeRange"
                label="Khoảng thời gian"
                rules={[
                  { required: true, message: 'Vui lòng chọn khoảng thời gian' },
                  { validator: validateTimeRange }
                ]}
              >
                <TimePicker.RangePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  minuteStep={15}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="serviceType"
                label="Loại dịch vụ"
                rules={[
                  { required: true, message: 'Vui lòng chọn loại dịch vụ' }
                ]}
              >
                <Select 
                  placeholder="Chọn loại dịch vụ" 
                  onChange={(value) => setServiceType(value)}
                >
                  <Option value="REAL_ESTATE">Bất động sản</Option>
                  <Option value="INSURANCE">Bảo hiểm</Option>
                  <Option value="VISA">Visa</Option>
                  <Option value="TAX">Thuế</Option>
                  <Option value="OTHER">Khác</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="serviceId"
                label="Dịch vụ cụ thể"
                rules={[
                  {
                    required: serviceType !== 'OTHER',
                    message: 'Vui lòng chọn dịch vụ cụ thể'
                  }
                ]}
              >
                <Select
                  placeholder="Chọn dịch vụ"
                  loading={loadingServices}
                  disabled={!serviceType || serviceType === 'OTHER'}
                  notFoundContent={services.length === 0 ? "Không có dịch vụ nào" : null}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {services.map(service => (
                    <Option key={service.id} value={service.id}>
                      {service.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {(currentUser?.role === 'ADMIN' || isEditMode) && (
              <Col xs={24}>
                <Divider>Thông tin phân công</Divider>
              </Col>
            )}

            {currentUser?.role === 'ADMIN' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="staff"
                  label="Nhân viên phụ trách"
                  rules={[
                    { required: true, message: 'Vui lòng chọn nhân viên phụ trách' }
                  ]}
                >
                  <Select
                    placeholder="Chọn nhân viên"
                    loading={loadingStaff}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {staffMembers.map(staff => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.username} - {staff.role}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}

            {isEditMode && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[
                    { required: true, message: 'Vui lòng chọn trạng thái' }
                  ]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="SCHEDULED">Đã lên lịch</Option>
                    <Option value="COMPLETED">Đã hoàn thành</Option>
                    <Option value="CANCELLED">Đã hủy</Option>
                    <Option value="RESCHEDULED">Đã đổi lịch</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col xs={24}>
              <Divider>Thông tin bổ sung</Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="location"
                label="Địa điểm"
              >
                <Input 
                  placeholder="Nhập địa điểm cuộc hẹn" 
                  prefix={<EnvironmentOutlined />} 
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="description"
                label="Mô tả"
              >
                <TextArea
                  rows={4}
                  placeholder="Mô tả chi tiết về cuộc hẹn..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                icon={<CalendarOutlined />}
              >
                {isEditMode ? 'Cập nhật cuộc hẹn' : 'Đặt lịch hẹn'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};

export default AppointmentForm;