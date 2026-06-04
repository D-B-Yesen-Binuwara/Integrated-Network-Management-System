import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function LeaRegister({ onBack }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [lea, setLea] = useState("");

  const handleRegister = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5289/api/AccountRequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  fullName: fullName + " " + lastName,
  email: email,
  serviceId: serviceId,
  roleId: 4,

  regionId: Number(region),
  provinceId: Number(province),
  leaId: Number(lea)
}),
      }
    );

    if (response.ok) {
      alert("Request Sent Successfully ✅");
      navigate("/login");
    } else {
      alert("Failed to send request");
    }
  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
            LEA Officer Register
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
                <option value="1">Western</option>
<option value="2">Central</option>
<option value="3">Southern</option>
<option value="4">Northern</option>
<option value="5">Eastern</option>
<option value="6">North Western</option>
<option value="7">North Central</option>
<option value="8">Uva</option>
<option value="9">Sabaragamuwa</option>
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
                <option value="1">Western Province</option>
<option value="2">Central Province</option>
<option value="3">Southern Province</option>
<option value="4">Northern Province</option>
<option value="5">Eastern Province</option>
<option value="6">North Western Province</option>
<option value="7">North Central Province</option>
<option value="8">Uva Province</option>
<option value="9">Sabaragamuwa Province</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                LEA
              </label>
              <select
                value={lea}
                onChange={(e) => setLea(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700"
              >
                <option value="">Select LEA</option>
                <option value="1">Colombo</option>
<option value="2">Gampaha</option>
<option value="3">Kalutara</option>
<option value="4">Kandy</option>
<option value="5">Matale</option>
<option value="6">Nuwara Eliya</option>
<option value="7">Galle</option>
<option value="8">Matara</option>
<option value="9">Hambantota</option>
<option value="10">Jaffna</option>
<option value="11">Kilinochchi</option>
<option value="12">Mannar</option>
<option value="13">Vavuniya</option>
<option value="14">Mullaitivu</option>
<option value="15">Batticaloa</option>
<option value="16">Ampara</option>
<option value="17">Trincomalee</option>
<option value="18">Kurunegala</option>
<option value="19">Puttalam</option>
<option value="20">Anuradhapura</option>
<option value="21">Polonnaruwa</option>
<option value="22">Badulla</option>
<option value="23">Moneragala</option>
<option value="24">Ratnapura</option>
<option value="25">Kegalle</option>
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
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:from-sky-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200"
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

export default LeaRegister;