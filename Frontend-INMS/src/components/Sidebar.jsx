import { NavLink as RouterNavLink } from 'react-router-dom';

// Custom NavLink component for styled navigation links
function NavLink({ to, collapsed, label, children }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded transition font-medium text-sky-100 hover:bg-emerald-400/10 ${
          isActive ? 'bg-gradient-to-r from-sky-500/25 to-emerald-400/25 border border-sky-300/40 shadow-sm' : ''
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {!collapsed && label}
    </RouterNavLink>
  );
}

// Main Sidebar component for navigation menu
export default function Sidebar({ collapsed }) {
  return (
    <div
      className={`bg-gradient-to-b from-slate-900 to-slate-800 text-sky-100 flex flex-col shadow-lg border-r border-emerald-400/40 transition-all duration-300 fixed left-0 top-16 bottom-0 z-40 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Navigation links section */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-2">
          <NavLink to="/dashboard" collapsed={collapsed} label="Dashboard">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </NavLink>
          <NavLink to="/network-map" collapsed={collapsed} label="Network Map">
            <rect width="8" height="6" x="8" y="2" rx="1" /><rect width="8" height="6" x="2" y="14" rx="1" /><rect width="8" height="6" x="14" y="14" rx="1" /><path d="M12 8v2" /><path d="M6 14v-2c0-1 1-2 2-2h8c1 0 2 1 2 2v2" />
          </NavLink>
          <NavLink to="/impact-analysis" collapsed={collapsed} label="Impact Analysis">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </NavLink>
          <NavLink to="/correlation" collapsed={collapsed} label="Correlation">
            <circle cx="12" cy="8" r="2" />
            <circle cx="6" cy="16" r="2" />
            <circle cx="18" cy="16" r="2" />
            <path d="M10.4 9.2 7.6 14.8" />
            <path d="M13.6 9.2l2.8 5.6" />
            <path d="M8 16h8" />
          </NavLink>
          <NavLink to="/events" collapsed={collapsed} label="Event Logs">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </NavLink>
          <NavLink to="/device-management" collapsed={collapsed} label="Device Management">
            <rect x="2" y="4" width="20" height="8" rx="2" /><rect x="2" y="12" width="20" height="8" rx="2" /><line x1="6" y1="8" x2="6.01" y2="8" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="8" x2="18" y2="8" /><line x1="10" y1="16" x2="18" y2="16" />
          </NavLink>
          <NavLink to="/vendors" collapsed={collapsed} label="Vendor Management">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 9h6" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
          </NavLink>
          <NavLink to="/user-management" collapsed={collapsed} label="User Management">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </NavLink>
        </nav>
      </div>

      {/* Logout button section */}
      <div className="p-3 border-t border-emerald-400/40">
        <button className={`flex items-center gap-2 w-full px-4 py-2 rounded hover:bg-white-500/20 transition font-medium text-white-400 hover:text-red-300 ${collapsed ? 'justify-center' : ''}`}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
}