import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { apiUrl } from '../utils/config';
import { toast } from 'react-toastify';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Generic input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await axiosInstance.get(`/auth/profile`);
        if (userData.data?.success) {
          const { name, email, phone } = userData.data.data.user;
          setFormData((prev) => ({
            ...prev,
            name: name || '',
            email: email || '',
            phone: phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error(error.response?.data?.message || 'Failed to load profile.');
      }
    };
    fetchUserData();
  }, []);

  // Profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      phone: formData.phone,
      name: formData.name
    };

    try {
      const response = await axiosInstance.put(`/auth/profile`, payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    const payload = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    };

    try {
      const response = await axiosInstance.put(`/auth/change-password`, payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Password updated successfully!');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast.error(response.data.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">User Profile</h2>

      {/* Profile Info */}
      <form onSubmit={handleProfileUpdate} className="mb-5">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            readOnly
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input
            type="text"
            className="form-control"
            name="phone"   // ✅ fixed
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
          />
        </div>

        <button type="submit" className="btn btn-warning text-white">
          Update Profile
        </button>
      </form>

      {/* Password Update */}
      <h4 className="mb-3">Change Password</h4>
      <form onSubmit={handlePasswordUpdate}>
        <div className="mb-3">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-control"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" className="btn btn-success">
          Update Password
        </button>
      </form>
    </div>
  );
};

export default Profile;
