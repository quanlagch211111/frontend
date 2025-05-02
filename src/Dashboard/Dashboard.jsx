import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthProvider';

// Ant Design imports
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Avatar, 
  Space, 
  Statistic, 
  Button,
  Divider
} from 'antd';
import { 
  HomeOutlined,
  ShopOutlined,
  SafetyOutlined,
  GlobalOutlined,
  FileOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { MessageOutlined } from '@ant-design/icons';


// Page components
import RealEstateModule from "../RealEstate/RealEstateModule";
import VisaModule from "../Visa/VisaModule";
import InsuranceModule from "../Insurance/InsuranceModule";
import TaxModule from "../Tax/TaxModule";
import TicketModule from "../Ticket/TicketModule";
import UserProfile from "../Authentication/Profile";
import AdminModule from "./AdminModule";
import MessageModule from "../Message/MessageModule";
import AppointmentModule from "../Appointment/AppointmentModule";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

// Placeholder for service module components
const ServicePlaceholder = ({ title }) => (
  <Card>
    <Typography.Title level={5}>{title}</Typography.Title>
    <Typography.Paragraph>
      This is a placeholder for the {title} module. Actual implementation coming soon.
    </Typography.Paragraph>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const services = [
    {
      title: 'Bất Động Sản',
      description: 'Tìm kiếm các bất động sản, lên lịch xem nhà và quản lý khoản đầu tư bất động sản của bạn.',
      icon: <ShopOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      path: '/dashboard/real-estate',
      color: '#1890ff',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8cmVhbCUyMGVzdGF0ZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Bảo hiểm',
      description: 'Tìm hiểu các chính sách bảo hiểm, nhận báo giá và quản lý phạm vi bảo hiểm của bạn.',
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      path: '/dashboard/insurance',
      color: '#52c41a',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8aW5zdXJhbmNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Dịch vụ Visa',
      description: 'Nộp đơn xin thị thực, theo dõi tình trạng đơn xin và nhận tư vấn du lịch.',
      icon: <GlobalOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      path: '/dashboard/visa',
      color: '#722ed1',
      image: 'https://images.unsplash.com/photo-1540270776932-e72e7c2d11cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmlzYXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Dịch vụ Thuế',
      description: 'Nộp thuế, nhận tư vấn chuyên nghiệp và quản lý hồ sơ thuế của bạn.',
      icon: <FileOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      path: '/dashboard/tax',
      color: '#fa8c16',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dGF4fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Chăm sóc khách hàng',
      description: 'Tạo phiếu hỗ trợ, theo dõi giải pháp và nhận trợ giúp về dịch vụ của bạn.',
      icon: <CustomerServiceOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      path: '/dashboard/tickets',
      color: '#eb2f96',
      image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Y3VzdG9tZXIlMjBzZXJ2aWNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Tin nhắn',
      description: 'Gửi và nhận tin nhắn với nhân viên hỗ trợ và các người dùng khác.',
      icon: <MessageOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      path: '/dashboard/messages',
      color: '#1890ff',
      image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bWVzc2FnZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Lịch hẹn',
      description: 'Đặt lịch hẹn với nhân viên tư vấn và quản lý các cuộc hẹn của bạn.',
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
      path: '/dashboard/appointments',
      color: '#13c2c2',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FsZW5kYXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60'
    },
    // Show Admin Dashboard only for admins
    ...(currentUser?.isAdmin || currentUser?.role === 'ADMIN' ? [{
      title: 'Admin Panel',
      description: 'Truy cập các công cụ quản trị, quản lý người dùng và cài đặt hệ thống.',
      icon: <SettingOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      path: '/dashboard/admin',
      color: '#faad14',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YWRtaW58ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60'
    },
    ] : [])
  ];

  const statsData = [
    { title: 'Tài sản BĐS', value: 5, color: '#1890ff' },
    { title: 'Hồ sơ visa', value: 2, color: '#722ed1' },
    { title: 'Bảo hiểm', value: 3, color: '#52c41a' },
    { title: 'Cuộc hẹn', value: 4, color: '#13c2c2' }
  ];

  const DashboardHome = () => (
    <div style={{ padding: '24px 0' }}>
      {/* Welcome Card */}
      <Card 
        style={{ 
          marginBottom: 24, 
          borderRadius: 8,
          background: 'linear-gradient(to right, #189000, #69c0ff)'
        }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={4} md={3} lg={2}>
            <Avatar 
              size={80} 
              src={currentUser?.avatar}
              style={{ 
                backgroundColor: 'white',
                color: '#189000',
                fontSize: 36,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </Col>
          <Col xs={24} sm={20} md={21} lg={22}>
            <Typography.Title 
              level={2} 
              style={{ color: 'white', margin: 0, marginBottom: 8 }}
            >
              Xin chào, {currentUser?.username || 'User'}!
            </Typography.Title>
            <Typography.Paragraph style={{ color: 'white', margin: 0 }}>
              Truy cập tất cả các dịch vụ của chúng tôi từ bảng điều khiển này. Chọn một dịch vụ bên dưới để bắt đầu.
            </Typography.Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Quick Stats - Evenly distributed */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statsData.map((stat, index) => (
          <Col span={6} key={index} xs={12} sm={12} md={6}>
            <Card style={{ textAlign: 'center', height: '100%' }}>
              <Statistic 
                value={stat.value} 
                title={stat.title}
                valueStyle={{ color: stat.color, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Services Section */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={4}>Dịch vụ của chúng tôi</Typography.Title>
      </div>
      
      <Row gutter={[16, 16]}>
        {services.map((service, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              style={{ height: 360, display: 'flex', flexDirection: 'column' }}
              cover={
                <div style={{ position: 'relative', height: 160 }}>
                  <img 
                    alt={service.title}
                    src={service.image}
                    style={{ 
                      width: '100%',
                      height: 160,
                      objectFit: 'cover'
                    }}
                  />
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.1))'
                    }}
                  />
                  <Avatar 
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    size={48}
                  >
                    {service.icon}
                  </Avatar>
                </div>
              }
              bodyStyle={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                padding: 16
              }}
              onClick={() => navigate(service.path)}
            >
              <div style={{ flex: 1 }}>
                <Meta
                  title={<span style={{ fontSize: 18 }}>{service.title}</span>}
                  description={
                    <Typography.Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ 
                        color: 'rgba(0, 0, 0, 0.65)', 
                        marginBottom: 16,
                        height: 63  // Fixed height for description (3 lines)
                      }}
                    >
                      {service.description}
                    </Typography.Paragraph>
                  }
                />
              </div>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Button 
                type="text"
                size="middle"
                style={{ 
                  color: service.color, 
                  fontWeight: 500,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}
              >
                Truy cập ngay 
                <ArrowRightOutlined style={{ marginLeft: 8 }} />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/real-estate/*" element={<RealEstateModule />} />
      <Route path="/visa/*" element={<VisaModule />} />
      <Route path="/insurance/*" element={<InsuranceModule />} />
      <Route path="/tax/*" element={<TaxModule />} />
      <Route path="/tickets/*" element={<TicketModule />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/messages/*" element={<MessageModule />} />
      <Route path="/appointments/*" element={<AppointmentModule />} />

      {/* Admin routes - protected by role */}
      {(currentUser?.isAdmin || currentUser?.role === 'ADMIN') && (
        <Route path="/admin/*" element={<AdminModule />} />
      )}
    </Routes>
  );
};

export default Dashboard;