import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import AdminRegister from "./RegisterForms/AdminRegister";
import RegionRegister from "./RegisterForms/RegionRegister";
import ProvinceRegister from "./RegisterForms/ProvinceRegister";
import LeaRegister from "./RegisterForms/LeaRegister";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  if (role === "admin") return <AdminRegister onBack={() => setRole("")} />;
  if (role === "region") return <RegionRegister onBack={() => setRole("")} />;
  if (role === "province") return <ProvinceRegister onBack={() => setRole("")} />;
  if (role === "lea") return <LeaRegister onBack={() => setRole("")} />;

  const roles = [
    { id: "admin", label: "Admin", description: "System Administrator" },
    { id: "region", label: "Region Officer", description: "Regional Network Management" },
    { id: "province", label: "Province Officer", description: "Provincial Network Management" },
    { id: "lea", label: "LEA Officer", description: "Law Enforcement Agency" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Role Selection Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
            Select Your Role
          </h2>

          <div className="space-y-3">
            {roles.map((roleOption) => (
              <button
                key={roleOption.id}
                onClick={() => setRole(roleOption.id)}
                className="w-full p-4 text-left rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {roleOption.label.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 group-hover:text-sky-700">
                      {roleOption.label}
                    </p>
                    <p className="text-sm text-slate-500">
                      {roleOption.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          © 2024 Integrated Network Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Register;