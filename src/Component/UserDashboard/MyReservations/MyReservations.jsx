import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  RiTimeLine,
  RiBilliardsLine,
  RiGamepadLine,
  RiRestaurantLine,
  RiErrorWarningLine,
  RiCalendarScheduleLine,
  RiCalendarLine,
  RiMapPinLine,
} from "react-icons/ri";
import { apiUrl } from "../../../utils/config";
import axiosInstance from "../../../utils/axiosInstance";
// import 'bootstrap/dist/css/bootstrap.min.css';

const MyReservations = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState("");
  const [selectedDate, setSelectedDate] = useState("20");
  const [selectedTime, setSelectedTime] = useState("2:00 PM");
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get(
          `/reservations/my-reservations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setReservations(res.data.data.reservations || []);
      } catch (error) {
        setReservations([]);
      }
    };
    fetchReservations();
  }, []);

  const timeSlots = [
    "10:00 AM",
    "12:00 PM",
    "2:00 PM",
    "4:00 PM",
    "6:00 PM",
    "8:00 PM",
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = [
    { day: "29", disabled: true },
    { day: "30", disabled: true },
    { day: "31", disabled: true },
    ...Array.from({ length: 28 }, (_, i) => ({
      day: (i + 1).toString(),
      disabled: false,
    })),
  ];

  const handleCancelClick = (bookingId) => {
    setCurrentBookingId(bookingId);
    setShowCancelModal(true);
  };

  const handleRescheduleClick = (bookingId) => {
    setCurrentBookingId(bookingId);
    setShowRescheduleModal(true);
  };

  const handleDateSelect = (day) => {
    if (!day.disabled) {
      setSelectedDate(day.day);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="mb-2">
        <div className="d-flex align-items-center gap-3">
          <h1 className="text-dark fs-3 fw-bold">My Reservations</h1>
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="row g-3">
        {reservations
          .filter((item) => item.status === "confirmed" || item.status === "arrived")
          .map((reservation) => (
            <div key={reservation.id} className="col-12 col-lg-6">
              <div className="card shadow-sm h-100 position-relative overflow-hidden">
                <div className="card-body">
                  {/* Header Section */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="bg-light rounded p-2 d-flex align-items-center justify-content-center"
                        style={{ width: "48px", height: "48px" }}
                      >
                        {/* Icon based on table_type */}
                        {reservation.table_type === "snooker" && (
                          <RiBilliardsLine className="text-success fs-4" />
                        )}
                        {reservation.table_type === "pool" && (
                          <RiBilliardsLine className="text-warning fs-4" />
                        )}
                        {reservation.table_type === "playstation" && (
                          <RiGamepadLine className="text-info fs-4" />
                        )}
                        {reservation.table_type === "restaurant" && (
                          <RiRestaurantLine className="text-primary fs-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="card-title fs-5 fw-semibold text-dark mb-0">
                          {reservation.table_name}
                        </h3>
                        <p className="text-muted small mb-0">
                          Booking ID: #{reservation.reservation_id}
                        </p>
                      </div>
                    </div>

                    <span className="badge rounded-pill bg-secondary px-3 py-1 text-capitalize">
                      {reservation.status}
                    </span>
                  </div>

                  {/* Customer Details */}
                  <div className="mb-4">
                    <div className="mb-2">
                      <span className="text-muted small d-block">Name</span>
                      <span className="fw-semibold text-dark">
                        {reservation.customer_name}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted small d-block">Phone No</span>
                      <span className="fw-semibold text-dark">
                        {reservation.customer_phone}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted small d-block">Email</span>
                      <span className="fw-semibold text-dark">
                        {reservation.customer_email}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <RiCalendarLine className="text-muted" />
                      <span className="text-dark small">
                        {new Date(
                          reservation.reservation_date
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <RiTimeLine className="text-muted" />
                      <span className="text-dark small">
                        {reservation.reservation_time?.slice(0, 5)}{" "}
                        {/* HH:MM */}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <RiMapPinLine className="text-muted" />
                      <span className="text-dark small">
                        {reservation.table_number} {reservation.table_name}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-danger btn-sm flex-grow-1 rounded-pill"
                      onClick={() => handleCancelClick(reservation.id)}
                      disabled={reservation.status === "cancelled"}
                    >
                      Cancel Booking
                    </button>
                    <button
                      className="btn btn-warning btn-sm flex-grow-1 rounded-pill"
                      onClick={() => handleRescheduleClick(reservation.id)}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                    <RiErrorWarningLine className="text-danger fs-4" />
                  </div>
                  <h3 className="modal-title fs-5 fw-semibold text-dark">
                    Cancel Booking
                  </h3>
                </div>
                <p className="text-muted mb-4">
                  Are you sure you want to cancel this booking? This action
                  cannot be undone.
                </p>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary flex-grow-1 rounded-pill"
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Booking
                  </button>
                  <button
                    className="btn btn-danger flex-grow-1 rounded-pill"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        await axios.patch(
                          // `https://restaurant-backend-production-a63a.up.railway.app/api/reservations/${currentBookingId}/cancel`,
                          `${apiUrl}/reservations/${currentBookingId}/cancel`,
                          {},
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );
                        setShowCancelModal(false);
                        // Refresh reservations after cancel
                        const res = await axios.get(
                          // 'https://restaurant-backend-production-a63a.up.railway.app/api/reservations/my-reservations',
                          `${apiUrl}/reservations/my-reservations`,
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );
                        setReservations(res.data.data.reservations || []);
                      } catch (error) {
                        alert("Failed to cancel booking!");
                        setShowCancelModal(false);
                      }
                    }}
                    disabled={
                      !!reservations.find(
                        (r) =>
                          (r.id === currentBookingId ||
                            r.id === Number(currentBookingId)) &&
                          r.status === "cancelled"
                      )
                    }
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                    <RiCalendarScheduleLine className="text-primary fs-4" />
                  </div>
                  <h3 className="modal-title fs-5 fw-semibold text-dark">
                    Reschedule Booking
                  </h3>
                </div>

                <div className="mb-4">
                  <label className="form-label">Select New Date</label>
                  <div className="d-flex flex-wrap mb-2">
                    {weekdays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-muted small"
                        style={{ width: "14.28%" }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="d-flex flex-wrap">
                    {calendarDays.map((dayObj, index) => (
                      <div
                        key={index}
                        className={`text-center small py-2 ${dayObj.disabled ? "text-muted" : "text-dark"
                          } ${dayObj.day === selectedDate
                            ? "bg-warning text-dark rounded fw-medium"
                            : ""
                          }`}
                        style={{
                          width: "14.28%",
                          cursor: dayObj.disabled ? "default" : "pointer",
                        }}
                        onClick={() =>
                          !dayObj.disabled && handleDateSelect(dayObj)
                        }
                      >
                        {dayObj.day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Available Time Slots</label>
                  <div className="row g-2">
                    {timeSlots.map((time) => (
                      <div key={time} className="col-4 col-md-3">
                        <button
                          className={`btn btn-sm w-100 ${time === selectedTime
                            ? "btn-warning"
                            : "btn-outline-secondary"
                            }`}
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary flex-grow-1 rounded-pill"
                    onClick={() => setShowRescheduleModal(false)}
                    disabled={reservations.status == "cancelled"}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-warning flex-grow-1 rounded-pill"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        // Find the reservation object to get all required fields
                        const reservation = reservations.find(
                          (r) =>
                            r.id === currentBookingId ||
                            r.id === Number(currentBookingId)
                        );
                        if (!reservation) {
                          alert("Reservation not found!");
                          return;
                        }

                        // Prepare updated data (update only date/time, keep other fields same)
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(selectedDate).padStart(2, "0");
                        const reservation_date = `${year}-${month}-${day}`;

                        // Convert time to "HH:MM" 24hr format
                        const [time, modifier] = selectedTime.split(" ");
                        let [hours, minutes] = time.split(":");
                        if (modifier === "PM" && hours !== "12") {
                          hours = String(parseInt(hours, 10) + 12);
                        } else if (modifier === "AM" && hours === "12") {
                          hours = "00";
                        }
                        const reservation_time = `${hours}:${minutes}`;

                        // Prepare payload with all required fields
                        const payload = {
                          table_id: reservation.table_id,
                          customer_name: reservation.customer_name,
                          customer_phone: reservation.customer_phone,
                          customer_email: reservation.customer_email,
                          reservation_date,
                          reservation_time,
                          duration_hours: reservation.duration_hours,
                          party_size: reservation.party_size,
                          special_requests: reservation.special_requests,
                        };

                        await axios.put(
                          // `https://restaurant-backend-production-a63a.up.railway.app/api/reservations/${currentBookingId}`,
                          `${apiUrl}/reservations/${currentBookingId}`,
                          payload,
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );

                        // Set status to confirmed using the status API
                        await axios.patch(
                          // `https://restaurant-backend-production-a63a.up.railway.app/api/reservations/${currentBookingId}/status`,
                          `${apiUrl}/reservations/${currentBookingId}/status`,
                          { status: "confirmed" },
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );

                        setShowRescheduleModal(false);
                        // Refresh reservations after update
                        const res = await axios.get(
                          // 'https://restaurant-backend-production-a63a.up.railway.app/api/reservations/my-reservations',
                          `${apiUrl}/reservations/my-reservations`,
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );
                        setReservations(res.data.data.reservations || []);
                      } catch (error) {
                        alert("Failed to reschedule booking!");
                        setShowRescheduleModal(false);
                      }
                    }}
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
