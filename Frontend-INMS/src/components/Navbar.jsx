import { Link, useLocation } from 'react-router-dom';

// Navbar component for top navigation bar
const Navbar = ({ onToggle }) => {
  // Get current location for conditional rendering
  const location = useLocation();
  
  // Define auth pages that hide profile icon
  const authPages = ['/login', '/register'];
  // Check if current page is an auth page
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-emerald-400/40 flex-shrink-0 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-white/10 transition text-white"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/sltmobitel-logo.png" alt="SLTMobitel" className="h-10 w-auto object-contain" />
        <span className="text-lg font-bold tracking-wide text-white truncate">
        </span>
      </div>

      {!isAuthPage && (
        // Profile link
        <Link
          to="/profile"
          className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium text-sky-100 hover:bg-emerald-400/20 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </Link>
      )}
    </nav>
  );
};

export default Navbar;