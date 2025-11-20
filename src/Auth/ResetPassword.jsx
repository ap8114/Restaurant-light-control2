import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../utils/config";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from query params (?token=xxxx)
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
   const response = await fetch(`${apiUrl}/users/reset-password`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    token: token, // body me token bhej rahe hain
    newPassword: password,
    confirmPassword: confirmPassword,
  }),
  credentials: "include",
  mode: "cors",
});



      const data = await response.json();

      if (response.ok) {
        alert("Password has been reset successfully!");
        navigate("/login");
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("An error occurred while resetting the password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div
        className="card shadow-lg w-100"
        style={{ maxWidth: "500px", borderRadius: "2rem" }}
      >
        <div className="p-5 text-center">
          {/* Logo and Title */}
          <div className="d-flex justify-content-center align-items-center mb-4">
            <img
              src="https://i.postimg.cc/mZHz3k1Q/Whats-App-Image-2025-07-23-at-12-38-03-add5b5dd-removebg-preview-1.png"
              alt="logo"
              className="navbar-logo m-2"
              style={{ height: "50px" }}
            />
          </div>

          <h2 className="h5 text-secondary mt-3">Reset Your Password</h2>
          <p className="text-muted mb-4">Enter your new password below.</p>

          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <div className="mb-3 position-relative">
              <i className="bi bi-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                type="password"
                className="form-control ps-5"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4 position-relative">
              <i className="bi bi-lock-fill position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                type="password"
                className="form-control ps-5"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-warning w-100 text-white fw-semibold mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link
              to="/"
              className="text-decoration-none fw-semibold"
              style={{ color: "#1f2937" }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
