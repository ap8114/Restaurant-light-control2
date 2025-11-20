import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Alerts.css"
import axiosInstance from '../../../utils/axiosInstance';
const AlertsNotifications = () => {
  const [notifications, setNotifications] = useState({
    tableAlerts: [],
    reservations: [],
    upcomingReservations: []
  });

  const [alertStatus, setAlertStatus] = useState({
    activeAlerts: 0,
    overdueTables: 0,
    tableTimeoutAlerts: 0,
    reservationReminders: 0,
    dueSoon: 0,
    upcoming: 0
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axiosInstance.get("/alerts");
        if (res.data.success) {
          const apiData = res.data.data;

          // format table timeout alerts
          const formattedTableAlerts = apiData.tableTimeoutAlerts.map((item, index) => ({
            id: item.reservation_id || index,
            table: `Table ${item.table_number} - ${item.table_name}`,
            location: item.location,
            message:
              item.exceeded_minutes > 0
                ? `Session exceeded by ${item.exceeded_minutes} minutes`
                : `${Math.abs(item.exceeded_minutes)} minutes remaining`,
            startTime: new Date(item.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            endTime: new Date(item.expected_end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: item.exceeded_minutes > 0 ? "OVERDUE" : "WARNING",
            color: item.exceeded_minutes > 0 ? "danger" : "warning"
          }));

          // format reservations reminders
          const formattedReservations = apiData.reservationReminders.map((item, index) => ({
            id: item.reservation_id || index,
            customer: item.customer_name,
            details: `${item.location} - Table ${item.table_number} (${item.table_name})`,
            time: new Date(item.reservation_date).toDateString() +
              " at " +
              item.reservation_time.slice(0, 5),
            arrival: `Arriving in ${item.minutes_remaining} minutes`,
            party: `Party of ${item.party_size}`,
            status: item.minutes_remaining <= 30 ? "DUE SOON" : "UPCOMING",
            color: item.minutes_remaining <= 30 ? "warning" : "primary"
          }));

          setNotifications({
            tableAlerts: formattedTableAlerts,
            reservations: formattedReservations,
            upcomingReservations: [] // keep empty since API doesn’t provide
          });

          setAlertStatus({
            activeAlerts: apiData.activeAlerts,
            overdueTables: apiData.overdueTables,
            tableTimeoutAlerts: apiData.tableTimeoutAlerts.length,
            reservationReminders: apiData.reservationReminders.length,
            dueSoon: formattedReservations.filter(r => r.status === "DUE SOON").length,
            upcoming: formattedReservations.filter(r => r.status === "UPCOMING").length
          });
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, []);

  const styles = `
    .alert-section {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .alert-item {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid;
    }
    .alert-danger {
      border-left-color: #ffffffff;
    }
    .alert-warning {
      border-left-color: #ffffffff;
    }
    .alert-primary {
      border-left-color: #ffffffff;
    }
    .alert-details {
      margin-left: 0;
      padding-left: 0;
      list-style: none;
    }
    .alert-details li {
      margin-bottom: 4px;
    }
    .stats-card {
      background-color: #f8f9fa;
      border-radius: 10px;
      border: none;
    }
    .stats-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-buttons .btn {
      flex: 1 0 auto;
      min-width: 120px;
    }
    @media (max-width: 576px) {
      .action-buttons .btn {
        min-width: 100%;
      }
    }
  `;


  return (
    <div className="container-fluid p-3">
      <style>{styles}</style>

      <h1 className="fs-3 fw-bold text-dark">Alerts & Notifications</h1>
      <p className="text-muted mb-3 mb-md-4 text-start">
        Monitor table timeouts and reservation reminders in real-time
      </p>

      {/* Stats Cards */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3 mb-4">
        <div className="col">
          <div className="card stats-card h-100 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div className="text-start">
                <h6 className="text-muted small mb-1">Active Alerts</h6>
                <h4 className="mb-0">{alertStatus.activeAlerts}</h4>
              </div>
              <div className="stats-icon" style={{ backgroundColor: "#fdecea" }}>
                <i className="ri-alarm-warning-line text-danger fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card stats-card h-100 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div className="text-start">
                <h6 className="text-muted small mb-1">Overdue Tables</h6>
                <h4 className="mb-0">{alertStatus.overdueTables}</h4>
              </div>
              <div className="stats-icon" style={{ backgroundColor: "#fdecea" }}>
                <i className="ri-time-line text-danger fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card stats-card h-100 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div className="text-start">
                <h6 className="text-muted small mb-1">Due Soon</h6>
                <h4 className="mb-0">{alertStatus.dueSoon}</h4>
              </div>
              <div className="stats-icon" style={{ backgroundColor: "#fff7e6" }}>
                <i className="ri-calendar-check-line text-warning fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card stats-card h-100 shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div className="text-start">
                <h6 className="text-muted small mb-1">Upcoming</h6>
                <h4 className="mb-0">{alertStatus.upcoming}</h4>
              </div>
              <div className="stats-icon" style={{ backgroundColor: "#e7f1ff" }}>
                <i className="ri-calendar-line text-primary fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-3 g-md-4">
        {/* Table Timeout Alerts */}
        <div className="col-12 col-lg-6">
          <div className="alert-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-bold mb-0 text-start">Table Timeout Alerts</h2>
              <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                {alertStatus.tableTimeoutAlerts} Active
              </span>
            </div>

            {notifications.tableAlerts.map(alert => (
              <div key={alert.id} className={`alert-item alert-${alert.color}`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="text-start">
                    <h5 className="fw-bold mb-1">{alert.table}</h5>
                    <p className="text-muted small mb-2">{alert.location}</p>
                  </div>
                  <span className={`badge bg-${alert.color} text-white`}>{alert.status}</span>
                </div>

                <ul className="alert-details">
                  <li className={`fw-medium text-${alert.color}`}>{alert.message}</li>
                  <li className={`small text-${alert.color}`}>
                    Started: {alert.startTime} • Expected End: {alert.endTime}
                  </li>
                </ul>

                <div className="mt-3 text-start">
                  {alert.status === "OVERDUE" ? (
                    <>
                      <h6 className="small fw-bold">Step Timer</h6>
                      <div className="action-buttons">
                        <button className={`btn btn-sm btn-${alert.color} me-2`}>
                          Extend Time
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h6 className="small fw-bold">Extend Time</h6>
                      <div className="action-buttons">
                        <button className={`btn btn-sm btn-${alert.color}`}>
                          Notify Customer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Reminders */}
        <div className="col-12 col-lg-6">
          <div className="alert-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-bold mb-0 text-start">Reservation Reminders</h2>
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                {alertStatus.reservationReminders} Pending
              </span>
            </div>

            {notifications.reservations.map(reservation => (
              <div key={reservation.id} className={`alert-item alert-${reservation.color}`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold" mb-1>
                    {reservation.customer}
                  </h5>
                  <span className={`badge bg-${reservation.color} text-white`}>
                    {reservation.status}
                  </span>
                </div>

                <ul className="alert-details">
                  <li className={`fw-medium text-${reservation.color}`}>{reservation.details}</li>
                  <li className={`text-${reservation.color}`}>Reservation: {reservation.time}</li>
                  <li className={`text-${reservation.color}`}>{reservation.party}</li>
                  <li className="fw-bold">{reservation.arrival}</li>
                </ul>

                <div className="mt-3 text-start">
                  <h6 className="small fw-bold">Mark as Arrived</h6>
                  <div className="action-buttons">
                    <button className={`btn btn-sm btn-${reservation.color}`}>
                      Mark as Handled
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Next Reservations */}
            <div className="alert-section mt-3">
              <h2 className="h5 fw-bold mb-3 text-start">Next Reservations</h2>
              <div className="card stats-card shadow-sm">
                <div className="card-body">
                  {notifications.upcomingReservations.map((res, index) => (
                    <div
                      key={index}
                      className="d-flex justify-content-between py-2 text-start"
                    >
                      <span>{res.name}</span>
                      <span className="text-muted">{res.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsNotifications;
