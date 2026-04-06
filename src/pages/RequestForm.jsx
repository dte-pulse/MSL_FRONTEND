import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService, requestService } from '../services/api';
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

  // ================= FETCH DOCTORS =================
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await doctorService.getDoctors();
      setAllDoctors(res.data);

      // ✅ Extract unique territories from DB
      const uniqueTerritories = [...new Set(res.data.map(d => d.territory).filter(Boolean))];
      setTerritories(uniqueTerritories);

    } catch (err) {
      console.error(err);
      setError('Failed to load doctors');
    }
  };

  // ================= HANDLE TERRITORY CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'territory') {
      const filtered = allDoctors.filter(d => d.territory === value);

      const uniqueRegions = [...new Set(filtered.map(d => d.region).filter(Boolean))];

      setRegions(uniqueRegions);
      setFilteredDoctors([]);

      setFormData(prev => ({
        ...prev,
        territory: value,
        region: '',
        doctor_id: '',
        therapy_area: ''
      }));

    } else if (name === 'region') {

      const filtered = allDoctors.filter(
        d => d.territory === formData.territory && d.region === value
      );

      setFilteredDoctors(filtered);

      setFormData(prev => ({
        ...prev,
        region: value,
        doctor_id: '',
        therapy_area: ''
      }));

    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ================= HANDLE DOCTOR =================
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const selectedDoctor = filteredDoctors.find(d => d.id === parseInt(doctorId));

    setFormData(prev => ({
      ...prev,
      doctor_id: doctorId,
      therapy_area: selectedDoctor?.therapy_area || ''
    }));
  };

  // ================= PRESELECT DOCTOR =================
  useEffect(() => {
    if (selectedDoctorId && allDoctors.length > 0) {
      const selectedDoctor = allDoctors.find(d => d.id === parseInt(selectedDoctorId));

      if (selectedDoctor) {
        const territoryDoctors = allDoctors.filter(d => d.territory === selectedDoctor.territory);
        const regionDoctors = territoryDoctors.filter(d => d.region === selectedDoctor.region);

        const uniqueRegions = [...new Set(territoryDoctors.map(d => d.region).filter(Boolean))];

        setRegions(uniqueRegions);
        setFilteredDoctors(regionDoctors);

        setFormData(prev => ({
          ...prev,
          territory: selectedDoctor.territory,
          region: selectedDoctor.region,
          doctor_id: selectedDoctorId,
          therapy_area: selectedDoctor.therapy_area || ''
        }));
      }
    }
  }, [selectedDoctorId, allDoctors]);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.doctor_id) {
      setError('Please select a doctor');
      setLoading(false);
      return;
    }

    try {
      const { territory, region, ...payload } = formData;

      await requestService.createRequest({
        ...payload,
        doctor_id: parseInt(formData.doctor_id),
        requested_by: user.username,
        requested_by_role: user.role,
        user_classification: 'potential'
      });

      navigate('/requests');

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="request-form-container">
      <div className="form-header">
        <h1>MSL Engagement Request</h1>
        <p>Create request for doctor interaction</p>
      </div>

      <form onSubmit={handleSubmit} className="request-form">

        {error && <div className="error-message">{error}</div>}

        {/* ================= LOCATION ================= */}
        <div className="form-section">
          <h3>Doctor Information</h3>

          <div className="form-row">

            {/* Territory */}
            <div className="form-group">
              <label>Territory *</label>
              <select name="territory" value={formData.territory} onChange={handleChange} required>
                <option value="">-- Select Territory --</option>
                {territories.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div className="form-group">
              <label>Region *</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                disabled={!formData.territory}
                required
              >
                <option value="">-- Select Region --</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Doctor */}
          <div className="form-group">
            <label>Doctor *</label>
            <select
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleDoctorChange}
              disabled={!formData.region}
              required
            >
              <option value="">-- Select Doctor --</option>

              {filteredDoctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.therapy_area})
                </option>
              ))}
            </select>
          </div>

          {/* Therapy */}
          <div className="form-group">
            <label>Therapy Area</label>
            <input value={formData.therapy_area} readOnly />
          </div>
        </div>

        {/* ================= DETAILS ================= */}
        <div className="form-section">

          <div className="form-group">
            <label>Objective *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Expected Outcome</label>
            <textarea
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Request'}
        </button>

      </form>
    </div>
  );
};

export default RequestForm;