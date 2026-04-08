import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService, requestService, interactionService } from '../services/api';
import '../styles/RequestForm.css';

const PRIORITIES = ['High', 'Medium', 'Low'];

const RequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDoctorId = location.state?.selectedDoctorId;

  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [regions, setRegions] = useState([]);

  const [doctorHistory, setDoctorHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    doctor_id: '',
    territory: '',
    region: '',
    therapy_area: '',
    objective: '',
    expected_outcome: '',
    priority: 'Medium',
    notes: '',
    requested_by: '',
    requested_by_role: '',
  });

  // FETCH DOCTORS
  useEffect(() => {
    fetchDoctors();
  }, []);

  // DEBUG: Monitor formData changes
  useEffect(() => {
    console.log('Current formData:', formData);
  }, [formData]);

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors from API...');
      const res = await doctorService.getDoctors();
      console.log('Fetched doctors response:', res);
      console.log('Fetched doctors data:', res.data);
      console.log('First doctor sample:', res.data?.[0]);

      if (!res.data || !Array.isArray(res.data)) {
        console.error('Invalid doctors data format:', res.data);
        setError('Invalid doctors data received');
        return;
      }

      setAllDoctors(res.data);

      const uniqueTerritories = [...new Set(res.data.map(d => d.territory).filter(Boolean))];
      console.log('Unique territories:', uniqueTerritories);
      setTerritories(uniqueTerritories);

    } catch (err) {
      console.error('Error fetching doctors:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load doctors: ' + (err.response?.data?.detail || err.message));
    }
  };

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange: ${name} = "${value}"`);

    if (name === 'territory') {
      const filtered = allDoctors.filter(d => d.territory === value);
      const uniqueRegions = [...new Set(filtered.map(d => d.region).filter(Boolean))];

      console.log(`Territory selected: "${value}"`);
      console.log(`Available regions for this territory:`, uniqueRegions);

      setRegions(uniqueRegions);
      setFilteredDoctors([]);

      setFormData(prev => {
        const newState = {
          ...prev,
          territory: value,
          region: '',
          doctor_id: '',
          therapy_area: ''
        };
        console.log('FormData after territory change:', newState);
        return newState;
      });

    } else if (name === 'region') {
      const filtered = allDoctors.filter(
        d => d.territory === formData.territory && d.region === value
      );

      console.log(`Region selected: "${value}"`);
      console.log(`Filtered doctors:`, filtered);

      setFilteredDoctors(filtered);

      setFormData(prev => {
        const newState = {
          ...prev,
          region: value,
          doctor_id: '',
          therapy_area: ''
        };
        console.log('FormData after region change:', newState);
        return newState;
      });

    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // DOCTOR SELECT
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const selectedDoctor = filteredDoctors.find(d => d.id === parseInt(doctorId));

    console.log('Selected doctor:', selectedDoctor);
    console.log('Doctor territory:', selectedDoctor?.territory);
    console.log('Doctor region:', selectedDoctor?.region);

    setFormData(prev => {
      const newState = {
        ...prev,
        doctor_id: doctorId,
        therapy_area: selectedDoctor?.therapy_area || '',
        // Ensure territory and region are set from the doctor data if not already set
        territory: prev.territory || selectedDoctor?.territory || '',
        region: prev.region || selectedDoctor?.region || ''
      };
      console.log('FormData after doctor selection:', newState);
      return newState;
    });
  };

  // FETCH HISTORY
  const fetchDoctorHistory = async () => {
    try {
      const selectedDoctor = filteredDoctors.find(
        d => d.id === parseInt(formData.doctor_id)
      );

      const res = await interactionService.getDoctorHistory(selectedDoctor.name);
      setDoctorHistory(res.data);
      setShowHistory(true);

    } catch (err) {
      console.error(err);
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Debug: Log current form state
    console.log('=== SUBMIT START ===');
    console.log('Current formData:', JSON.stringify(formData, null, 2));

    // Validation
    if (!formData.doctor_id || formData.doctor_id === '') {
      setError('Please select a doctor');
      setLoading(false);
      console.log('Validation failed: No doctor selected');
      return;
    }

    if (!formData.territory) {
      setError('Please select a territory');
      setLoading(false);
      console.log('Validation failed: No territory selected');
      return;
    }

    if (!formData.region) {
      setError('Please select a region');
      setLoading(false);
      console.log('Validation failed: No region selected');
      return;
    }

    try {
      const doctorId = parseInt(formData.doctor_id);
      console.log('Parsed doctor_id:', doctorId);

      if (isNaN(doctorId) || doctorId <= 0) {
        setError('Invalid doctor selected');
        setLoading(false);
        return;
      }

      const requestPayload = {
        territory: formData.territory,
        region: formData.region,
        doctor_id: doctorId,
        therapy_area: formData.therapy_area,
        objective: formData.objective,
        expected_outcome: formData.expected_outcome,
        priority: formData.priority,
        notes: formData.notes,
        requested_by: user.username,
        requested_by_role: user.role
      };

      console.log('Request payload to be sent:', JSON.stringify(requestPayload, null, 2));

      const response = await requestService.createRequest(requestPayload);

      console.log('Create request response:', JSON.stringify(response.data, null, 2));
      console.log('=== SUBMIT END ===');

      navigate('/requests');


    } catch (err) {
      console.error('Error creating request:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to create request: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-form-container">
      <div className="form-header">
        <h1>MSL Engagement Request</h1>
        <p>Create request for doctor interaction</p>
      </div>

      <form onSubmit={handleSubmit} className="request-form">

        {error && <div className="error-message">{error}</div>}

        {/* ================= DOCTOR SECTION ================= */}
        <div className="form-section">
          <h3>Doctor Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Territory *</label>
              <select className="form-control" name="territory" value={formData.territory} onChange={handleChange}>
                <option value="">Select Territory</option>
                {territories.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Region *</label>
              <select className="form-control" name="region" value={formData.region} onChange={handleChange} disabled={!formData.territory}>
                <option value="">Select Region</option>
                {regions.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Doctor *</label>
            <select className="form-control" name="doctor_id" value={formData.doctor_id} onChange={handleDoctorChange} disabled={!formData.region}>
              <option value="">Select Doctor</option>
              {filteredDoctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.therapy_area})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Therapy Area</label>
            <input className="form-control" value={formData.therapy_area} readOnly />
          </div>
        </div>

        {/* ================= ENGAGEMENT DETAILS ================= */}
        <div className="form-section">
          <h3>Engagement Details</h3>

          <div className="form-group">
            <label>Objective *</label>
            <textarea
              className="form-control"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Expected Outcome</label>
            <textarea
              className="form-control"
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select className="form-control" name="priority" value={formData.priority} onChange={handleChange}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              className="form-control"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= HISTORY ================= */}
        {showHistory && (
          <div className="history-box">
            <h3>Doctor History</h3>

            {doctorHistory.length === 0 ? (
              <p>No history found</p>
            ) : (
              doctorHistory.map(item => (
                <div key={item.id} className="history-card">
                  <p><b>Date:</b> {item.visit_date}</p>
                  <p><b>Summary:</b> {item.summary}</p>
                  <p><b>Topics:</b> {item.topics_discussed}</p>
                </div>
              ))
            )}
          </div>
        )}

        <button className="btn-primary" type="submit">
          {loading ? 'Creating...' : 'Create Request'}
        </button>

      </form>
    </div>
  );
};

export default RequestForm;