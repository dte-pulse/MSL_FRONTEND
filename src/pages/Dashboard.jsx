import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService, seedService } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = user?.role === 'BL' || user?.role === 'BM' 
        ? { requested_by: user.username, role: user.role }
        : {};
      
      const response = await requestService.getRequests(params);
      const requests = response.data;
      
      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'Pending').length,
        inProgressRequests: requests.filter(r => r.status === 'In Progress').length,
        completedRequests: requests.filter(r => r.status === 'Completed').length,
      });
      
      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedSampleData = async () => {
    try {
      await seedService.seedDoctors();
      alert('Sample doctors added successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error adding sample data');
    }
  };

  const getRoleDashboard = () => {
    switch (user?.role) {
      case 'BL':
      case 'BM':
        return (
          <div className="role-section">
            <h2>Business Dashboard</h2>
            <p>Create and manage MSL engagement requests for your doctors.</p>
            <div className="quick-actions">
              <Link to="/requests/new" className="action-btn primary">
                + New Engagement Request
              </Link>
              <Link to="/requests" className="action-btn secondary">
                View All Requests
              </Link>
            </div>
          </div>
        );
      case 'MSL':
        return (
          <div className="role-section">
            <h2>MSL Dashboard</h2>
            <p>View assigned requests and log your interactions with doctors.</p>
            <div className="quick-actions">
              <Link to="/requests" className="action-btn primary">
                View My Requests
              </Link>
            </div>
          </div>
        );
      case 'MSL Manager':
      case 'HOD':
        return (
          <div className="role-section">
            <h2>Management Dashboard</h2>
            <p>Oversee all MSL engagement activities and track outcomes.</p>
            <div className="quick-actions">
              <Link to="/requests" className="action-btn primary">
                View All Requests
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <p className="role-badge">{user?.role}</p>
      </div>

      {getRoleDashboard()}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalRequests}</h3>
          <p>Total Requests</p>
        </div>
        <div className="stat-card pending">
          <h3>{stats.pendingRequests}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card in-progress">
          <h3>{stats.inProgressRequests}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card completed">
          <h3>{stats.completedRequests}</h3>
          <p>Completed</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Requests</h2>
        {recentRequests.length === 0 ? (
          <div className="empty-state">
            <p>No requests found. Get started by creating a new request.</p>
            {(user?.role === 'BL' || user?.role === 'BM') && (
              <button onClick={seedSampleData} className="seed-btn">
                Add Sample Doctors
              </button>
            )}
          </div>
        ) : (
          <div className="recent-list">
            {recentRequests.map((request) => (
              <Link 
                to={`/requests/${request.id}`} 
                key={request.id} 
                className="recent-item"
              >
                <div className="recent-info">
                  <h4>{request.doctor_name}</h4>
                  <p>{request.therapy_area} • {request.objective?.substring(0, 50)}...</p>
                </div>
                <div className="recent-meta">
                  <span className={`status-badge ${request.status.toLowerCase().replace(' ', '-')}`}>
                    {request.status}
                  </span>
                  <span className="priority-badge">{request.priority}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;