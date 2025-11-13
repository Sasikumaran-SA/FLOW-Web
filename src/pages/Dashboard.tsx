import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-logo">FLOW</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <nav className="bottom-nav">
        <NavLink to="/dashboard/tasks" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">✓</span>
          <span className="nav-label">Tasks</span>
        </NavLink>
        <NavLink to="/dashboard/finance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">$</span>
          <span className="nav-label">Finance</span>
        </NavLink>
        <NavLink to="/dashboard/notes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📝</span>
          <span className="nav-label">Notes</span>
        </NavLink>
        <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">⚙</span>
          <span className="nav-label">Settings</span>
        </NavLink>
      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
