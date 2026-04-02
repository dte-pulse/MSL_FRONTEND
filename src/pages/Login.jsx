import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import '../styles/Login.css';

const ROLES = [
  { value: 'BL', label: 'Business Leader (BL)' },
  { value: 'BM', label: 'Business Manager (BM)' },
  { value: 'MSL', label: 'Medical Science Liaison (MSL)' },
  { value: 'SBUH/BH', label: 'SBUH/BH' },
  { value: 'MSL Manager', label: 'MSL Manager' },
  { value: 'HOD', label: 'Head of Department (HOD)' },
];

const SAMPLE_USERS = [
  'Pavan Kumar',
  'Rahul Sharma',
  'Priya Patel',
  'Amit Singh',
  'Neha Gupta',
  'Vikram Reddy',
  'Ananya Desai',
  'Suresh Nair',
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !role) {
      setError('Please select both username and role');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login(username, role);
      login({ username: response.data.username, role: response.data.role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>MSL Engagement System</h1>
          <p>Medical Science Liaison Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Select User</label>
            <select
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
            >
              <option value="">-- Select User --</option>
              {SAMPLE_USERS.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">Select Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-control"
            >
              <option value="">-- Select Role --</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Mock Login System - SSO Integration Planned</p>
        </div>
      </div>
    </div>
  );
};

export default Login;