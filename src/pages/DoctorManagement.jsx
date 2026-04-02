import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorService } from '../services/api';
import '../styles/DoctorManagement.css';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (doctorId) => {
    try {
      await doctorService.duplicateDoctor(doctorId);
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('Error duplicating doctor:', error);
      alert('Failed to duplicate doctor');
    }
  };

  const handleDelete = async (doctorId) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    
    try {
      await doctorService.deleteDoctor(doctorId);
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const handleSelectDoctor = async (doctorId) => {
    // First fetch the doctor details from API
    try {
      const response = await doctorService.getDoctor(doctorId);
      const doctor = response.data;
      // Navigate to new request form with pre-selected doctor details
      navigate('/requests/new', {
        state: {
          selectedDoctorId: doctorId,
          doctorDetails: doctor
        }
      });
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      // Still navigate even if fetch fails
      navigate('/requests/new', { state: { selectedDoctorId: doctorId } });
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.therapy_area && doctor.therapy_area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group doctors by priority
  const priorityDoctors = filteredDoctors.filter(d => d.is_priority_doctor);
  const regularDoctors = filteredDoctors.filter(d => !d.is_priority_doctor);

  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  return (
    <div className="doctor-management-container">
      <div className="page-header">
        <h1>Doctor Management</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search doctors by name or therapy area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="doctors-section">
        <h2>⭐ Priority Doctors ({priorityDoctors.length})</h2>
        {priorityDoctors.length === 0 ? (
          <p className="empty-text">No priority doctors found.</p>
        ) : (
          <div className="doctors-table-container">
            <table className="doctors-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doctor Name</th>
                  <th>Therapy Area</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {priorityDoctors.map((doctor) => (
                  <tr key={doctor.id} className="priority-row">
                    <td>{doctor.id}</td>
                    <td className="doctor-name">{doctor.name}</td>
                    <td>{doctor.therapy_area || '-'}</td>
                    <td>
                      <span className="priority-badge">⭐ Priority</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleSelectDoctor(doctor.id)}
                          className="btn-select"
                          title="Select for Request"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleDuplicate(doctor.id)}
                          className="btn-duplicate"
                          title="Duplicate Doctor"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="btn-delete"
                          title="Delete Doctor"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="doctors-section">
        <h2>All Doctors ({regularDoctors.length})</h2>
        {regularDoctors.length === 0 ? (
          <p className="empty-text">No doctors found.</p>
        ) : (
          <div className="doctors-table-container">
            <table className="doctors-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doctor Name</th>
                  <th>Therapy Area</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regularDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td className="doctor-name">{doctor.name}</td>
                    <td>{doctor.therapy_area || '-'}</td>
                    <td>
                      <span className="regular-badge">Regular</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleSelectDoctor(doctor.id)}
                          className="btn-select"
                          title="Select for Request"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleDuplicate(doctor.id)}
                          className="btn-duplicate"
                          title="Duplicate Doctor"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="btn-delete"
                          title="Delete Doctor"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>How to use:</h3>
        <ul>
          <li><strong>Select</strong> - Choose a doctor to create a new MSL engagement request</li>
          <li><strong>Duplicate</strong> - Create a copy of the doctor (useful for multiple locations/departments)</li>
          <li><strong>Delete</strong> - Remove the doctor from the system</li>
        </ul>
      </div>
    </div>
  );
};

export default DoctorManagement;