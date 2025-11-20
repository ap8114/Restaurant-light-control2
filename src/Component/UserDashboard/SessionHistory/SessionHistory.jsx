import React, { useState, useEffect } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBilliardsLine,
  RiGamepadLine,
  RiPlaystationLine,
  RiRestaurantLine,
  RiHistoryLine,
} from "react-icons/ri";
import axiosInstance from "../../../utils/axiosInstance";

const SessionHistory = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTableType, setSelectedTableType] = useState("All Table Types");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ✅ Fetch sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axiosInstance.get("/sessions/my-sessions");
        if (res.data.success && res.data.data.sessions) {
          setSessions(res.data.data.sessions);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // ✅ Map API data to UI-compatible format
  const mappedSessions = sessions.map((s) => {
    let icon;
    switch (s.table_type) {
      case "snooker":
        icon = <RiBilliardsLine className="text-warning" />;
        break;
      case "pool":
        icon = <RiGamepadLine className="text-warning" />;
        break;
      case "playstation":
        icon = <RiPlaystationLine className="text-warning" />;
        break;
      case "restaurant":
        icon = <RiRestaurantLine className="text-warning" />;
        break;
      default:
        icon = <RiBilliardsLine className="text-warning" />;
    }

    return {
      id: s.session_id,
      type: s.table_type,
      icon,
      status: s.status,
      date: new Date(s.start_time).toLocaleString(),
      duration: formatDuration(s.duration_minutes),
      cost: `$${s.session_cost}`,
    };
  });

  // ✅ Filter sessions by search & table type
  const filteredSessions = mappedSessions.filter((session) => {
    const matchesSearch =
      session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedTableType === "All Table Types" ||
      session.type.includes(selectedTableType.replace(" Table", ""));
    return matchesSearch && matchesType;
  });

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSelectedTableType("All Table Types");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "cancelled":
        return "bg-danger";
      case "extended":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  };

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = 0;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="p-3">
      {/* Page Header */}
      <div>
        <h2 className="fs-3 fw-bold mb-2 text-start">Session History</h2>
        <p className="text-muted text-start">
          View and manage your past gaming sessions
        </p>
      </div>

      {/* Filters Card */}
      <div className="card p-3 shadow-sm mb-4">
        <div className="row g-2 align-items-stretch">
          {/* Search Input */}
          <div className="col-12 col-sm-6 col-lg-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search sessions by ID, table type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Start Date */}
          <div className="col-6 col-sm-3 col-lg-2">
            <input type="date" className="form-control" />
          </div>

          {/* End Date */}
          <div className="col-6 col-sm-3 col-lg-2">
            <input type="date" className="form-control" />
          </div>

          {/* Clear Filters Button */}
          <div className="col-12 col-sm-6 col-lg-2">
            <button className="btn btn-light w-100" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">Loading sessions...</div>
      ) : currentData.length > 0 ? (
        <>
          {currentData.map((session, index) => (
            <div
              key={index}
              className="card mb-2 p-3 shadow-sm border-0 rounded-3"
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div className="d-flex gap-3 align-items-start">
                  <div className="bg-warning bg-opacity-10 rounded-3 p-3 d-flex align-items-center justify-content-center">
                    {session.icon}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{session.type}</h6>
                    <div className="small text-muted mb-1">
                      Session ID: {session.id}
                    </div>
                    <span
                      className={`badge text-capitalize ${getStatusClass(
                        session.status
                      )} text-white`}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-4 text-muted small">
                  <div>
                    <div className="fw-semibold text-dark">{session.date}</div>
                    <div>Date & Time</div>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">
                      {session.duration}
                    </div>
                    <div>Duration</div>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">{session.cost}</div>
                    <div>Total Cost</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="small text-muted">
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredSessions.length)} of{" "}
              {filteredSessions.length} sessions
            </div>
            <div className="d-flex gap-1">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <RiArrowLeftLine />
              </button>

              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={`btn btn-sm ${currentPage === idx + 1
                    ? "btn-warning"
                    : "btn-outline-secondary"
                    }`}
                  onClick={() => handlePageChange(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <RiArrowRightLine />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-5 bg-white rounded-3 shadow-sm">
          <div
            className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: "96px", height: "96px" }}
          >
            <RiHistoryLine className="fs-1 text-muted" />
          </div>
          <h5 className="fw-bold">No sessions found</h5>
          <p className="text-muted small mb-3">
            Try adjusting your filters or search terms
          </p>
          <button className="btn btn-warning" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
