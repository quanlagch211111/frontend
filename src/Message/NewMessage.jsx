import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Layout,
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  Typography,
  Divider,
  Alert,
  Breadcrumb,
  Row,
  Col,
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const NewMessage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [error, setError] = useState(null);

  // Fetch users for recipient selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUserLoading(true);
        const response = await axios.get('/api/users');
        
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleFinish = async (values) => {
    try {
      setLoading(true);
      
      const messageData = {
        recipientId: values.recipientId,
        content: values.content,
        attachments
      };
      
      const response = await axios.post('/api/messages', messageData);
      
      if (response.data.success) {
        toast.success('Tin nhắn đã được gửi');
        // Navigate to the conversation with this recipient
        navigate(`/dashboard/messages/conversation/${values.recipientId}`);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const addAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    
    try {
      // Basic URL validation
      new URL(newAttachmentUrl);
      
      setAttachments([...attachments, newAttachmentUrl]);
      setNewAttachmentUrl('');
    } catch (err) {
      toast.error('Vui lòng nhập URL hợp lệ');
    }
  };

  const removeAttachment = (index) => {
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
  };

  return (
    <Layout style={{ background: 'transparent', padding: '0' }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/dashboard/messages')}>
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Danh sách tin nhắn
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Tin nhắn mới</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Title level={4}>Tạo tin nhắn mới</Title>
        
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
          onFinish={handleFinish}
        >
          <Form.Item
            name="recipientId"
            label="Người nhận"
            rules={[{ required: true, message: 'Vui lòng chọn người nhận' }]}
          >
            <Select
              placeholder="Chọn người nhận"
              loading={userLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="content"
            label="Nội dung tin nhắn"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung tin nhắn' },
              { max: 2000, message: 'Tin nhắn không được vượt quá 2000 ký tự' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="Nhập nội dung tin nhắn..." 
            />
          </Form.Item>
          
          <Divider orientation="left">Tệp đính kèm</Divider>
          
          <div style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="Thêm URL tệp đính kèm"
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                onPressEnter={addAttachment}
                prefix={<LinkOutlined />}
              />
              <Button 
                type="primary" 
                onClick={addAttachment}
                disabled={!newAttachmentUrl}
              >
                Thêm
              </Button>
            </Space.Compact>
            
            <div>
              {attachments.map((url, index) => (
                <Tag 
                  key={index} 
                  closable
                  onClose={() => removeAttachment(index)}
                  style={{ marginBottom: 8 }}
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Tệp đính kèm {index + 1}
                  </a>
                </Tag>
              ))}
              {attachments.length === 0 && (
                <Text type="secondary">Chưa có tệp đính kèm nào được thêm.</Text>
              )}
            </div>
          </div>
          
          <Form.Item style={{ marginTop: 24 }}>
            <Row justify="end">
              <Space>
                <Button 
                  onClick={() => navigate('/dashboard/messages')}
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SendOutlined />}
                  loading={loading}
                >
                  Gửi tin nhắn
                </Button>
              </Space>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};

export default NewMessage;