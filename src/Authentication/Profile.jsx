import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  Typography,
  Card,
  Form,
  Input,
  Button,
  Divider,
  Spin,
  Alert,
  Avatar,
  Tabs,
  Modal,
  Space,
  Select,
  Switch,
  Row,
  Col,
  Tag,
  Upload,
  message
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  EditOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthProvider';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Content } = Layout;
const { confirm } = Modal;

const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    role: '',
    preferences: {
      language: 'vi',
      notifications: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabKey, setTabKey] = useState('1');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch user profile data
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/users/profile');

      if (response.data.success) {
        const userData = {
          ...response.data.user,
          preferences: response.data.user.preferences || {
            language: 'vi',
            notifications: true
          }
        };
        
        setProfileData(userData);
        form.setFieldsValue({
          username: userData.username,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.avatar || ''
        });
        
        preferencesForm.setFieldsValue({
          language: userData.preferences.language || 'vi',
          notifications: userData.preferences.notifications !== false
        });
      } else {
        setError('Không thể tải thông tin hồ sơ');
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle profile form submission
  const handleProfileSubmit = async (values) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put('/api/users/profile', {
        username: values.username,
        address: values.address,
        phone: values.phone,
        avatar: values.avatar,
        preferences: profileData.preferences
      });

      if (response.data.success) {
        setSuccess('Cập nhật hồ sơ thành công');
        toast.success('Cập nhật hồ sơ thành công');
        fetchProfile(); // Refresh profile data
      } else {
        setError('Không thể cập nhật hồ sơ');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật hồ sơ:', err);
      setError(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  // Handle preferences form submission
  const handlePreferencesSubmit = async (values) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfileData = {
        ...profileData,
        preferences: {
          language: values.language,
          notifications: values.notifications
        }
      };

      const response = await axios.put('/api/users/profile', {
        username: profileData.username,
        address: profileData.address,
        phone: profileData.phone,
        avatar: profileData.avatar,
        preferences: updatedProfileData.preferences
      });

      if (response.data.success) {
        setProfileData(updatedProfileData);
        setSuccess('Cập nhật tùy chọn thành công');
        toast.success('Cập nhật tùy chọn thành công');
      } else {
        setError('Không thể cập nhật tùy chọn');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật tùy chọn:', err);
      setError(err.response?.data?.message || 'Lỗi khi cập nhật tùy chọn');
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật tùy chọn');
    } finally {
      setSaving(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (values) => {
    Modal.confirm({
      title: 'Xác nhận đổi mật khẩu',
      content: 'Bạn có chắc chắn muốn thay đổi mật khẩu? Bạn sẽ được đăng xuất và cần đăng nhập lại bằng mật khẩu mới.',
      onOk: async () => {
        setChangingPassword(true);
        setError(null);
        setSuccess(null);

        try {
          const response = await axios.put('/api/users/change-password', {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          });

          if (response.data.success) {
            setSuccess('Đổi mật khẩu thành công');
            toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
            setTimeout(() => {
              // Force re-login for security
              logout();
              navigate('/login');
            }, 2000);
          } else {
            setError('Không thể đổi mật khẩu');
          }
        } catch (err) {
          console.error('Lỗi khi đổi mật khẩu:', err);
          setError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
          toast.error(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
          setChangingPassword(false);
        }
      }
    });
  };

  // Handle file upload
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể tải lên tệp hình ảnh!');
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Hình ảnh phải nhỏ hơn 5MB!');
      return Upload.LIST_IGNORE;
    }

    setAvatarFile(file);
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Prevent automatic upload
    return false;
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await axios.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Tải ảnh đại diện thành công');
        setProfileData(prev => ({
          ...prev,
          avatar: response.data.user.avatar
        }));
        form.setFieldsValue({ avatar: response.data.user.avatar });
        setAvatarPreview(null);
        setAvatarFile(null);
      } else {
        toast.error('Không thể tải lên ảnh đại diện');
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh đại diện:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin hồ sơ...</div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'SUPPORT': return 'purple';
      case 'AGENT': return 'blue';
      default: return 'default';
    }
  };

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <Content>
        <Title level={3}>Hồ sơ người dùng</Title>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <Avatar 
              size={80} 
              src={avatarPreview || profileData.avatar}
              icon={<UserOutlined />}
              style={{ marginRight: 24 }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>{profileData.username}</Title>
              <Text type="secondary">{profileData.email}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={getRoleColor(profileData.role)}>
                  {profileData.role || 'USER'}
                </Tag>
              </div>
            </div>
          </div>

          <Tabs activeKey={tabKey} onChange={setTabKey}>
            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  Thông tin cá nhân
                </span>
              } 
              key="1"
            >
              {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
              {success && <Alert message="Thành công" description={success} type="success" showIcon style={{ marginBottom: 16 }} />}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileSubmit}
                initialValues={{
                  username: profileData.username,
                  email: profileData.email,
                  phone: profileData.phone || '',
                  address: profileData.address || '',
                  avatar: profileData.avatar || ''
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="username"
                      label="Tên người dùng"
                      rules={[{ required: true, message: 'Vui lòng nhập tên người dùng' }]}
                    >
                      <Input placeholder="Nhập tên người dùng" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label="Số điện thoại"
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="address"
                      label="Địa chỉ"
                    >
                      <Input placeholder="Nhập địa chỉ" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Divider orientation="left">Ảnh đại diện</Divider>
                    
                    <div style={{ marginBottom: 16 }}>
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        showUploadList={false}
                        beforeUpload={handleBeforeUpload}
                        maxCount={1}
                      >
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                        </div>
                      </Upload>
                      
                      {avatarFile && (
                        <Button
                          type="primary"
                          onClick={handleAvatarUpload}
                          loading={uploadingAvatar}
                          style={{ marginLeft: 16 }}
                        >
                          Tải lên
                        </Button>
                      )}
                    </div>
                    
                    <Text type="secondary">
                      Bạn cũng có thể đặt ảnh đại diện bằng URL:
                    </Text>
                    
                    <Form.Item
                      name="avatar"
                      style={{ marginTop: 8 }}
                    >
                      <Input placeholder="Nhập URL ảnh đại diện" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <LockOutlined />
                  Đổi mật khẩu
                </span>
              } 
              key="2"
            >
              {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
              {success && <Alert message="Thành công" description={success} type="success" showIcon style={{ marginBottom: 16 }} />}

              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordSubmit}
              >
                <Form.Item
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                >
                  <Input.Password 
                    placeholder="Nhập mật khẩu hiện tại" 
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
                
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  ]}
                >
                  <Input.Password 
                    placeholder="Nhập mật khẩu mới" 
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    placeholder="Xác nhận mật khẩu mới" 
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
                
                <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={changingPassword}
                  >
                    Đổi mật khẩu
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Tùy chọn
                </span>
              } 
              key="3"
            >
              <Form
                form={preferencesForm}
                layout="vertical"
                onFinish={handlePreferencesSubmit}
                initialValues={{
                  language: profileData.preferences?.language || 'vi',
                  notifications: profileData.preferences?.notifications !== false
                }}
              >
                <Form.Item
                  name="language"
                  label="Ngôn ngữ"
                >
                  <Select>
                    <Option value="vi">Tiếng Việt</Option>
                    <Option value="en">Tiếng Anh</Option>
                    <Option value="fr">Tiếng Pháp</Option>
                    <Option value="zh">Tiếng Trung</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="notifications"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="Bật" 
                    unCheckedChildren="Tắt" 
                  /> <Text style={{ marginLeft: 8 }}>Nhận thông báo qua email</Text>
                </Form.Item>
                
                <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Lưu tùy chọn
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Card>
      </Content>
    </Layout>
  );
};

export default UserProfile;