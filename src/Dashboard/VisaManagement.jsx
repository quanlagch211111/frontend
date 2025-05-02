import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthProvider';
import {
  Layout,
  Typography,
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Spin,
  Alert,
  Row,
  Col,
  DatePicker,
  Breadcrumb,
  Divider,
  Avatar,
  Badge,
  Image,
InputNumber
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  GlobalOutlined,
  UserOutlined,
  FileOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/es/date-picker/locale/vi_VN';

moment.locale('vi');

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;
const { TextArea } = Input;

const VisaManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [visaApplications, setVisaApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visaCount, setVisaCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create visa application modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit visa application modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVisa, setEditingVisa] = useState(null);
  const [editForm] = Form.useForm();
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý hồ sơ visa');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchVisaApplications = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      
      if (search) {
        params.append('search', search);
      }
      
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (destinationFilter) {
        params.append('destination', destinationFilter);
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/visa/admin/all-applications?${params.toString()}`);
      
      if (response.data.success) {
        setVisaApplications(response.data.visaApplications);
        setVisaCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch visa applications');
      }
    } catch (err) {
      console.error('Error fetching visa applications:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching visa applications');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVisaApplications();
  }, [page, pageSize, typeFilter, statusFilter, destinationFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchVisaApplications();
  };
  
  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setDestinationFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchVisaApplications();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create visa application functions
  const showCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: 'SUBMITTED',
      type: 'TOURIST',
      'applicationDetails.appliedDate': moment()
    });
    setCreateModalVisible(true);
  };
  
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };
  
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const visaData = {
        type: values.type,
        destination: values.destination,
        purpose: values.purpose,
        status: values.status,
        notes: values.notes,
        applicant: values.applicant, // ID of applicant
        applicationDetails: {
          passportNumber: values['applicationDetails.passportNumber'],
          issueDate: values['applicationDetails.issueDate']?.toISOString(),
          expiryDate: values['applicationDetails.expiryDate']?.toISOString(),
          nationality: values['applicationDetails.nationality'],
          entryType: values['applicationDetails.entryType'],
          stayDuration: Number(values['applicationDetails.stayDuration']),
          appliedDate: values['applicationDetails.appliedDate']?.toISOString()
        }
      };
      
      const response = await axios.post('/api/visa', visaData);
      
      if (response.data.success) {
        toast.success('Tạo hồ sơ visa mới thành công');
        setCreateModalVisible(false);
        fetchVisaApplications();
      } else {
        toast.error(response.data.message || 'Tạo hồ sơ visa thất bại');
      }
    } catch (err) {
      console.error('Create visa application error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo hồ sơ visa');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit visa application functions
  const showEditModal = (visa) => {
    setEditingVisa(visa);
    editForm.setFieldsValue({
      type: visa.type,
      destination: visa.destination,
      purpose: visa.purpose,
      status: visa.status,
      notes: visa.notes,
      applicant: visa.applicant?._id,
      'applicationDetails.passportNumber': visa.applicationDetails?.passportNumber,
      'applicationDetails.issueDate': visa.applicationDetails?.issueDate ? moment(visa.applicationDetails.issueDate) : null,
      'applicationDetails.expiryDate': visa.applicationDetails?.expiryDate ? moment(visa.applicationDetails.expiryDate) : null,
      'applicationDetails.nationality': visa.applicationDetails?.nationality,
      'applicationDetails.entryType': visa.applicationDetails?.entryType,
      'applicationDetails.stayDuration': visa.applicationDetails?.stayDuration,
      'applicationDetails.appliedDate': visa.applicationDetails?.appliedDate ? moment(visa.applicationDetails.appliedDate) : null
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingVisa(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const visaData = {
        type: values.type,
        destination: values.destination,
        purpose: values.purpose,
        status: values.status,
        notes: values.notes,
        applicant: values.applicant,
        applicationDetails: {
          passportNumber: values['applicationDetails.passportNumber'],
          issueDate: values['applicationDetails.issueDate']?.toISOString(),
          expiryDate: values['applicationDetails.expiryDate']?.toISOString(),
          nationality: values['applicationDetails.nationality'],
          entryType: values['applicationDetails.entryType'],
          stayDuration: Number(values['applicationDetails.stayDuration']),
          appliedDate: values['applicationDetails.appliedDate']?.toISOString()
        }
      };
      
      const response = await axios.put(`/api/visa/${editingVisa._id}`, visaData);
      
      if (response.data.success) {
        toast.success('Cập nhật hồ sơ visa thành công');
        setEditModalVisible(false);
        fetchVisaApplications();
      } else {
        toast.error(response.data.message || 'Cập nhật hồ sơ visa thất bại');
      }
    } catch (err) {
      console.error('Edit visa application error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật hồ sơ visa');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete visa application function
  const showDeleteConfirm = (visa) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa hồ sơ visa này?',
      icon: <ExclamationCircleOutlined />,
      content: `Hồ sơ visa cho: ${visa.destination}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/visa/${visa._id}`);
          
          if (response.data.success) {
            toast.success('Xóa hồ sơ visa thành công');
            fetchVisaApplications();
          } else {
            toast.error(response.data.message || 'Xóa hồ sơ visa thất bại');
          }
        } catch (err) {
          console.error('Delete visa application error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa hồ sơ visa');
        }
      }
    });
  };
  
  // Utilities
  const getTypeLabel = (type) => {
    switch (type) {
      case 'TOURIST': return 'Du lịch';
      case 'BUSINESS': return 'Công tác';
      case 'STUDENT': return 'Du học';
      case 'WORK': return 'Làm việc';
      case 'PERMANENT': return 'Định cư';
      case 'TRANSIT': return 'Quá cảnh';
      default: return type;
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'TOURIST': return 'blue';
      case 'BUSINESS': return 'purple';
      case 'STUDENT': return 'cyan';
      case 'WORK': return 'orange';
      case 'PERMANENT': return 'magenta';
      case 'TRANSIT': return 'geekblue';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'processing';
      case 'PROCESSING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'ADDITIONAL_INFO_REQUIRED': return 'gold';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'Đã nộp';
      case 'PROCESSING': return 'Đang xử lý';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'ADDITIONAL_INFO_REQUIRED': return 'Yêu cầu bổ sung';
      default: return status;
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const getEntryTypeText = (entryType) => {
    switch (entryType) {
      case 'SINGLE': return 'Một lần';
      case 'MULTIPLE': return 'Nhiều lần';
      default: return entryType;
    }
  };
  
  // Get available applicants (users)
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchApplicants = async () => {
    try {
      setLoadingApplicants(true);
      const response = await axios.get('/api/users?role=USER');
      if (response.data.success) {
        setApplicants(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);
  
  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      render: id => <Text code>{id.slice(-6)}</Text>,
      width: 80,
    },
    {
      title: 'Ứng viên',
      dataIndex: 'applicant',
      key: 'applicant',
      render: applicant => (
        <Space>
          <Avatar
            src={applicant?.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{applicant?.username || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Quốc gia',
      dataIndex: 'destination',
      key: 'destination',
      render: destination => (
        <Space>
          <EnvironmentOutlined />
          <Text>{destination}</Text>
        </Space>
      ),
    },
    {
      title: 'Loại visa',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Du lịch', value: 'TOURIST' },
        { text: 'Công tác', value: 'BUSINESS' },
        { text: 'Du học', value: 'STUDENT' },
        { text: 'Làm việc', value: 'WORK' },
        { text: 'Định cư', value: 'PERMANENT' },
        { text: 'Quá cảnh', value: 'TRANSIT' },
      ],
      render: type => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>,
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
      responsive: ['lg'],
      render: purpose => (
        <Text ellipsis={{ tooltip: purpose }}>
          {purpose}
        </Text>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'applicationDetails',
      key: 'appliedDate',
      sorter: true,
      responsive: ['md'],
      render: details => details?.appliedDate ? formatDate(details.appliedDate) : 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Đã nộp', value: 'SUBMITTED' },
        { text: 'Đang xử lý', value: 'PROCESSING' },
        { text: 'Đã duyệt', value: 'APPROVED' },
        { text: 'Từ chối', value: 'REJECTED' },
        { text: 'Yêu cầu bổ sung', value: 'ADDITIONAL_INFO_REQUIRED' },
      ],
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/dashboard/visa/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="default" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => showDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 0, background: 'transparent' }}>
      <Content>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb>
              <Breadcrumb.Item>
                <a onClick={() => navigate('/dashboard/admin')}>
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Quản trị hệ thống
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Quản lý hồ sơ visa</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <GlobalOutlined style={{ marginRight: 8 }} />
                Quản lý hồ sơ visa
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm hồ sơ visa mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input 
                placeholder="Tìm kiếm theo tên, quốc gia..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Lọc theo loại visa"
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={value => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="TOURIST">Du lịch</Option>
                <Option value="BUSINESS">Công tác</Option>
                <Option value="STUDENT">Du học</Option>
                <Option value="WORK">Làm việc</Option>
                <Option value="PERMANENT">Định cư</Option>
                <Option value="TRANSIT">Quá cảnh</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={value => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="SUBMITTED">Đã nộp</Option>
                <Option value="PROCESSING">Đang xử lý</Option>
                <Option value="APPROVED">Đã duyệt</Option>
                <Option value="REJECTED">Từ chối</Option>
                <Option value="ADDITIONAL_INFO_REQUIRED">Yêu cầu bổ sung</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </Space>
            </Col>
          </Row>
          
          {error && (
            <Alert 
              message="Lỗi" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
          )}
          
          <Table
            columns={columns}
            dataSource={visaApplications}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: visaCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} hồ sơ visa`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Visa Application Modal */}
        <Modal
          title="Thêm hồ sơ visa mới"
          visible={createModalVisible}
          onCancel={handleCreateCancel}
          width={800}
          footer={[
            <Button key="back" onClick={handleCreateCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleCreateSubmit}
            >
              Tạo
            </Button>,
          ]}
        >
          <Form
            form={createForm}
            layout="vertical"
            requiredMark={true}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="type"
                  label="Loại visa"
                  rules={[{ required: true, message: 'Vui lòng chọn loại visa' }]}
                >
                  <Select placeholder="Chọn loại visa">
                    <Option value="TOURIST">Du lịch</Option>
                    <Option value="BUSINESS">Công tác</Option>
                    <Option value="STUDENT">Du học</Option>
                    <Option value="WORK">Làm việc</Option>
                    <Option value="PERMANENT">Định cư</Option>
                    <Option value="TRANSIT">Quá cảnh</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="SUBMITTED">Đã nộp</Option>
                    <Option value="PROCESSING">Đang xử lý</Option>
                    <Option value="APPROVED">Đã duyệt</Option>
                    <Option value="REJECTED">Từ chối</Option>
                    <Option value="ADDITIONAL_INFO_REQUIRED">Yêu cầu bổ sung</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="destination"
                  label="Quốc gia đến"
                  rules={[{ required: true, message: 'Vui lòng nhập quốc gia đến' }]}
                >
                  <Input placeholder="Nhập quốc gia đến" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicant"
                  label="Ứng viên"
                  rules={[{ required: true, message: 'Vui lòng chọn ứng viên' }]}
                >
                  <Select
                    placeholder="Chọn ứng viên"
                    showSearch
                    loading={loadingApplicants}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {applicants.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="purpose"
                  label="Mục đích"
                  rules={[{ required: true, message: 'Vui lòng nhập mục đích' }]}
                >
                  <TextArea rows={3} placeholder="Nhập mục đích đi visa" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Divider orientation="left">Chi tiết đơn visa</Divider>
              </Col>
              
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
                  name="applicationDetails.nationality"
                  label="Quốc tịch"
                  rules={[{ required: true, message: 'Vui lòng nhập quốc tịch' }]}
                >
                  <Input placeholder="Nhập quốc tịch" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicationDetails.issueDate"
                  label="Ngày cấp hộ chiếu"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày cấp hộ chiếu' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicationDetails.expiryDate"
                  label="Ngày hết hạn hộ chiếu"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn hộ chiếu' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicationDetails.entryType"
                  label="Loại nhập cảnh"
                  rules={[{ required: true, message: 'Vui lòng chọn loại nhập cảnh' }]}
                >
                  <Select placeholder="Chọn loại nhập cảnh">
                    <Option value="SINGLE">Một lần</Option>
                    <Option value="MULTIPLE">Nhiều lần</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicationDetails.stayDuration"
                  label="Thời gian lưu trú (ngày)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập thời gian lưu trú' },
                    { type: 'number', min: 1, message: 'Thời gian lưu trú phải lớn hơn 0', transform: value => Number(value) }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    placeholder="Nhập số ngày lưu trú"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="applicationDetails.appliedDate"
                  label="Ngày nộp đơn"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày nộp đơn' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="notes"
                  label="Ghi chú"
                >
                  <TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Visa Application Modal */}
        <Modal
          title="Chỉnh sửa hồ sơ visa"
          visible={editModalVisible}
          onCancel={handleEditCancel}
          width={800}
          footer={[
            <Button key="back" onClick={handleEditCancel}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting} 
              onClick={handleEditSubmit}
            >
              Cập nhật
            </Button>,
          ]}
        >
          {editingVisa && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="type"
                    label="Loại visa"
                    rules={[{ required: true, message: 'Vui lòng chọn loại visa' }]}
                  >
                    <Select placeholder="Chọn loại visa">
                      <Option value="TOURIST">Du lịch</Option>
                      <Option value="BUSINESS">Công tác</Option>
                      <Option value="STUDENT">Du học</Option>
                      <Option value="WORK">Làm việc</Option>
                      <Option value="PERMANENT">Định cư</Option>
                      <Option value="TRANSIT">Quá cảnh</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="SUBMITTED">Đã nộp</Option>
                      <Option value="PROCESSING">Đang xử lý</Option>
                      <Option value="APPROVED">Đã duyệt</Option>
                      <Option value="REJECTED">Từ chối</Option>
                      <Option value="ADDITIONAL_INFO_REQUIRED">Yêu cầu bổ sung</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="destination"
                    label="Quốc gia đến"
                    rules={[{ required: true, message: 'Vui lòng nhập quốc gia đến' }]}
                  >
                    <Input placeholder="Nhập quốc gia đến" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicant"
                    label="Ứng viên"
                    rules={[{ required: true, message: 'Vui lòng chọn ứng viên' }]}
                  >
                    <Select
                      placeholder="Chọn ứng viên"
                      showSearch
                      loading={loadingApplicants}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {applicants.map(user => (
                        <Option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="purpose"
                    label="Mục đích"
                    rules={[{ required: true, message: 'Vui lòng nhập mục đích' }]}
                  >
                    <TextArea rows={3} placeholder="Nhập mục đích đi visa" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Divider orientation="left">Chi tiết đơn visa</Divider>
                </Col>
                
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
                    name="applicationDetails.nationality"
                    label="Quốc tịch"
                    rules={[{ required: true, message: 'Vui lòng nhập quốc tịch' }]}
                  >
                    <Input placeholder="Nhập quốc tịch" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicationDetails.issueDate"
                    label="Ngày cấp hộ chiếu"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày cấp hộ chiếu' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicationDetails.expiryDate"
                    label="Ngày hết hạn hộ chiếu"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn hộ chiếu' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicationDetails.entryType"
                    label="Loại nhập cảnh"
                    rules={[{ required: true, message: 'Vui lòng chọn loại nhập cảnh' }]}
                  >
                    <Select placeholder="Chọn loại nhập cảnh">
                      <Option value="SINGLE">Một lần</Option>
                      <Option value="MULTIPLE">Nhiều lần</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicationDetails.stayDuration"
                    label="Thời gian lưu trú (ngày)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập thời gian lưu trú' },
                      { type: 'number', min: 1, message: 'Thời gian lưu trú phải lớn hơn 0', transform: value => Number(value) }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      placeholder="Nhập số ngày lưu trú"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="applicationDetails.appliedDate"
                    label="Ngày nộp đơn"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày nộp đơn' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="notes"
                    label="Ghi chú"
                  >
                    <TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default VisaManagement;