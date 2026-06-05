import { useNavigate } from "react-router-dom";

function UserVerification() {
  const navigate = useNavigate();

  const user = {
  fullName: "Thulasi",
  email: "test@test.com",
  serviceId: "12345",
  roleId: 1
};

  if (!user) {
    return <h2>User Not Found</h2>;
  }

  const handleConfirm = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          User Verification
        </h2>

        <p>
          <strong>Full Name:</strong> {user.fullName}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Service ID:</strong> {user.serviceId}
        </p>

        <p>
          <strong>Role ID:</strong> {user.roleId}
        </p>

        <button
          onClick={handleConfirm}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

export default UserVerification;