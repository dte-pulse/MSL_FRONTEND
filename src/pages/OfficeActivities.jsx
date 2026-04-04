import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityService } from '../services/api';
import '../styles/OfficeActivities.css';

const ACTIVITY_CATEGORIES = [
  'Literature Review',
  'Content Development',
  'Training',
  'Strategy Meetings',
  'Advisory Board Preparation'
];

const OfficeActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [mslUsers, setMslUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('loading'); // 'loading', 'users', 'activities'
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);

  const [activityForm, setActivityForm] = useState({
    activity_date: '',
    activity_category: '',
    summary: '',
    linked_outputs: ''
  });

  useEffect(() => {
    if (user) {
      const isMSL = user.role === 'MSL' || user.role === 'Scientific Officer';
      if (isMSL) {
        setSelectedUser(user.username);
        setViewMode('activities');
        fetchActivities(user.username);
      } else {
        setViewMode('users');
        fetchMslUsers();
      }
    }
  }, [user]);

  const fetchMslUsers = async () => {
    try {
      setLoading(true);
      const res = await activityService.getActivityUsers();
      setMslUsers(res.data);
    } catch (error) {
      console.error('Error fetching MSL users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (mslUsername) => {
    try {
      setLoading(true);
      const res = await activityService.getActivities(mslUsername);
      setActivities(res.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (username) => {
    setSelectedUser(username);
    setViewMode('activities');
    fetchActivities(username);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setViewMode('users');
    setActivities([]);
    fetchMslUsers();
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      await activityService.createActivity({
        ...activityForm,
        msl_username: user.username
      });
      setShowActivityForm(false);
      setActivityForm({
        activity_date: '',
        activity_category: '',
        summary: '',
        linked_outputs: ''
      });
      fetchActivities(user.username);
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Failed to log activity');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading office activities...</div>;
  }

  const canLogActivities = user?.role === 'MSL' || user?.role === 'Scientific Officer';

  return (
    <div className="office-activities-container">
      <div className="list-header">
        <div className="header-left">
          {viewMode === 'activities' && !canLogActivities && (
            <button onClick={handleBackToUsers} className="back-btn">
              ← Back to MSL List
            </button>
          )}
          <h1>
            {viewMode === 'users' ? 'MSL Office Activities' : 
             `Activities: ${selectedUser}`}
          </h1>
        </div>
        {canLogActivities && (
          <button onClick={() => setShowActivityForm(true)} className="log-activity-btn">
            + Log Activity
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : viewMode === 'users' ? (
        mslUsers.length === 0 ? (
          <div className="empty-state">
            <p>No MSLs have logged activities yet.</p>
          </div>
        ) : (
          <div className="users-grid">
            {mslUsers.map(username => (
              <div key={username} className="user-card">
                <div className="user-avatar">
                  {username.charAt(0).toUpperCase()}
                </div>
                <h3>{username}</h3>
                <button 
                  onClick={() => handleUserSelect(username)} 
                  className="view-activity-btn"
                >
                  View Activity
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        activities.length === 0 ? (
          <div className="empty-state">
            <p>No office activities logged yet for this user.</p>
          </div>
        ) : (
          <div className="activities-table-container">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Summary</th>
                  <th>Linked Outputs</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{formatDate(activity.activity_date)}</td>
                    <td>{activity.activity_category}</td>
                    <td>{activity.summary}</td>
                    <td>{activity.linked_outputs || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Office Activity Modal */}
      {showActivityForm && (
        <div className="modal-overlay" onClick={() => setShowActivityForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Log Office Activity</h2>
            <form onSubmit={handleActivitySubmit}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={activityForm.activity_date}
                  onChange={e => setActivityForm({...activityForm, activity_date: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Activity Category</label>
                <select
                  value={activityForm.activity_category}
                  onChange={e => setActivityForm({...activityForm, activity_category: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Select Category</option>
                  {ACTIVITY_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Summary of Work Done</label>
                <textarea
                  value={activityForm.summary}
                  onChange={e => setActivityForm({...activityForm, summary: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Linked Outputs (if any)</label>
                <textarea
                  value={activityForm.linked_outputs}
                  onChange={e => setActivityForm({...activityForm, linked_outputs: e.target.value})}
                  className="form-control"
                  rows="2"
                  placeholder="e.g., Presentation slides, Report, Training materials"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowActivityForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeActivities;
