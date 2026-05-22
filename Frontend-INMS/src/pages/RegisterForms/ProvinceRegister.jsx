import { useState } from "react";
import { useNavigate } from 'react-router-dom';

function ProvinceRegister({ onBack }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const user = {
      fullName,
      lastName,
      serviceId,
      email,
      password,
      region,
      province,
      role: "Province Officer",
    };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Registered Successfully ✅");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
            Province Officer Register
          </h2>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Service ID
              </label>
              <input
                type="text"
                placeholder="Enter your Service ID"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700"
              >
                <option value="">Select Region</option>
                <option value="Western">Western</option>
                <option value="Central">Central</option>
                <option value="Southern">Southern</option>
                <option value="Northern">Northern</option>
                <option value="Eastern">Eastern</option>
                <option value="North Western">North Western</option>
                <option value="North Central">North Central</option>
                <option value="Uva">Uva</option>
                <option value="Sabaragamuwa">Sabaragamuwa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Province
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700"
              >
                <option value="">Select Province</option>
                <option value="Western Province">Western Province</option>
                <option value="Central Province">Central Province</option>
                <option value="Southern Province">Southern Province</option>
                <option value="Northern Province">Northern Province</option>
                <option value="Eastern Province">Eastern Province</option>
                <option value="North Western Province">North Western Province</option>
                <option value="North Central Province">North Central Province</option>
                <option value="Uva Province">Uva Province</option>
                <option value="Sabaragamuwa Province">Sabaragamuwa Province</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-slate-800 via-sky-800 to-slate-700 text-white font-semibold rounded-lg shadow-md hover:from-slate-900 hover:via-sky-900 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200"
            >
              Register
            </button>
          </form>

          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
              className="w-full py-3 px-4 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2"
              type="button"
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
              Back to Role Selection
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

export default ProvinceRegister;
