import { useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AppRoutes from './routes/AppRoutes';
// import './App.css';

function AppContent() {
  const [collapsed, setCollapsed] = useState(true); // Changed default to true
  const location = useLocation();
  
  // Pages that should not show sidebar
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
        <Navbar onToggle={() => setCollapsed(p => !p)} />
        <main className="flex-1 pt-16 overflow-y-auto">
          <AppRoutes />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar onToggle={() => setCollapsed(p => !p)} />
      <div className="flex flex-1 pt-16"> {/* Add top padding for fixed navbar */}
        <Sidebar collapsed={collapsed} />
        <main className={`flex-1 main-content p-6 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
