import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService, seedService } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    potentialRequests: 0,
    nonPotentialRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const getRoleLabel = (role) => {
    const roles = {
      'BL': 'Business Leader',
      'BM': 'Business Manager',
      'MSL': 'Medical Science Liaison',
      'Scientific Officer': 'Medical Science Liaison',
      'SBUH/BH': 'SBUH/BH',
      'Asst General Manager': 'Asst General Manager',
      'Associate Vice President': 'Associate Vice President'
    };
    return roles[role] || role;
  };

  // const getRoleDashboard = () => {
  //   return (
  //     <div className="role-section">
  //       <h2>{getRoleLabel(user?.role)} Dashboard</h2>
  //       <p>
  //         {['BL', 'BM'].includes(user?.role) && "Create and manage MSL engagement requests for your doctors."}
  //         {(user?.role === 'MSL' || user?.role === 'Scientific Officer') && "View assigned requests and log your interactions with doctors."}
  //         {(user?.role === 'Asst General Manager' || user?.role === 'Associate Vice President') && "Oversee all MSL engagement activities and track outcomes."}
  //       </p>
  //       <div className="quick-actions">
  //         {['BL', 'BM'].includes(user?.role) && (
  //           <Link to="/requests/new" className="action-btn primary">
  //             + New Engagement Request
  //           </Link>
  //         )}
  //         <Link to="/requests" className="action-btn secondary">
  //           {['MSL', 'Scientific Officer'].includes(user?.role) ? "View My Requests" : "View All Requests"}
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // };

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
        potentialRequests: requests.filter(r => r.user_classification === 'potential').length,
        nonPotentialRequests: requests.filter(r => r.user_classification === 'non-potential').length,
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



  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <p className="role-badge">{getRoleLabel(user?.role)}</p>
      </div>

      {/* {getRoleDashboard()} */}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalRequests}</h3>
          <p>Total Requests</p>
        </div>
        <div className="stat-card pending">
          <h3>{stats.potentialRequests}</h3>
          <p>Potential Users</p>
        </div>
        <div className="stat-card completed">
          <h3>{stats.nonPotentialRequests}</h3>
          <p>Not a Potential User</p>
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
                  <span className={`status-badge ${request.user_classification === 'potential' ? 'potential' : 'non-potential'}`}>
                    {request.user_classification === 'potential' ? 'Potential User' : 'Not a Potential User'}
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