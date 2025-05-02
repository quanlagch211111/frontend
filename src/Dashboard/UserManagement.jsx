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
  Avatar,
  Row,
  Col,
  Switch,
  Popconfirm,
  Badge,
  Breadcrumb,
  Divider
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UnlockOutlined,
  HomeOutlined,
  TeamOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  
  // Create user modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Edit user modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm] = Form.useForm();
  
  // Verify admin access
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.isAdmin)) {
      toast.error('Bạn không có quyền truy cập chức năng quản lý người dùng');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pageSize);
      
      if (search) {
        params.append('search', search);
      }
      
      if (roleFilter) {
        params.append('role', roleFilter);
      }
      
      if (activeFilter !== '') {
        params.append('isActive', activeFilter);
      }
      
      params.append('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);
      
      // Make API call
      const response = await axios.get(`/api/users?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.users);
        setUserCount(response.data.totalUsers);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, roleFilter, activeFilter, sortField, sortDirection]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchUsers();
  };
  
  const handleReset = () => {
    setSearch('');
    setRoleFilter('');
    setActiveFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setPage(1);
    fetchUsers();
  };
  
  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'descend' ? 'desc' : 'asc');
    }
  };
  
  // Create user functions
  const showCreateModal = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };
  
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };
  
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      
      const response = await axios.post('/api/users/register', {
        ...values,
        isRegisteredByAdmin: true
      });
      
      if (response.data.success) {
        toast.success('Tạo người dùng mới thành công');
        setCreateModalVisible(false);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Tạo người dùng thất bại');
      }
    } catch (err) {
      console.error('Create user error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo người dùng');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Edit user functions
  const showEditModal = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive
    });
    setEditModalVisible(true);
  };
  
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingUser(null);
  };
  
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      
      const response = await axios.put(`/api/users/${editingUser._id}`, values);
      
      if (response.data.success) {
        toast.success('Cập nhật người dùng thành công');
        setEditModalVisible(false);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Cập nhật người dùng thất bại');
      }
    } catch (err) {
      console.error('Edit user error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật người dùng');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete user function
  const showDeleteConfirm = (user) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa người dùng này?',
      icon: <ExclamationCircleOutlined />,
      content: `Tên người dùng: ${user.username}. Thao tác này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/users/${user._id}`);
          
          if (response.data.success) {
            toast.success('Xóa người dùng thành công');
            fetchUsers();
          } else {
            toast.error(response.data.message || 'Xóa người dùng thất bại');
          }
        } catch (err) {
          console.error('Delete user error:', err);
          toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa người dùng');
        }
      }
    });
  };
  
  // Toggle active status
  const toggleActiveStatus = async (user) => {
    try {
      const response = await axios.put(`/api/users/${user._id}`, {
        isActive: !user.isActive
      });
      
      if (response.data.success) {
        toast.success(`Người dùng đã ${!user.isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Thay đổi trạng thái thất bại');
      }
    } catch (err) {
      console.error('Toggle active status error:', err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi thay đổi trạng thái');
    }
  };
  
  // Utilities
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'AGENT': return 'blue';
      case 'SUPPORT': return 'green';
      default: return 'default';
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };
  
  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      render: id => <Text code>{id.slice(-6)}</Text>,
      width: 100,
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
      render: (username, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.avatar} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.avatar ? 'transparent' : '#1890ff' }}
          />
          <Text 
            style={{ fontWeight: 500 }}
            ellipsis={{ tooltip: username }}
          >
            {username}
          </Text>
          {record.isAdmin && (
            <Badge count="Admin" style={{ backgroundColor: '#ff4d4f' }} />
          )}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: email => <Text ellipsis={{ tooltip: email }}>{email}</Text>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      render: phone => phone || 'N/A',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'ADMIN', value: 'ADMIN' },
        { text: 'AGENT', value: 'AGENT' },
        { text: 'SUPPORT', value: 'SUPPORT' },
        { text: 'USER', value: 'USER' },
      ],
      render: role => <Tag color={getRoleColor(role)}>{role}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Vô hiệu hóa', value: false },
      ],
      render: isActive => (
        isActive ? (
          <Tag color="success">Hoạt động</Tag>
        ) : (
          <Tag color="error">Vô hiệu hóa</Tag>
        )
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      responsive: ['lg'],
      render: date => formatDate(date)
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
              icon={<UserOutlined />} 
              onClick={() => navigate(`/dashboard/admin/users/${record._id}`)}
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
          <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button 
              type={record.isActive ? 'dashed' : 'default'} 
              size="small" 
              danger={record.isActive}
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} 
              onClick={() => toggleActiveStatus(record)}
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
              <Breadcrumb.Item>Quản lý người dùng</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>
                <TeamOutlined style={{ marginRight: 8 }} />
                Quản lý người dùng
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Thêm người dùng mới
              </Button>
            </Col>
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8} md={6}>
              <Input 
                placeholder="Tìm kiếm theo tên, email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Lọc theo vai trò"
                style={{ width: '100%' }}
                value={roleFilter}
                onChange={value => {
                  setRoleFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="ADMIN">Admin</Option>
                <Option value="AGENT">Đại lý</Option>
                <Option value="SUPPORT">Hỗ trợ</Option>
                <Option value="USER">Người dùng</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: '100%' }}
                value={activeFilter}
                onChange={value => {
                  setActiveFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Option value="true">Hoạt động</Option>
                <Option value="false">Vô hiệu hóa</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
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
            dataSource={users}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: userCount,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} người dùng`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
        
        {/* Create User Modal */}
        <Modal
          title="Thêm người dùng mới"
          visible={createModalVisible}
          onCancel={handleCreateCancel}
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
            <Form.Item
              name="username"
              label="Tên người dùng"
              rules={[
                { required: true, message: 'Vui lòng nhập tên người dùng' },
                { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Tên người dùng" />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>
            
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
            </Form.Item>
            
            <Form.Item
              name="role"
              label="Vai trò"
              initialValue="USER"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select placeholder="Chọn vai trò">
                <Option value="ADMIN">Admin</Option>
                <Option value="AGENT">Đại lý</Option>
                <Option value="SUPPORT">Hỗ trợ</Option>
                <Option value="USER">Người dùng</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch 
                checkedChildren="Hoạt động" 
                unCheckedChildren="Vô hiệu hóa" 
              />
            </Form.Item>
          </Form>
        </Modal>
        
        {/* Edit User Modal */}
        <Modal
          title="Chỉnh sửa người dùng"
          visible={editModalVisible}
          onCancel={handleEditCancel}
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
          {editingUser && (
            <Form
              form={editForm}
              layout="vertical"
              requiredMark={true}
            >
              <Form.Item
                name="username"
                label="Tên người dùng"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên người dùng' },
                  { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Tên người dùng" />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="Số điện thoại"
              >
                <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
              </Form.Item>
              
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="ADMIN">Admin</Option>
                  <Option value="AGENT">Đại lý</Option>
                  <Option value="SUPPORT">Hỗ trợ</Option>
                  <Option value="USER">Người dùng</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Hoạt động" 
                  unCheckedChildren="Vô hiệu hóa" 
                />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserManagement;