import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { loginUser, clearMessages } from "../redux/slices/authSlice"; // Adjust path as needed
import { toast } from 'react-toastify';

const Login = () => {

    const [roleSelected, setRoleSelected] = useState("admin"); 
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, role } = useSelector((state) => state.auth);

   const setRole = (role) => {
    setRoleSelected(role);
    if (role === "admin") {
      setEmail("admin@gmail.com");
      setPassword("admin@123");
    } else if (role === "staff") {
      setEmail("dinesh@gmail.com");
      setPassword("dinesh@123");
    } else if (role === "user") {
      setEmail("admingautam@gmail.com");
      setPassword("admingautam@123");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear any previous error messages
    dispatch(clearMessages());
    
    try {
      const credentials = { email, password };
      const result = await dispatch(loginUser(credentials)).unwrap();
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      // Success toast
      toast.success("Login successful!");
      
      // Navigate based on role after a short delay to show success message
      setTimeout(() => {
        const userRole = result.user.role.toLowerCase();
        switch (userRole) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "staff":
            navigate("/staff/tablesmanagement");
            break;
          case "user":
            navigate("/user/booktable");
            break;
          default:
            navigate("/");
        }
      }, 1000);
      
    } catch (error) {
      // Error toast
      toast .error(error || "Login failed. Please try again.");
    }
  };

  // Load remembered email if exists
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Clear error messages on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && role) {
      const userRole = role.toLowerCase();
      switch (userRole) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "staff":
          navigate("/staff/tablesmanagement");
          break;
        case "user":
          navigate("/user/booktable");
          break;
        default:
          navigate("/");
      }
    }
  }, [user, role, navigate]);

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div
        className="card shadow-lg w-100"
        style={{ maxWidth: "1000px", borderRadius: "2rem" }}
      >
        <div className="row g-0">
          {/* Left: Form */}
          <div className="col-12 col-md-6 p-5 text-center">
            <div className="d-flex justify-content-center align-items-center mb-4">
              <img
                src="https://i.postimg.cc/mZHz3k1Q/Whats-App-Image-2025-07-23-at-12-38-03-add5b5dd-removebg-preview-1.png"
                alt="logo"
                className="navbar-logo m-2"
                style={{ height: "50px" }}
              />
            </div>

            <h2 className="h5 text-secondary mt-3">Welcome Back!</h2>
            <p className="text-muted mb-4">Login to access your dashboard</p>

            {/* Display error message if any */}
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="mb-3 position-relative">
                <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="email"
                  className="form-control ps-5"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="mb-3 position-relative">
                <i className="bi bi-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control ps-5 pe-5"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="3"
                  disabled={loading}
                />
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"
                    } position-absolute top-50 end-0 translate-middle-y me-3 text-secondary cursor-pointer`}
                  role="button"
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>

              {/* Remember / Forgot */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember Me
                  </label>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="text-decoration-none" 
                  style={{ color: "#1f2937" }}
                >
                  Forgot Password?
                </Link>
              </div>

                  <div className="role-buttons d-flex justify-content-center gap-2 gap-md-3 mt-4 flex-wrap">
        <button
          type="button"
          className={`btn border-warning  rounded mb-2  ${roleSelected === "admin" ? "selected-admin" : "outline-admin"}`}
          onClick={() => setRole("admin")}
        >
          Admin
        </button>
        <button
          type="button"
          className={`btn border-success  rounded mb-2  ${roleSelected === "staff" ? "selected-user" : "outline-user"}`}
          onClick={() => setRole("staff")}
        >
          Staff
        </button>
        <button
          type="button"
          className={`btn btn border-danger  rounded mb-2  ${roleSelected === "user" ? "selected-seller" : "outline-seller"}`}
          onClick={() => setRole("user")}
        >
          User
        </button>
      
      </div>

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-warning w-100 text-white fw-semibold mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <div className="text-center">
                <span className="text-muted">Don't have an account? </span>
                <Link 
                  to="/signup" 
                  className="text-decoration-none fw-semibold" 
                  style={{ color: "#1f2937" }}
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>

          {/* Right: Image */}
          <div className="col-md-6 d-none d-md-block">
            <div className="h-100 position-relative">
              <img
                src="https://i.postimg.cc/GpVFJDn8/create-image-for-resturant-and-game-zone-pool-for-login-page-right-side-image-do-not-write-anything.jpg"
                alt="Restaurant Illustration"
                className="img-fluid h-100 w-100 object-fit-cover"
                style={{
                  borderTopRightRadius: "2rem",
                  borderBottomRightRadius: "2rem",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;