import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

            roleId: 3,

            regionId: Number(region),
            provinceId: Number(province),

            leaId: null,
          }),
        }
      );

      if (response.ok) {
        alert("Request Sent Successfully ✅");
        navigate("/login");
      } else {
        const errorText = await response.text();
        console.log(errorText);

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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300"
              >
                <option value="">Select Region</option>

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
                className="w-full px-4 py-3 rounded-lg border border-slate-300"
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
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-emerald-500 text-white font-semibold rounded-lg"
            >
              Register
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
              className="w-full py-3 px-4 border border-slate-300 text-slate-600 font-medium rounded-lg"
              type="button"
            >
              ← Back to Role Selection
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          © 2024 Integrated Network Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default ProvinceRegister;