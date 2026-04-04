import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService, interactionService, activityService } from '../services/api';
import '../styles/RequestDetail.css';

const STATUSES = ['potential', 'non-potential'];
const SCIENTIFIC_DEPTHS = ['Basic', 'Intermediate', 'Advanced', 'Expert'];
const ENGAGEMENT_LEVELS = ['Low', 'Moderate', 'High', 'Very High'];

const RequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  // Form states
  const [interactionForm, setInteractionForm] = useState({
    doctor_name: '',
    visit_date: '',
    topics_discussed: '',
    scientific_depth: '',
    engagement_quality_interest: '',
    engagement_quality_participation: '',
    engagement_quality_objection: '',
    summary: '',
    outcomes: ''
  });

  const [activityForm, setActivityForm] = useState({
    activity_date: '',
    activity_category: '',
    summary: '',
    linked_outputs: ''
  });

  useEffect(() => {
    fetchRequestData();
  }, [id]);

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      const [requestRes, logsRes] = await Promise.all([
        requestService.getRequest(id),
        requestService.getLogs(id)
      ]);
      setRequest(requestRes.data);
      setLogs(logsRes.data);

      // Pre-fill doctor name for interaction form
      if (requestRes.data.doctor) {
        setInteractionForm(prev => ({
          ...prev,
          doctor_name: requestRes.data.doctor.name
        }));
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await requestService.updateStatus(id, newStatus);
      setRequest(prev => ({ ...prev, user_classification: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleInteractionSubmit = async (e) => {
    e.preventDefault();
    try {
      await interactionService.createInteraction({
        ...interactionForm,
        outcomes: (interactionForm.outcomes || []).join(', '),
        request_id: parseInt(id)
      });
      setShowInteractionForm(false);
      setInteractionForm({
        doctor_name: request?.doctor?.name || '',
        visit_date: '',
        topics_discussed: '',
        scientific_depth: '',
        engagement_quality_interest: '',
        engagement_quality_participation: '',
        engagement_quality_objection: '',
        summary: '',
        outcomes: ''
      });
      fetchRequestData();
    } catch (error) {
      console.error('Error creating interaction:', error);
      alert('Failed to log interaction');
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      await activityService.createActivity({
        ...activityForm,
        request_id: parseInt(id)
      });
      setShowActivityForm(false);
      setActivityForm({
        activity_date: '',
        activity_category: '',
        summary: '',
        linked_outputs: ''
      });
      fetchRequestData();
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

  const getStatusClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().replace(' ', '-');
  };

  if (loading) {
    return <div className="loading">Loading request details...</div>;
  }

  if (!request) {
    return <div className="error">Request not found</div>;
  }

  const canLogActivities = user?.role === 'MSL' || user?.role === 'Scientific Officer';
  const canChangeStatus = user?.role === 'Asst General Manager' || user?.role === 'Associate Vice President';

  return (
    <div className="request-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <Link to="/requests" className="back-link">← Back to Requests</Link>
          <h1>Request #{request.id}</h1>
        </div>
        <div className="header-right">
          <span className={`status-badge-large ${getStatusClass(request.user_classification)}`}>
            {request.user_classification === 'potential' ? 'Potential User' : 'Not a Potential User'}
          </span>
          {canChangeStatus && (
            <select
              value={request.user_classification || 'potential'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
            >
              <option value="potential">Potential User</option>
              <option value="non-potential">Not a Potential User</option>
            </select>
          )}
        </div>
      </div>

      <div className="request-info-card">
        <div className="info-grid">
          <div className="info-item">
            <label>Doctor</label>
            <value>{request.doctor?.name}</value>
          </div>
          <div className="info-item">
            <label>Therapy Area</label>
            <value>{request.therapy_area}</value>
          </div>
          <div className="info-item">
            <label>Priority</label>
            <value className={`priority ${request.priority?.toLowerCase()}`}>{request.priority}</value>
          </div>
          <div className="info-item">
            <label>Requested By</label>
            <value>{request.requested_by} ({request.requested_by_role})</value>
          </div>
          <div className="info-item">
            <label>Created</label>
            <value>{formatDate(request.created_at)}</value>
          </div>
        </div>
        <div className="info-section">
          <label>Objective</label>
          <p>{request.objective}</p>
        </div>
        <div className="info-section">
          <label>Expected Outcome</label>
          <p>{request.expected_outcome || 'Not specified'}</p>
        </div>
        {request.notes && (
          <div className="info-section">
            <label>Additional Notes</label>
            <p>{request.notes}</p>
          </div>
        )}
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Activity Summary
          </button>
          <button
            className={`tab ${activeTab === 'interactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('interactions')}
          >
            Doctor Interactions ({request.doctor_interactions?.length || 0})
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Activity Timeline</h2>
              {canLogActivities && (
                <div className="action-buttons">
                  <button
                    onClick={() => setShowInteractionForm(true)}
                    className="action-btn"
                  >
                    + Log Doctor Visit
                  </button>
                </div>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="empty-timeline">
                <p>No activities logged yet.</p>
                {canLogActivities && (
                  <p>Start by logging a doctor interaction.</p>
                )}
              </div>
            ) : (
              <div className="timeline">
                {logs.map((log, index) => (
                  <div key={`${log.type}-${log.id}`} className="timeline-item">
                    <div className={`timeline-dot ${log.type}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-type">
                          {'👨‍⚕️ Doctor Visit'}
                        </span>
                        <span className="timeline-date">{formatDate(log.date)}</span>
                      </div>
                      <h4>{log.title}</h4>
                      {log.details && <p>{log.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Doctor Interactions</h2>
              {canLogActivities && (
                <button
                  onClick={() => setShowInteractionForm(true)}
                  className="action-btn"
                >
                  + Log New Visit
                </button>
              )}
            </div>

            {request.doctor_interactions?.length === 0 ? (
              <div className="empty-state">No doctor interactions logged yet.</div>
            ) : (
              <div className="interactions-list">
                {request.doctor_interactions?.map(interaction => (
                  <div key={interaction.id} className="interaction-card">
                    <div className="interaction-header">
                      <h4>{interaction.doctor_name}</h4>
                      <span className="date">{formatDate(interaction.visit_date)}</span>
                    </div>
                    <div className="interaction-details">
                      <p><strong>Topics:</strong> {interaction.topics_discussed}</p>
                      <p><strong>Scientific Depth:</strong> {interaction.scientific_depth}</p>
                      <div className="engagement-quality">
                        <label>Engagement Quality:</label>
                        <div className="quality-badges">
                          <span>Interest: {interaction.engagement_quality_interest}</span>
                          <span>Participation: {interaction.engagement_quality_participation}</span>
                          <span>Objection: {interaction.engagement_quality_objection}</span>
                        </div>
                      </div>
                      <p className="summary"><strong>Summary:</strong> {interaction.summary}</p>
                      {interaction.outcomes && (
                        <p className="outcomes" style={{ marginTop: '5px' }}>
                          <strong>Outcome:</strong> {interaction.outcomes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>


      {/* Doctor Interaction Modal */}
      {showInteractionForm && (
        <div className="modal-overlay" onClick={() => setShowInteractionForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Log Doctor Interaction</h2>
            <form onSubmit={handleInteractionSubmit}>
              <div className="form-group">
                <label>Doctor Name</label>
                <input
                  type="text"
                  value={interactionForm.doctor_name}
                  onChange={e => setInteractionForm({ ...interactionForm, doctor_name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Visit Date</label>
                <input
                  type="date"
                  value={interactionForm.visit_date}
                  onChange={e => setInteractionForm({ ...interactionForm, visit_date: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Topics Discussed</label>
                <textarea
                  value={interactionForm.topics_discussed}
                  onChange={e => setInteractionForm({ ...interactionForm, topics_discussed: e.target.value })}
                  className="form-control"
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Scientific Depth</label>
                <select
                  value={interactionForm.scientific_depth}
                  onChange={e => setInteractionForm({ ...interactionForm, scientific_depth: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select</option>
                  {SCIENTIFIC_DEPTHS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Interest in Clinical Data</label>
                  <select
                    value={interactionForm.engagement_quality_interest}
                    onChange={e => setInteractionForm({ ...interactionForm, engagement_quality_interest: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select</option>
                    {ENGAGEMENT_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Participation Level</label>
                  <select
                    value={interactionForm.engagement_quality_participation}
                    onChange={e => setInteractionForm({ ...interactionForm, engagement_quality_participation: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select</option>
                    {ENGAGEMENT_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Objection Complexity</label>
                  <select
                    value={interactionForm.engagement_quality_objection}
                    onChange={e => setInteractionForm({ ...interactionForm, engagement_quality_objection: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select</option>
                    {ENGAGEMENT_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <select
                  value={interactionForm.outcomes}
                  onChange={e => setInteractionForm({ ...interactionForm, outcomes: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Outcome</option>
                  {OUTCOME_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Summary of Discussion</label>
                <textarea
                  value={interactionForm.summary}
                  onChange={e => setInteractionForm({ ...interactionForm, summary: e.target.value })}
                  className="form-control"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowInteractionForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save Interaction</button>
              </div>
            </form>
          </div>
        </div>
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
                  onChange={e => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Activity Category</label>
                <select
                  value={activityForm.activity_category}
                  onChange={e => setActivityForm({ ...activityForm, activity_category: e.target.value })}
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
                  onChange={e => setActivityForm({ ...activityForm, summary: e.target.value })}
                  className="form-control"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Linked Outputs (if any)</label>
                <textarea
                  value={activityForm.linked_outputs}
                  onChange={e => setActivityForm({ ...activityForm, linked_outputs: e.target.value })}
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

export default RequestDetail;