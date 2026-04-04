import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService, requestService } from '../services/api';
import '../styles/RequestForm.css';

const PRIORITIES = ['High', 'Medium', 'Low'];

const TERRITORY_REGIONS_MAP = {
  'North': ['Delhi', 'Punjab', 'Haryana', 'UP', 'Uttarakhand', 'Himachal Pradesh', 'J&K'],
  'South': ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
  'East': ['West Bengal', 'Bihar', 'Odisha', 'Jharkhand', 'Assam'],
  'West': ['Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Goa']
};

const RequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDoctorId = location.state?.selectedDoctorId;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    territory: '',
    region: '',
    doctor_id: '',
    therapy_area: '',
    objective: '',
    expected_outcome: '',
    priority: 'Medium',
    notes: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle pre-selected doctor from Doctor Management page
  useEffect(() => {
    if (selectedDoctorId && doctors.length > 0) {
      const selectedDoctor = doctors.find(d => d.id === parseInt(selectedDoctorId));
      if (selectedDoctor) {
        setFormData(prev => ({
          ...prev,
          doctor_id: selectedDoctorId,
          therapy_area: selectedDoctor.therapy_area || ''
        }));
      }
    }
  }, [doctors, selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors list');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'territory') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        region: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const selectedDoctor = doctors.find(d => d.id === parseInt(doctorId));

    setFormData(prev => ({
      ...prev,
      doctor_id: doctorId,
      therapy_area: selectedDoctor?.therapy_area || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.doctor_id) {
      setError('Please select a doctor');
      setLoading(false);
      return;
    }

    try {
      const { territory, region, ...formDataWithoutLocation } = formData;
      const requestData = {
        ...formDataWithoutLocation,
        doctor_id: parseInt(formData.doctor_id),
        requested_by: user.username,
        requested_by_role: user.role,
        user_classification: 'potential'
      };

      await requestService.createRequest(requestData);
      navigate('/requests');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  // Separate priority and regular doctors
  const priorityDoctors = doctors.filter(d => d.is_priority_doctor);
  const regularDoctors = doctors.filter(d => !d.is_priority_doctor);

  // Get selected doctor name for display
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctor_id));

  return (
    <div className="request-form-container">
      <div className="form-header">
        <h1>MSL Engagement Request</h1>
        <p>Create a new engagement request for MSL to interact with a doctor</p>
        {selectedDoctorId && selectedDoctor && (
          <div className="preselected-info">
            <p>✓ Pre-selected doctor: <strong>{selectedDoctor.name}</strong></p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="request-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>Doctor Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="territory">Territory *</label>
              <select
                id="territory"
                name="territory"
                value={formData.territory}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">-- Select Territory --</option>
                {Object.keys(TERRITORY_REGIONS_MAP).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region *</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="form-control"
                required
                disabled={!formData.territory}
              >
                <option value="">-- Select Region --</option>
                {formData.territory && TERRITORY_REGIONS_MAP[formData.territory].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="doctor_id">Doctor Name *</label>
            <select
              id="doctor_id"
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleDoctorChange}
              className="form-control"
              required
            >
              <option value="">-- Select Doctor --</option>

              {priorityDoctors.length > 0 && (
                <optgroup label="⭐ Priority Doctors">
                  {priorityDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.therapy_area})
                    </option>
                  ))}
                </optgroup>
              )}

              {regularDoctors.length > 0 && (
                <optgroup label="Other Doctors">
                  {regularDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.therapy_area})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="therapy_area">Therapy Area / Brand</label>
            <input
              type="text"
              id="therapy_area"
              name="therapy_area"
              value={formData.therapy_area}
              className="form-control"
              placeholder="e.g., Cardiology, Oncology (Auto-filled)"
              readOnly
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Engagement Details</h3>

          <div className="form-group">
            <label htmlFor="objective">Objective of MSL Engagement *</label>
            <textarea
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="What is the main goal of this engagement?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expected_outcome">Expected Scientific Outcome</label>
            <textarea
              id="expected_outcome"
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="What scientific outcomes do you expect from this engagement?"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-control"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Context / Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Any additional information..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
