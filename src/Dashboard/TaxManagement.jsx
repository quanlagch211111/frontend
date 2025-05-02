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
  InputNumber,
  Breadcrumb,
  Divider,
  Avatar,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  FileOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/es/date-picker/locale/vi_VN';

moment.locale('vi');

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const TaxManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [taxCases, setTaxCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taxCaseCount, setTaxCaseCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fiscalYearFilter, setFiscalYearFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create tax case modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit tax case modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTaxCase, setEditingTaxCase] = useState(null);
  const [editForm] = Form.useForm();
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý hồ sơ thuế');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchTaxCases = async () => {
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
      
      if (fiscalYearFilter) {
        params.append('fiscalYear', fiscalYearFilter);
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/tax/admin/all-cases?${params.toString()}`);
      
      if (response.data.success) {
        setTaxCases(response.data.taxCases);
        setTaxCaseCount(response.data.total);
      } else {
        setError(response.data.message || 'Failed to fetch tax cases');
      }
    } catch (err) {
      console.error('Error fetching tax cases:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching tax cases');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTaxCases();
  }, [page, pageSize, typeFilter, statusFilter, fiscalYearFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchTaxCases();
  };
  
  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setFiscalYearFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchTaxCases();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create tax case functions
  const showCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: 'PENDING',
      type: 'INCOME_TAX',
      fiscalYear: moment().format('YYYY'),
      'details.filingDeadline': moment().add(3, 'months')
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
      const taxCaseData = {
        type: values.type,
        status: values.status,
        fiscalYear: values.fiscalYear,
        client: values.client, // ID of client
        taxProfessional: values.taxProfessional, // ID of tax professional (optional)
        details: {
          totalIncome: values['details.totalIncome'] ? Number(values['details.totalIncome']) : undefined,
          totalDeductions: values['details.totalDeductions'] ? Number(values['details.totalDeductions']) : undefined,
          totalTaxDue: values['details.totalTaxDue'] ? Number(values['details.totalTaxDue']) : undefined,
          filingDeadline: values['details.filingDeadline']?.toISOString()
        },
        notes: values.notes,
        documents: []
      };
      
      const response = await axios.post('/api/tax', taxCaseData);
      
      if (response.data.success) {
        toast.success('Tạo hồ sơ thuế mới thành công');
        setCreateModalVisible(false);
        fetchTaxCases();
      } else {
        toast.error(response.data.message || 'Tạo hồ sơ thuế thất bại');
      }
    } catch (err) {
      console.error('Create tax case error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo hồ sơ thuế');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit tax case functions
  const showEditModal = (taxCase) => {
    setEditingTaxCase(taxCase);
    editForm.setFieldsValue({
      type: taxCase.type,
      status: taxCase.status,
      fiscalYear: taxCase.fiscalYear,
      client: taxCase.client?._id,
      taxProfessional: taxCase.taxProfessional?._id,
      'details.totalIncome': taxCase.details?.totalIncome,
      'details.totalDeductions': taxCase.details?.totalDeductions,
      'details.totalTaxDue': taxCase.details?.totalTaxDue,
      'details.filingDeadline': taxCase.details?.filingDeadline ? moment(taxCase.details.filingDeadline) : undefined,
      notes: taxCase.notes
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingTaxCase(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      // Format data for API
      const taxCaseData = {
        type: values.type,
        status: values.status,
        fiscalYear: values.fiscalYear,
        client: values.client,
        taxProfessional: values.taxProfessional,
        details: {
          totalIncome: values['details.totalIncome'] ? Number(values['details.totalIncome']) : undefined,
          totalDeductions: values['details.totalDeductions'] ? Number(values['details.totalDeductions']) : undefined,
          totalTaxDue: values['details.totalTaxDue'] ? Number(values['details.totalTaxDue']) : undefined,
          filingDeadline: values['details.filingDeadline']?.toISOString()
        },
        notes: values.notes
      };
      
      const response = await axios.put(`/api/tax/${editingTaxCase._id}`, taxCaseData);
      
      if (response.data.success) {
        toast.success('Cập nhật hồ sơ thuế thành công');
        setEditModalVisible(false);
        fetchTaxCases();
      } else {
        toast.error(response.data.message || 'Cập nhật hồ sơ thuế thất bại');
      }
    } catch (err) {
      console.error('Edit tax case error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật hồ sơ thuế');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete tax case function
  const showDeleteConfirm = (taxCase) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa hồ sơ thuế này?',
      icon: <ExclamationCircleOutlined />,
      content: `Năm tài chính: ${taxCase.fiscalYear}, Loại: ${getTypeLabel(taxCase.type)}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/tax/${taxCase._id}`);
          
          if (response.data.success) {
            toast.success('Xóa hồ sơ thuế thành công');
            fetchTaxCases();
          } else {
            toast.error(response.data.message || 'Xóa hồ sơ thuế thất bại');
          }
        } catch (err) {
          console.error('Delete tax case error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa hồ sơ thuế');
        }
      }
    });
  };
  
  // Utilities
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
      case 'PROPERTY_TAX': return 'volcano';
      case 'TAX_RETURN': return 'green';
      case 'TAX_CONSULTATION': return 'purple';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'processing';
      case 'COMPLETED': return 'success';
      case 'REVISION_NEEDED': return 'warning';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang xử lý';
      case 'COMPLETED': return 'Hoàn thành';
      case 'REVISION_NEEDED': return 'Cần chỉnh sửa';
      default: return status;
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get available clients (users)
  const [clients, setClients] = useState([]);
  const [taxProfessionals, setTaxProfessionals] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Fetch clients (regular users)
      const clientsResponse = await axios.get('/api/users?role=USER');
      if (clientsResponse.data.success) {
        setClients(clientsResponse.data.users || []);
      }
      
      // Fetch tax professionals (admins and support staff)
      const professionalsResponse = await axios.get('/api/users?role=ADMIN,SUPPORT');
      if (professionalsResponse.data.success) {
        setTaxProfessionals(professionalsResponse.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
      title: 'Khách hàng',
      dataIndex: 'client',
      key: 'client',
      render: client => (
        <Space>
          <Avatar
            src={client?.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <Text>{client?.username || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Loại hồ sơ',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Thuế thu nhập', value: 'INCOME_TAX' },
        { text: 'Thuế bất động sản', value: 'PROPERTY_TAX' },
        { text: 'Hoàn thuế', value: 'TAX_RETURN' },
        { text: 'Tư vấn thuế', value: 'TAX_CONSULTATION' },
      ],
      render: type => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>,
    },
    {
      title: 'Năm tài chính',
      dataIndex: 'fiscalYear',
      key: 'fiscalYear',
      sorter: true,
    },
    {
      title: 'Tổng thu nhập',
      dataIndex: 'details',
      key: 'totalIncome',
      responsive: ['lg'],
      render: details => details?.totalIncome ? formatCurrency(details.totalIncome) : 'N/A',
    },
    {
      title: 'Tổng thuế',
      dataIndex: 'details',
      key: 'totalTaxDue',
      responsive: ['md'],
      render: details => details?.totalTaxDue ? formatCurrency(details.totalTaxDue) : 'N/A',
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'details',
      key: 'filingDeadline',
      responsive: ['lg'],
      render: details => details?.filingDeadline ? formatDate(details.filingDeadline) : 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Chờ xử lý', value: 'PENDING' },
        { text: 'Đang xử lý', value: 'IN_PROGRESS' },
        { text: 'Hoàn thành', value: 'COMPLETED' },
        { text: 'Cần chỉnh sửa', value: 'REVISION_NEEDED' },
      ],
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Chuyên viên',
      dataIndex: 'taxProfessional',
      key: 'taxProfessional',
      responsive: ['xl'],
      render: professional => professional?.username || 'Chưa phân công',
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
              onClick={() => navigate(`/dashboard/tax/${record._id}`)}
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
              <Breadcrumb.Item>Quản lý hồ sơ thuế</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <FileOutlined style={{ marginRight: 8 }} />
                Quản lý hồ sơ thuế
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm hồ sơ thuế mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={5}>
              <Input 
                placeholder="Tìm kiếm..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Lọc theo loại hồ sơ"
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={value => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="INCOME_TAX">Thuế thu nhập</Option>
                <Option value="PROPERTY_TAX">Thuế bất động sản</Option>
                <Option value="TAX_RETURN">Hoàn thuế</Option>
                <Option value="TAX_CONSULTATION">Tư vấn thuế</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={5}>
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
                <Option value="PENDING">Chờ xử lý</Option>
                <Option value="IN_PROGRESS">Đang xử lý</Option>
                <Option value="COMPLETED">Hoàn thành</Option>
                <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Input 
                placeholder="Năm tài chính" 
                value={fiscalYearFilter}
                onChange={e => setFiscalYearFilter(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
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
            dataSource={taxCases}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: taxCaseCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} hồ sơ thuế`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create Tax Case Modal */}
        <Modal
          title="Thêm hồ sơ thuế mới"
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
                  label="Loại hồ sơ thuế"
                  rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ thuế' }]}
                >
                  <Select placeholder="Chọn loại hồ sơ thuế">
                    <Option value="INCOME_TAX">Thuế thu nhập</Option>
                    <Option value="PROPERTY_TAX">Thuế bất động sản</Option>
                    <Option value="TAX_RETURN">Hoàn thuế</Option>
                    <Option value="TAX_CONSULTATION">Tư vấn thuế</Option>
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
                    <Option value="PENDING">Chờ xử lý</Option>
                    <Option value="IN_PROGRESS">Đang xử lý</Option>
                    <Option value="COMPLETED">Hoàn thành</Option>
                    <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="fiscalYear"
                  label="Năm tài chính"
                  rules={[{ required: true, message: 'Vui lòng nhập năm tài chính' }]}
                >
                  <Input placeholder="Nhập năm tài chính" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="client"
                  label="Khách hàng"
                  rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                >
                  <Select
                    placeholder="Chọn khách hàng"
                    showSearch
                    loading={loadingUsers}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {clients.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="taxProfessional"
                  label="Chuyên viên thuế"
                >
                  <Select
                    placeholder="Chọn chuyên viên thuế"
                    showSearch
                    loading={loadingUsers}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    allowClear
                  >
                    {taxProfessionals.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Divider orientation="left">Chi tiết tài chính</Divider>
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
                    locale={locale}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="notes"
                  label="Ghi chú"
                >
                  <TextArea rows={3} placeholder="Nhập ghi chú hoặc hướng dẫn bổ sung" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
        
        {/* Edit Tax Case Modal */}
        <Modal
          title="Chỉnh sửa hồ sơ thuế"
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
          {editingTaxCase && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="type"
                    label="Loại hồ sơ thuế"
                    rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ thuế' }]}
                  >
                    <Select placeholder="Chọn loại hồ sơ thuế">
                      <Option value="INCOME_TAX">Thuế thu nhập</Option>
                      <Option value="PROPERTY_TAX">Thuế bất động sản</Option>
                      <Option value="TAX_RETURN">Hoàn thuế</Option>
                      <Option value="TAX_CONSULTATION">Tư vấn thuế</Option>
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
                      <Option value="PENDING">Chờ xử lý</Option>
                      <Option value="IN_PROGRESS">Đang xử lý</Option>
                      <Option value="COMPLETED">Hoàn thành</Option>
                      <Option value="REVISION_NEEDED">Cần chỉnh sửa</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="fiscalYear"
                    label="Năm tài chính"
                    rules={[{ required: true, message: 'Vui lòng nhập năm tài chính' }]}
                  >
                    <Input placeholder="Nhập năm tài chính" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="client"
                    label="Khách hàng"
                    rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                  >
                    <Select
                      placeholder="Chọn khách hàng"
                      showSearch
                      loading={loadingUsers}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {clients.map(user => (
                        <Option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="taxProfessional"
                    label="Chuyên viên thuế"
                  >
                    <Select
                      placeholder="Chọn chuyên viên thuế"
                      showSearch
                      loading={loadingUsers}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      allowClear
                    >
                      {taxProfessionals.map(user => (
                        <Option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Divider orientation="left">Chi tiết tài chính</Divider>
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
                      locale={locale}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="notes"
                    label="Ghi chú"
                  >
                    <TextArea rows={3} placeholder="Nhập ghi chú hoặc hướng dẫn bổ sung" />
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

export default TaxManagement;