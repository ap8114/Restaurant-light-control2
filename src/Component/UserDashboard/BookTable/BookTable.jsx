import React, { use, useEffect, useState } from "react";
import axios from "axios";
import Calendar from './Calendar';
import {
  RiBilliardsLine,
  RiBasketballLine,
  RiGamepadLine,
  RiRestaurantLine,
} from "react-icons/ri";
import { apiUrl } from "../../../utils/config";
import { useNavigate } from "react-router-dom";

const BookTable = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [smsNotification, setSmsNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [reservationData, setReservationData] = useState(null);
  const [duration, setDuration] = useState(2);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Get user data from localStorage and populate form
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setFullName(user.name || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phone || "");
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
  }, []);

  // Fetch business settings
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await axios.get(`${apiUrl}/business_settings`);
        if (response.data.success) {
          setBusinessSettings(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching business settings:", error);
      }
    };

    fetchBusinessSettings();
  }, []);

  // Generate time slots based on selected date and business settings
  useEffect(() => {
    if (selectedDate && businessSettings) {
      generateTimeSlots();
      fetchBookedSlots();
    }
  }, [selectedDate, businessSettings]);

  const generateTimeSlots = () => {
    if (!businessSettings) return;

    const dayOfWeek = selectedDate.getDay();
    let startTime, endTime;

    if (dayOfWeek === 0) { // Sunday
      startTime = businessSettings.sunday_start;
      endTime = businessSettings.sunday_end;
    } else if (dayOfWeek === 6) { // Saturday
      startTime = businessSettings.saturday_start;
      endTime = businessSettings.saturday_end;
    } else { // Weekday
      startTime = businessSettings.weekdays_start;
      endTime = businessSettings.weekdays_end;
    }

    // Parse times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const slots = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Generate hourly slots
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip past hours if it's today
      if (isToday && hour <= now.getHours()) continue;

      const formattedHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push(`${formattedHour}:00 ${ampm}`);
    }

    setTimeSlots(slots);
  };

  const fetchBookedSlots = async () => {
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/reservations/booked-slots?date=${formattedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Convert 24h format to 12h format with AM/PM
        const booked = response.data.data.map(slot => {
          const [hour, minute] = slot.split(':');
          const hour12 = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          return `${hour12}:${minute} ${ampm}`;
        });
        setBookedSlots(booked);
      }
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    }
  };

  // Fetch available tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `${apiUrl}/tables/available?date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.success) {
          const mappedData = response.data.data.tables.map((table) => ({
            id: table.id,
            name: table.table_name,
            description: `${table.group_name} • Capacity: ${table.capacity} • ${table.location}`,
            price: table.hourly_rate
              ? `$${table.hourly_rate}/hour`
              : "Rate not set",
            icon: <RiRestaurantLine />,
            color: "warning",
            tableNumber: table.table_number || table.table_name,
          }));
          setTables(mappedData);
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateForm = () => {
    const nameValid = fullName.trim() !== "";
    const phoneValid = /^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.trim());
    setNameError(!nameValid);
    setPhoneError(!phoneValid);
    return nameValid && phoneValid;
  };

  const convertTimeTo24HourFormat = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') {
      hours = parseInt(hours, 10) + 12;
    } else if (modifier === 'AM' && hours === '12') {
      hours = '00';
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const convertDateFormat = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setBookingError("");
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setBookingError("You are not logged in. Please log in to confirm your booking.");
        setIsLoading(false);
        return;
      }
      if (!selectedTableId) {
        setBookingError("Please select a table.");
        setIsLoading(false);
        return;
      }

      const reservationData = {
        table_id: selectedTableId,
        customer_name: fullName,
        customer_phone: phoneNumber,
        customer_email: email,
        reservation_date: convertDateFormat(selectedDate),
        reservation_time: convertTimeTo24HourFormat(selectedTime),
        duration_hours: duration,
        party_size: partySize,
        special_requests: specialRequests,
      };

      const response = await axios.post(
        `${apiUrl}/reservations`,
        reservationData,
        {
          headers: {
            Authorization: `Bearer ${token.replace(/^"(.*)"$/, '$1')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setReservationData(response.data);
      alert("Booking confirmed!");
      navigate("/user/myreservations");
    } catch (error) {
      if (
        error.response &&
        (error.response.data?.message === "Access denied. No token provided." ||
          error.response.data?.message === "Invalid token." ||
          error.response.data?.message === "jwt expired" ||
          error.response.data?.message === "jwt malformed")
      ) {
        setBookingError("Session expired or invalid. Please log in again.");
      } else if (
        error.response &&
        error.response.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        setBookingError(error.response.data.errors.map(e => e.msg).join(", "));
      } else if (
        error.response &&
        error.response.data?.message === "Table not found or not available"
      ) {
        setBookingError("Selected table is not available. Please choose another table or time.");
      } else {
        setBookingError("Failed to make reservation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeInfo = (type) => {
    return tables.find((t) => t.id === type) || tables[0];
  };

  const getOperatingHours = (date) => {
    if (!businessSettings) return 'Loading...';
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      return `${businessSettings.sunday_start.slice(0, 5)} - ${businessSettings.sunday_end.slice(0, 5)}`;
    } else if (dayOfWeek === 6) {
      return `${businessSettings.saturday_start.slice(0, 5)} - ${businessSettings.saturday_end.slice(0, 5)}`;
    } else {
      return `${businessSettings.weekdays_start.slice(0, 5)} - ${businessSettings.weekdays_end.slice(0, 5)}`;
    }
  };

  if (loading) {
    return <p className="text-center my-5">Loading available tables...</p>;
  }

  return (
    <div className="p-3">
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div>
              <h1 className="h2 fw-bold text-dark">Book a Table</h1>
              <p className="text-muted mb-0">
                Reserve your preferred gaming table or dining spot
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div
              className="d-flex flex-wrap gap-3 justify-content-start justify-content-md-between"
              style={{ maxWidth: "100%" }}
            >
              {[
                { step: 1, label: "Choose Type" },
                { step: 2, label: "Select Time" },
                { step: 3, label: "Enter Details" },
                { step: 4, label: "Confirm" },
              ].map((item, index, arr) => (
                <div
                  key={item.step}
                  className={`d-flex flex-column flex-lg-row align-items-center ${currentStep > item.step ? "text-dark" : "text-muted"
                    }`}
                >
                  <div className="d-flex flex-column flex-lg-row align-items-center text-center text-lg-start">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mx-lg-0 ${currentStep >= item.step ? "bg-warning text-dark" : "bg-light text-muted"
                        }`}
                      style={{ width: "32px", height: "32px" }}
                    >
                      {item.step}
                    </div>
                    <span className="mt-1 mt-lg-0 ms-lg-2 small fw-medium">{item.label}</span>
                  </div>
                  {index !== arr.length - 1 && (
                    <div
                      className={`d-none d-lg-block mx-lg-2 ${currentStep > item.step ? "bg-warning" : "bg-dark"
                        }`}
                      style={{ height: "2px", width: "245px" }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-grow-1 overflow-auto p-4">
          {/* Step 1: Choose Type */}
          <div className={currentStep === 1 ? "" : "d-none"}>
            <div className="mb-4">
              <h2 className="h5 fw-semibold text-dark">Choose Table Type</h2>
              <p className="text-muted">
                Select the type of table you'd like to book
              </p>
            </div>
            <div className="row g-4">
              {tables.map((table) => (
                <div key={table.id} className="col-md-6 col-lg-3">
                  <div
                    className={`card h-100 cursor-pointer ${selectedTableId === table.id
                      ? "border-warning bg-warning bg-opacity-10"
                      : ""
                      }`}
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setSelectedType(table.id);
                    }}
                  >
                    <div
                      className={`card-body text-center bg-${table.color}-100 rounded-3 p-4 mx-auto my-3`}
                      style={{ width: "64px", height: "64px" }}
                    >
                      {React.cloneElement(table.icon, {
                        className: `text-${table.color} fs-4`,
                      })}
                    </div>
                    <div className="card-body text-center">
                      <h5 className="card-title">{table.name}</h5>
                      <p className="card-text text-muted small">
                        {table.description}
                      </p>
                      <p className="text-warning fw-semibold">{table.price}</p>
                    </div>
                  </div>
                </div>
              ))}
              {tables.length === 0 && (
                <div className="col-12">
                  <p className="text-center text-muted">No tables available.</p>
                </div>
              )}
            </div>
            <div className="mt-4 d-flex justify-content-end">
              <button
                className="btn btn-warning text-dark px-4 py-2 fw-semibold"
                onClick={handleNextStep}
                disabled={!selectedTableId}
              >
                Continue to Time Selection
              </button>
            </div>
          </div>

          {/* Step 2: Select Time */}
          <div className={currentStep === 2 ? "" : "d-none"}>
            <div className="mb-4">
              <h2 className="h5 fw-semibold text-dark">Select Date & Time</h2>
              <p className="text-muted">
                Choose your preferred date and time slot
              </p>
            </div>
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card">
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    businessSettings={businessSettings}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h3 className="h6 fw-semibold text-dark mb-3">
                      Available Time Slots
                    </h3>
                    {businessSettings ? (
                      <>
                        <div className="mb-3">
                          <small className="text-muted">
                            Business Hours: {getOperatingHours(selectedDate)}
                          </small>
                        </div>
                        <div className="row row-cols-3 g-2">
                          {timeSlots.length > 0 ? (
                            timeSlots.map((slot) => {
                              const isBooked = bookedSlots.includes(slot);
                              const isSelected = selectedTime === slot;
                              return (
                                <div key={slot} className="col">
                                  <button
                                    className={`btn w-100 btn-sm ${isSelected
                                      ? "btn-warning"
                                      : isBooked
                                        ? "btn-light text-muted disabled"
                                        : "btn-outline-secondary"
                                      }`}
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(slot)}
                                  >
                                    {slot}
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-12">
                              <p className="text-center text-muted">No available time slots for this date</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-muted">Loading business hours...</p>
                    )}
                    <div className="mt-3 d-flex gap-3 small">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="border rounded"
                          style={{ width: "16px", height: "16px" }}
                        ></div>
                        <span className="text-muted">Available</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-light rounded"
                          style={{ width: "16px", height: "16px" }}
                        ></div>
                        <span className="text-muted">Booked</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-warning rounded"
                          style={{ width: "16px", height: "16px" }}
                        ></div>
                        <span className="text-muted">Selected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 d-flex justify-content-between">
              <button
                className="btn btn-light text-dark px-4 py-2 fw-semibold"
                onClick={handleBackStep}
              >
                Back to Table Selection
              </button>
              <button
                className="btn btn-warning text-dark px-4 py-2 fw-semibold"
                onClick={handleNextStep}
                disabled={!selectedTime}
              >
                Continue to Details
              </button>
            </div>
          </div>

          {/* Step 3: Enter Details */}
          <div className={currentStep === 3 ? "" : "d-none"}>
            <div className="mb-4">
              <h2 className="h5 fw-semibold text-dark">Personal Details</h2>
              <p className="text-muted">
                Please provide your contact information
              </p>
            </div>
            <div className="card" style={{ maxWidth: "500px" }}>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  {nameError && (
                    <div className="invalid-feedback">
                      Please enter your full name
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className={`form-control ${phoneError ? "is-invalid" : ""}`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  {phoneError && (
                    <div className="invalid-feedback">
                      Please enter a valid phone number
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Party Size</label>
                  <select
                    className="form-control"
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Duration (hours)</label>
                  <select
                    className="form-control"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} hour{num !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Special Requests (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 d-flex justify-content-between">
              <button
                className="btn btn-light text-dark px-4 py-2 fw-semibold"
                onClick={handleBackStep}
              >
                Back to Time Selection
              </button>
              <button
                className="btn btn-warning text-dark px-4 py-2 fw-semibold"
                onClick={() => {
                  if (validateForm()) {
                    handleNextStep();
                  }
                }}
              >
                Review Booking
              </button>
            </div>
          </div>

          {/* Step 4: Confirm Booking */}
          <div className={currentStep === 4 ? "" : "d-none"}>
            <div className="mb-4">
              <h2 className="h5 fw-semibold text-dark">Confirm Your Booking</h2>
              <p className="text-muted">
                Please review your booking details before confirming
              </p>
            </div>
            {bookingError && (
              <div className="alert alert-danger" role="alert">
                {bookingError}
              </div>
            )}
            <div className="card" style={{ maxWidth: "600px" }}>
              <div className="card-body">
                <h3 className="h6 fw-semibold text-dark mb-3">
                  Booking Summary
                </h3>
                <div className="mb-4">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <div
                      className={`bg-${getTypeInfo(selectedType)?.color || 'warning'}-100 rounded p-3 me-3`}
                    >
                      {React.cloneElement(getTypeInfo(selectedType)?.icon || <RiRestaurantLine />, {
                        className: `text-${getTypeInfo(selectedType)?.color || 'warning'} fs-4`,
                      })}
                    </div>
                    <div>
                      <h5 className="fw-semibold mb-1">
                        {getTypeInfo(selectedType)?.name || 'Selected Table'}
                      </h5>
                      <p className="text-muted small mb-0">
                        {getTypeInfo(selectedType)?.price || 'Price not set'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Date:</span>
                    <span className="fw-medium">{selectedDate.toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Time:</span>
                    <span className="fw-medium">{selectedTime}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Duration:</span>
                    <span className="fw-medium">{duration} hour{duration !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Name:</span>
                    <span className="fw-medium">{fullName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phone:</span>
                    <span className="fw-medium">{phoneNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Email:</span>
                    <span className="fw-medium">{email}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Party Size:</span>
                    <span className="fw-medium">{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                  </div>
                  {specialRequests && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Special Requests:</span>
                      <span className="fw-medium">{specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 d-flex justify-content-between">
              <button
                className="btn btn-light text-dark px-4 py-2 fw-semibold"
                onClick={handleBackStep}
                disabled={isLoading}
              >
                Back to Details
              </button>
              <button
                className="btn btn-success text-white px-4 py-2 fw-semibold"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookTable;