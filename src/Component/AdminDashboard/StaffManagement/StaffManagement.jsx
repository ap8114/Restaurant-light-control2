import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
  ListGroup,
  Alert,
  Pagination,
  Tabs,
  Tab,
} from "react-bootstrap";
import { Eye, EyeSlash, Trash, Person, Gear, Save } from "react-bootstrap-icons";
import { FaSearch, FaPlus } from "react-icons/fa";
import axiosInstance from "../../../utils/axiosInstance";
import { apiUrl } from "../../../utils/config";

// Default permissions structure matching the API
const DEFAULT_PERMISSIONS = {
  tablesManagement: {
    enabled: false,
    viewTables: false,
    manageReservations: false,
    tableStatus: false,
  },
  orderProcessing: {
    enabled: false,
    createOrders: false,
    modifyOrders: false,
    cancelOrders: false,
  },
  customerManagement: {
    enabled: false,
    addCustomer: false,
    editCustomer: false,
    removeCustomer: false,
  },
  specialPermissions: {
    enabled: false,
    voidItems: false,
    applyDiscounts: {
      itemDiscount: false,
      billDiscount: false,
      specialOffers: false,
      maxDiscount: 0,
    },
    addMenuItems: false,
    changePrices: false,
  },
};

const StaffManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [allStaff, setAllStaff] = useState([]); // All staff members
  const [filteredStaff, setFilteredStaff] = useState([]); // Filtered staff for display
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPassword, setResetPassword] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const token = localStorage.getItem("token");
  const [newStaff, setNewStaff] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "staff",
    discount_percentage: 0,
    permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS });
  const [staffMembers, setStaffMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("permissions"); // Track active tab in modal
  const [editStaffDetails, setEditStaffDetails] = useState({
    name: "",
    email: "",
    phone: "",
    discount_percentage: 0,
  });

  // Fetch staff list
  const fetchStaffList = async (pageNumber = 1) => {
    try {
      const res = await axiosInstance.get(
        `/users?page=${pageNumber}&limit=${limit}&role=staff`
      );
      if (res.data.success) {
        setStaffMembers(res.data.data.users);
        setTotalPages(res.data.data.totalPages);
        setPage(res.data.data.page);

        // Update filtered staff if search is empty
        if (searchQuery.trim() === "") {
          setFilteredStaff(res.data.data.users);
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  useEffect(() => {
    fetchStaffList(page);
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      // Apply current search filter to new page
      const startIndex = (newPage - 1) * limit;
      if (searchQuery.trim() === "") {
        const paginatedData = allStaff.slice(startIndex, startIndex + limit);
        setFilteredStaff(paginatedData);
      } else {
        const filtered = allStaff.filter(
          (staff) =>
            staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (staff.phone && staff.phone.includes(searchQuery))
        );
        const paginatedData = filtered.slice(startIndex, startIndex + limit);
        setFilteredStaff(paginatedData);
      }
    }
  };

  // search bar functionlity
  useEffect(() => {
    const fetchAllStaff = async () => {
      try {
        const res = await axiosInstance.get(`/users?role=staff&limit=1000`);
        if (res.data.success) {
          setAllStaff(res.data.data.users);
          // Initially show all staff with pagination
          const paginatedData = res.data.data.users.slice(0, limit);
          setFilteredStaff(paginatedData);
          setTotalPages(Math.ceil(res.data.data.users.length / limit));
        }
      } catch (error) {
        console.error("Error fetching all staff:", error);
      }
    };
    fetchAllStaff();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      // If search is empty, show all staff with current pagination
      const startIndex = (page - 1) * limit;
      const paginatedData = allStaff.slice(startIndex, startIndex + limit);
      setFilteredStaff(paginatedData);
      setTotalPages(Math.ceil(allStaff.length / limit));
    } else {
      // Filter from all staff data and apply current pagination
      const filtered = allStaff.filter(
        (staff) =>
          staff.name.toLowerCase().includes(query.toLowerCase()) ||
          staff.email.toLowerCase().includes(query.toLowerCase()) ||
          (staff.phone && staff.phone.includes(query))
      );
      const startIndex = (page - 1) * limit;
      const paginatedData = filtered.slice(startIndex, startIndex + limit);
      setFilteredStaff(paginatedData);
      setTotalPages(Math.ceil(filtered.length / limit));
    }
  };

  // access management staff selection drop down all staff members
  const fetchAllStaff = async () => {
    try {
      const res = await axiosInstance.get(`/users?role=staff&limit=1000`);
      if (res.data.success) {
        setAllStaff(res.data.data.users);
      }
    } catch (error) {
      console.error("Error fetching all staff:", error);
    }
  };

  useEffect(() => {
    fetchAllStaff();
  }, []);

  // Load permissions and staff details when staff is selected
  useEffect(() => {
    if (selectedStaff) {
      const staff = [...staffMembers, ...allStaff].find((s) => s.id === selectedStaff);
      if (staff) {
        setPermissions(staff.permissions || { ...DEFAULT_PERMISSIONS });
        setEditStaffDetails({
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          discount_percentage: staff.discount_percentage || 0,
        });
      }
    }
  }, [selectedStaff, staffMembers, allStaff]);

  const handleEditClick = (staff) => {
    setSelectedStaff(staff.id);
    setPermissions(staff.permissions || { ...DEFAULT_PERMISSIONS });
    setEditStaffDetails({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      discount_percentage: staff.discount_percentage || 0,
    });
    setShowModal(true);
    setActiveTab("permissions"); // Default to permissions tab
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setNewStaff((prev) => ({ ...prev, discount_percentage: value }));
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPassword((prev) => ({ ...prev, [name]: value }));
  };

  // Handle changes to staff details in the edit form
  const handleStaffDetailChange = (e) => {
    const { name, value } = e.target;
    setEditStaffDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (section, field, value, subField = null) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      // Ensure the section exists (fallback to default)
      if (!newPermissions[section]) {
        newPermissions[section] = { ...DEFAULT_PERMISSIONS[section] };
      }
      // If this field is an object (like applyDiscounts), ensure it exists
      if (
        typeof DEFAULT_PERMISSIONS[section][field] === "object" &&
        !Array.isArray(DEFAULT_PERMISSIONS[section][field]) &&
        !newPermissions[section][field]
      ) {
        newPermissions[section][field] = {
          ...DEFAULT_PERMISSIONS[section][field],
        };
      }
      if (subField) {
        newPermissions[section][field][subField] = value;
      } else {
        newPermissions[section][field] = value;
      }
      return newPermissions;
    });
  };

  const handleSave = async () => {
    try {
      const staff = [...staffMembers, ...allStaff].find((s) => s.id === selectedStaff);
      if (!staff) {
        toast.error("Staff member not found");
        return;
      }
      // Convert discount_percentage to number
      const discountPercentage = parseFloat(editStaffDetails.discount_percentage) || 0;
      const staffData = {
        name: editStaffDetails.name,
        email: editStaffDetails.email,
        phone: editStaffDetails.phone,
        role: "staff",
        status: staff.status || "active", // Include status if required
        discount_percentage: discountPercentage, // Ensure it's a number
        permissions: permissions,
      };

      // Log the data to check its structure
      console.log("Sending data:", staffData);
      const res = await axiosInstance.put(`/users/${selectedStaff}`, staffData);
      if (res.data.success) {
        toast.success("Staff details and permissions updated successfully!");
        setShowModal(false);

        // Refresh both staff lists
        await fetchStaffList(page);
        await fetchAllStaff();
      } else {
        toast.error(res.data.message || "Failed to update staff details");
      }
    } catch (error) {
      console.error("Error updating staff details:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };

  const handleAddStaff = async () => {
    try {
      if (!token) {
        toast.error("Unauthorized! Please login as admin.");
        return;
      }
      const staffData = {
        name: newStaff.name,
        email: newStaff.email,
        password: newStaff.password,
        phone: newStaff.phone,
        role: "staff",
        discount_percentage: newStaff.discount_percentage,
        permissions: newStaff.permissions,
      };
      const res = await axios.post(
        `${apiUrl}/users`,
        staffData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Staff added successfully!");
        setShowAddModal(false);
        setNewStaff({
          name: "",
          email: "",
          password: "",
          phone: "",
          role: "staff",
          discount_percentage: 0,
          permissions: { ...DEFAULT_PERMISSIONS },
        });

        // Refresh both staff lists
        await fetchStaffList(page);
        await fetchAllStaff();
      } else {
        toast.error(res.data.message || "Failed to add staff");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };

  // Delete Staff Handler
  const handleDeleteStaff = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this staff member?"
      );
      if (!confirmDelete) return;
      await axiosInstance.delete(`/users/${id}`);

      // Refresh both staff lists
      await fetchStaffList(page);
      await fetchAllStaff();

      toast.success("Staff member deleted successfully!");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(error.response?.data?.message || "Failed to delete staff");
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const toggleResetPasswordVisibility = () => {
    setResetPasswordVisible(!resetPasswordVisible);
  };

  const getBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "primary";
      case "user":
        return "info";
      case "staff":
        return "success";
      default:
        return "secondary";
    }
  };

  const handleResetPasswordClick = (staffId) => {
    setSelectedStaff(staffId);
    setShowResetPasswordModal(true);
  };

  const submitResetPassword = async () => {
    if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
      alert("Please fill in both password fields!");
      return;
    }
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (resetPassword.newPassword.length < 6) {
      alert("Password should be at least 6 characters long!");
      return;
    }
    try {
      await axiosInstance.put(`/auth/change-password`, {
        userId: selectedStaff,
        password: resetPassword.newPassword,
      });
      alert(`Password has been reset successfully!`);
      setShowResetPasswordModal(false);
      setResetPassword({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password. Please try again.");
    }
  };

  const renderPermissionControls = () => {
    if (!selectedStaff)
      return (
        <Alert variant="info" className="mt-3">
          Please select a staff member to manage their permissions
        </Alert>
      );
    const staff = [...staffMembers, ...allStaff].find((s) => s.id === selectedStaff);
    if (!staff) return null;
    return (
      <Row className="g-4 mb-4">
        {/* Tables Management */}
        <Col xs={12} md={6} lg={4}>
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Tables Management</h6>
                <Form.Check
                  type="switch"
                  checked={permissions.tablesManagement?.enabled}
                  onChange={(e) =>
                    handlePermissionChange(
                      "tablesManagement",
                      "enabled",
                      e.target.checked
                    )
                  }
                />
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="View Tables"
                    checked={permissions.tablesManagement?.viewTables}
                    onChange={(e) =>
                      handlePermissionChange(
                        "tablesManagement",
                        "viewTables",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.tablesManagement?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Manage Reservations"
                    checked={permissions.tablesManagement?.manageReservations}
                    onChange={(e) =>
                      handlePermissionChange(
                        "tablesManagement",
                        "manageReservations",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.tablesManagement?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Table Status"
                    checked={permissions.tablesManagement?.tableStatus}
                    onChange={(e) =>
                      handlePermissionChange(
                        "tablesManagement",
                        "tableStatus",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.tablesManagement?.enabled}
                  />
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        {/* Order Processing */}
        <Col xs={12} md={6} lg={4}>
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Order Processing</h6>
                <Form.Check
                  type="switch"
                  checked={permissions.orderProcessing?.enabled}
                  onChange={(e) =>
                    handlePermissionChange(
                      "orderProcessing",
                      "enabled",
                      e.target.checked
                    )
                  }
                />
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Create Orders"
                    checked={permissions.orderProcessing?.createOrders}
                    onChange={(e) =>
                      handlePermissionChange(
                        "orderProcessing",
                        "createOrders",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.orderProcessing?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Modify Orders"
                    checked={permissions.orderProcessing?.modifyOrders}
                    onChange={(e) =>
                      handlePermissionChange(
                        "orderProcessing",
                        "modifyOrders",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.orderProcessing?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Cancel Orders"
                    checked={permissions.orderProcessing?.cancelOrders}
                    onChange={(e) =>
                      handlePermissionChange(
                        "orderProcessing",
                        "cancelOrders",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.orderProcessing?.enabled}
                  />
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        {/* Customer Management */}
        <Col xs={12} md={6} lg={4}>
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Customer Management</h6>
                <Form.Check
                  type="switch"
                  checked={permissions.customerManagement?.enabled}
                  onChange={(e) => handlePermissionChange('customerManagement', 'enabled', e.target.checked)}
                />
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Add Customer"
                    checked={permissions.customerManagement?.addCustomer}
                    onChange={(e) => handlePermissionChange('customerManagement', 'addCustomer', e.target.checked)}
                    disabled={!permissions.customerManagement?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Edit Customer"
                    checked={permissions.customerManagement?.editCustomer}
                    onChange={(e) => handlePermissionChange('customerManagement', 'editCustomer', e.target.checked)}
                    disabled={!permissions.customerManagement?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Remove Customer"
                    checked={permissions.customerManagement?.removeCustomer}
                    onChange={(e) => handlePermissionChange('customerManagement', 'removeCustomer', e.target.checked)}
                    disabled={!permissions.customerManagement?.enabled}
                  />
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        {/* Special Permissions */}
        <Col xs={12} md={6} lg={4}>
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Special Permissions</h6>
                <Form.Check
                  type="switch"
                  checked={permissions.specialPermissions?.enabled}
                  onChange={(e) =>
                    handlePermissionChange(
                      "specialPermissions",
                      "enabled",
                      e.target.checked
                    )
                  }
                />
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Void Items"
                    checked={permissions.specialPermissions?.voidItems}
                    onChange={(e) =>
                      handlePermissionChange(
                        "specialPermissions",
                        "voidItems",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.specialPermissions?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Apply Discounts"
                    checked={
                      permissions.specialPermissions?.applyDiscounts
                        ?.itemDiscount ||
                      permissions.specialPermissions?.applyDiscounts
                        ?.billDiscount ||
                      permissions.specialPermissions?.applyDiscounts
                        ?.specialOffers
                    }
                    onChange={(e) => {
                      const val = e.target.checked;
                      handlePermissionChange(
                        "specialPermissions",
                        "applyDiscounts",
                        {
                          ...permissions.specialPermissions.applyDiscounts,
                          itemDiscount: val,
                          billDiscount: val,
                          specialOffers: val,
                        }
                      );
                    }}
                    disabled={!permissions.specialPermissions?.enabled}
                  />
                  {permissions.specialPermissions?.applyDiscounts && (
                    <div className="ms-4 mt-2">
                      <Form.Check
                        type="checkbox"
                        label="Item Discount"
                        checked={
                          permissions.specialPermissions.applyDiscounts
                            .itemDiscount
                        }
                        onChange={(e) =>
                          handlePermissionChange(
                            "specialPermissions",
                            "applyDiscounts",
                            {
                              ...permissions.specialPermissions.applyDiscounts,
                              itemDiscount: e.target.checked,
                            },
                            "itemDiscount"
                          )
                        }
                        disabled={!permissions.specialPermissions?.enabled}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Bill Discount"
                        checked={
                          permissions.specialPermissions.applyDiscounts
                            .billDiscount
                        }
                        onChange={(e) =>
                          handlePermissionChange(
                            "specialPermissions",
                            "applyDiscounts",
                            {
                              ...permissions.specialPermissions.applyDiscounts,
                              billDiscount: e.target.checked,
                            },
                            "billDiscount"
                          )
                        }
                        disabled={!permissions.specialPermissions?.enabled}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Special Offers"
                        checked={
                          permissions.specialPermissions.applyDiscounts
                            .specialOffers
                        }
                        onChange={(e) =>
                          handlePermissionChange(
                            "specialPermissions",
                            "applyDiscounts",
                            {
                              ...permissions.specialPermissions.applyDiscounts,
                              specialOffers: e.target.checked,
                            },
                            "specialOffers"
                          )
                        }
                        disabled={!permissions.specialPermissions?.enabled}
                      />
                      <div className="d-flex align-items-center small mt-2">
                        <span className="me-2">Max Discount:</span>
                        <Form.Select
                          size="sm"
                          value={
                            permissions.specialPermissions.applyDiscounts
                              .maxDiscount
                          }
                          onChange={(e) =>
                            handlePermissionChange(
                              "specialPermissions",
                              "applyDiscounts",
                              {
                                ...permissions.specialPermissions
                                  .applyDiscounts,
                                maxDiscount: parseInt(e.target.value),
                              },
                              "maxDiscount"
                            )
                          }
                          disabled={!permissions.specialPermissions?.enabled}
                        >
                          {[0, 5, 10, 15, 20, 25].map((val) => (
                            <option key={val} value={val}>
                              {val}%
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>
                  )}
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Add Menu Items"
                    checked={permissions.specialPermissions?.addMenuItems}
                    onChange={(e) =>
                      handlePermissionChange(
                        "specialPermissions",
                        "addMenuItems",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.specialPermissions?.enabled}
                  />
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent">
                  <Form.Check
                    type="checkbox"
                    label="Change Prices"
                    checked={permissions.specialPermissions?.changePrices}
                    onChange={(e) =>
                      handlePermissionChange(
                        "specialPermissions",
                        "changePrices",
                        e.target.checked
                      )
                    }
                    disabled={!permissions.specialPermissions?.enabled}
                  />
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render staff details editing form
  const renderStaffDetailsForm = () => {
    if (!selectedStaff) return null;
    const staff = [...staffMembers, ...allStaff].find((s) => s.id === selectedStaff);
    if (!staff) return null;
    return (
      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h6 className="mb-3">Staff Information</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editStaffDetails.name}
                      onChange={handleStaffDetailChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editStaffDetails.email}
                      onChange={handleStaffDetailChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={editStaffDetails.phone}
                      onChange={handleStaffDetailChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Percentage</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      name="discount_percentage"
                      value={editStaffDetails.discount_percentage}
                      onChange={handleStaffDetailChange}
                    />
                    <Form.Text className="text-muted">
                      Maximum discount percentage this staff can apply (0-100%)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      value={staff.role}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Control
                      type="text"
                      value={staff.status || "active"}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div>
          <h1 className="fs-3 fw-bold text-dark">Staff Management</h1>
          <p className="text-muted small mb-0">
            Manage staff members and their access permissions
          </p>
        </div>
        <div className="d-flex align-items-center mt-3 mt-md-0">
          <div className="input-group me-2">
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search staff..."
              style={{ maxWidth: "220px" }}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="warning"
            className="d-flex align-items-center"
            style={{ whiteSpace: "nowrap", gap: "0.5rem" }}
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus />
            Add New Staff
          </Button>
        </div>
      </div>
      {/* Staff List */}
      <Row className="g-4 mb-4">
        {filteredStaff.map((staff) => (
          <Col key={staff.id} xs={12} md={6} lg={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-3 me-3">
                      <Person className="text-primary" size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0">{staff.name}</h6>
                      <small className="text-muted">{staff.phone}</small>
                    </div>
                  </div>
                  <Badge bg={getBadgeVariant(staff.role)}>{staff.role}</Badge>
                </div>
                <div className="d-flex">
                  <Button
                    variant="light"
                    className="me-2 flex-grow-1 text-dark"
                    onClick={() => handleEditClick(staff)}
                  >
                    <Gear className="me-1" />
                    Manage Permissions
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => handleDeleteStaff(staff.id)}
                    disabled={staff.role.toLowerCase() === "admin"}
                  >
                    <Trash />
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline-info"
                    onClick={() => handleResetPasswordClick(staff.id)}
                    disabled={staff.role.toLowerCase() === "admin"}
                    className="w-100"
                  >
                    Reset Password
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {/* Pagination */}
      <div className="d-flex justify-content-center">
        <Pagination>
          <Pagination.Prev
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          />
          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === page}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          />
        </Pagination>
      </div>
      {/* Add Staff Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter full name"
                value={newStaff.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email address"
                value={newStaff.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={newStaff.password}
                  onChange={handleChange}
                  required
                />
                <InputGroup.Text
                  onClick={togglePasswordVisibility}
                  style={{ cursor: "pointer" }}
                >
                  {passwordVisible ? <EyeSlash /> : <Eye />}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={newStaff.phone}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Discount Percentage</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={newStaff.discount_percentage}
                onChange={handleDiscountChange}
              />
              <Form.Text className="text-muted">
                Maximum discount percentage this staff can apply (0-100%)
              </Form.Text>
            </Form.Group>
            <div className="d-flex gap-3">
              <Button
                variant="warning"
                className="text-dark flex-grow-1"
                onClick={handleAddStaff}
              >
                Save Staff
              </Button>
              <Button
                variant="outline-secondary"
                className="flex-grow-1"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Permissions Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Manage Staff –{" "}
            {[...staffMembers, ...allStaff].find((s) => s.id === selectedStaff)?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="permissions" title="Permissions">
              {selectedStaff && renderPermissionControls()}
            </Tab>
            <Tab eventKey="details" title="Edit Details">
              {selectedStaff && renderStaffDetailsForm()}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="me-1" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Reset Password Modal */}
      <Modal
        show={showResetPasswordModal}
        onHide={() => setShowResetPasswordModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStaff && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={resetPasswordVisible ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={resetPassword.newPassword}
                    onChange={handleResetPasswordChange}
                    required
                  />
                  <InputGroup.Text
                    onClick={toggleResetPasswordVisibility}
                    style={{ cursor: "pointer" }}
                  >
                    {resetPasswordVisible ? <EyeSlash /> : <Eye />}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type={resetPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={resetPassword.confirmPassword}
                  onChange={handleResetPasswordChange}
                  required
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResetPasswordModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitResetPassword}>
            Reset Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffManagement;