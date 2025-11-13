import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Account Information</h3>
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">User ID:</span>
            <span className="info-value">{user?.uid}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <div className="info-card">
          <p>FLOW - Your personal task, finance, and notes manager</p>
          <p>Version 1.0.0</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Account Actions</h3>
        <button onClick={handleLogout} className="logout-button-settings">
          Logout
        </button>
      </div>
    </div>
  );
}
