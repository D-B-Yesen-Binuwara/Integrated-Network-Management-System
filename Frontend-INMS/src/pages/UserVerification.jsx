import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5289";

function UserVerification() {
  const navigate = useNavigate();
  const { accounts, instance } = useMsal();
  const [user, setUser] = useState(null);
  // status: "loading" | "found" | "not_found" | "incomplete" | "error"
  const [status, setStatus] = useState("loading");

 const [msalReady, setMsalReady] = useState(false);

useEffect(() => {
  // Give MSAL one tick to populate accounts after loginPopup resolves
  const timer = setTimeout(() => setMsalReady(true), 200);
  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  if (!msalReady) return;

  console.log("Accounts:", accounts);
  console.log("Active Account:", instance.getActiveAccount());
console.log("All Accounts:", instance.getAllAccounts());
  //if (!accounts || accounts.length === 0) {
  //console.log("No Microsoft account found");
  //navigate("/login", { replace: true });
 // return;
//}

//const email = accounts[0]?.username;

if (!accounts || accounts.length === 0) {
  console.log("No Microsoft account found");
  navigate("/login", { replace: true });
  return;
}

const email = accounts[0]?.username;

if (!email) {
  console.log("No email found");
  navigate("/login", { replace: true });
  return;
}

console.log("Email:", email);
  const verify = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/User/email/${encodeURIComponent(email)}`
      );

      if (response.status === 404) {
        setStatus("not_found");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data = await response.json();

      if (!data.serviceId) {
        setStatus("incomplete");
        return;
      }

      if (!data.roleId) {
        setStatus("incomplete");
        return;
      }

      setUser(data);
      setStatus("found");
    } catch (err) {
      console.error("UserVerification error:", err);
      setStatus("error");
    }
  };

  verify();
}, [msalReady, accounts, navigate]);

 const handleContinue = () => {
  sessionStorage.setItem("verified", "true");
  sessionStorage.setItem("userEmail", accounts[0]?.username || "");

  localStorage.setItem(
    "user",
    JSON.stringify({
      serviceId: user.serviceId,
      email: user.email,
      fullName: user.fullName,
      role: user.roleName,
    })
  );

  navigate("/dashboard", { replace: true });
};

 const handleLogout = () => {
  sessionStorage.clear();
  navigate("/login", { replace: true });
};

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <svg className="w-10 h-10 animate-spin text-sky-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-100">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-2">
            Your account (<span className="font-medium text-slate-700">{accounts[0]?.username}</span>) is not registered in this system.
          </p>
          <p className="text-slate-400 text-xs mb-6">Contact your administrator or submit an account request.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/register")} className="w-full py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors text-sm">
              Request Access
            </button>
            <button onClick={handleLogout} className="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "incomplete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-100">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Account Incomplete</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your account is missing a Service ID or Role assignment. Contact your administrator to complete setup.
          </p>
          <button onClick={handleLogout} className="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something Went Wrong</h2>
          <p className="text-slate-500 text-sm mb-6">Unable to verify your account. Please check your connection and try again.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => window.location.reload()} className="w-full py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors text-sm">
              Retry
            </button>
            <button onClick={handleLogout} className="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // status === "found"
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Identity Verified</h2>
          <p className="text-slate-400 text-sm mt-1">Please confirm your details before continuing</p>
        </div>

        <div className="space-y-3 mb-6">
          <DetailRow label="Full Name" value={user.fullName} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Service ID" value={user.serviceId} />
          <DetailRow label="Role" value={user.roleName || `Role ${user.roleId}`} />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200"
          >
            Continue to Dashboard
          </button>
          <button onClick={handleLogout} className="w-full py-2.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-800 text-sm font-medium">
        {value || <span className="text-slate-300 italic">Not set</span>}
      </span>
    </div>
  );
}

export default UserVerification;