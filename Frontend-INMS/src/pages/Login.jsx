import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

function Login() {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

const [isMicrosoftLoggedIn, setIsMicrosoftLoggedIn] = useState(false);

useEffect(() => {
  const accounts = instance.getAllAccounts();

  console.log("Login Page Accounts:", accounts);
console.log("Accounts Count =", accounts.length);

  if (accounts.length > 0) {
    navigate("/verify-user");
  }
}, [instance, navigate]);

const handleMicrosoftLogin = async () => {
  try {

    await instance.loginRedirect({
      scopes: ["User.Read"],
    });

    setIsMicrosoftLoggedIn(true);

  } catch (error) {
    console.log(error);
    alert("Login Failed");
  }
};
const handleLogin = (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.serviceNumber === identifier && user.password === password) {
      alert("Login success ✅");
      setTimeout(() => {
  navigate("/dashboard");
}, 500);
    } else {
      alert("Invalid login ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
            Login
          </h2>

          {isMicrosoftLoggedIn && (

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Service Number
              </label>
              <input
                type="text"
                placeholder="Enter your service number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:from-sky-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200"
            >
              Sign In
            </button>
          </form>
          )}

   <button
  onClick={handleMicrosoftLogin}
  className="w-full mt-4 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3"
>
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
    alt="Microsoft"
    className="w-5 h-5"
  />

  Sign in with Microsoft
</button>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-slate-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-sky-600 font-medium hover:text-sky-700 transition-colors duration-200"
              >
                Register here
              </button>
            </p>
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

export default Login;