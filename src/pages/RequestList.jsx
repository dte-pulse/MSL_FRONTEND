import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/api';
import '../styles/RequestList.css';

const STATUSES = ['All', 'Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'On Hold'];

const RequestList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchRequests();
  }, [user]);

  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(r => r.status === filterStatus));
    }
  }, [filterStatus, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = user?.role === 'BL' || user?.role === 'BM' 
        ? { requested_by: user.username, role: user.role }
        : {};
      
      const response = await requestService.getRequests(params);
      setRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="request-list-container">
      <div className="list-header">
        <h1>MSL Engagement Requests</h1>
        {(user?.role === 'BL' || user?.role === 'BM') && (
          <Link to="/requests/new" className="new-request-btn">
            + New Request
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <label>Filter by Status:</label>
        <div className="filter-buttons">
          {STATUSES.map(status => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No requests found.</p>
          {(user?.role === 'BL' || user?.role === 'BM') && (
            <Link to="/requests/new" className="create-link">
              Create your first request
            </Link>
          )}
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Doctor</th>
                <th>Therapy Area</th>
                <th>Objective</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>#{request.id}</td>
                  <td className="doctor-name">{request.doctor_name}</td>
                  <td>{request.therapy_area}</td>
                  <td className="objective-cell">
                    {request.objective?.substring(0, 50)}
                    {request.objective?.length > 50 ? '...' : ''}
                  </td>
                  <td>
                    <span className={`priority-badge ${request.priority?.toLowerCase()}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{request.requested_by}</td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>
                    <Link to={`/requests/${request.id}`} className="view-btn">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestList;