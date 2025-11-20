import React, { useState, useEffect } from 'react';
import {
    RiNotification3Line,
    RiNotification3Fill,
    RiInformationLine,
    RiSettings3Line,
    RiMoneyDollarCircleLine,
    RiPauseLine,
    RiStopLine,
    RiHistoryLine,
    RiTimeLine,
    RiCheckLine,
    RiCloseLine,
    RiPlayLine
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';

const SessionTracker = () => {
    // Session data state
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Timer state
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isWarningState, setIsWarningState] = useState(false);
    const [isExtended, setIsExtended] = useState(false);
    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [showNotificationDot, setShowNotificationDot] = useState(false);
    // Session control state
    const [isPaused, setIsPaused] = useState(false);

    // Format time helper
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress
    const progressPercent = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (progressPercent / 100) * circumference;

    // Pause session
    const pauseSession = async () => {
        if (!sessionData) return;

        try {
            const response = await axiosInstance.patch(`/sessions/${sessionData.id}/pause`);

            if (response.data.success) {
                setIsPaused(true);
                setSessionData(prev => ({ ...prev, status: 'paused' }));
                showNotification('⏸️ Session paused', 'info');
            } else {
                throw new Error('Failed to pause session');
            }
        } catch (err) {
            console.error('Error pausing session:', err);
            showNotification('❌ Failed to pause session', 'error');
        }
    };

    // Resume session
    const resumeSession = async () => {
        if (!sessionData) return;

        try {
            const response = await axiosInstance.patch(`/sessions/${sessionData.id}/resume`);

            if (response.data.success) {
                setIsPaused(false);
                setSessionData(prev => ({ ...prev, status: 'active' }));
                showNotification('▶️ Session resumed', 'info');
            } else {
                throw new Error('Failed to resume session');
            }
        } catch (err) {
            console.error('Error resuming session:', err);
            showNotification('❌ Failed to resume session', 'error');
        }
    };

    // Fetch session data from API
    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/sessions/my-sessions');

                if (!response.data.success) {
                    throw new Error('Failed to fetch session data');
                }

                const data = response.data;

                if (data.success && data.data.sessions.length > 0) {
                    const session = data.data.sessions[0];
                    setSessionData(session);

                    // Calculate total seconds based on time_limit
                    const totalSecs = session.time_limit ? parseInt(session.time_limit) * 60 : 0;
                    setTotalSeconds(totalSecs);

                    // Calculate elapsed time based on server time
                    const now = new Date();
                    const createdTime = new Date(session.created_at);
                    const elapsedMs = now - createdTime;
                    const elapsedSecs = Math.floor(elapsedMs / 1000);

                    // Don't exceed the total session time
                    const actualElapsed = Math.min(elapsedSecs, totalSecs);
                    setElapsedSeconds(actualElapsed);

                    // Set initial pause state
                    setIsPaused(session.status === 'paused');

                    showNotification('🎮 Session data loaded successfully!', 'info');
                } else {
                    setError('No active sessions found');
                }
            } catch (err) {
                setError(err.message);
                showNotification('❌ Failed to load session data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSessionData();
    }, []);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            if (!isPaused && sessionData) {
                setElapsedSeconds(prev => {
                    const newValue = prev + 1;

                    // Stop at total session time
                    if (newValue >= totalSeconds) {
                        clearInterval(timer);
                        showNotification('🔔 Session has ended!', 'error');
                        return totalSeconds;
                    }
                    return newValue;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [totalSeconds, isPaused, sessionData]);

    // Warning state effect
    useEffect(() => {
        if (remainingSeconds <= 300 && remainingSeconds > 0 && !isWarningState) {
            setIsWarningState(true);
            showNotification('⚠️ Warning: Only 5 minutes remaining!', 'warning');
        }
    }, [remainingSeconds, isWarningState]);

    // Notification system
    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        const newNotification = {
            id,
            message,
            type,
            time: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [...prev, newNotification]);
        setShowNotificationDot(true);
        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Extend session
    const extendSession = () => {
        setTotalSeconds(prev => prev + 1800);
        setIsExtended(true);
        showNotification('✅ Session extended by 30 minutes!', 'info');
        setTimeout(() => {
            setIsExtended(false);
        }, 3000);
    };

    // Calculate current charges
    const calculateCurrentCharges = () => {
        if (!sessionData) return 0;

        const hourlyRate = parseFloat(sessionData.hourly_rate);
        const hoursElapsed = elapsedSeconds / 3600;
        return (hoursElapsed * hourlyRate).toFixed(2);
    };

    // Format date and time
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Use end_time from API if available, otherwise calculate it
    const calculateEndTime = () => {
        if (!sessionData) return '';

        // Use end_time if available
        if (sessionData.end_time) {
            return formatDateTime(sessionData.end_time);
        }

        // Calculate from created_at and time_limit
        const createdTime = new Date(sessionData.created_at);
        const endTime = new Date(createdTime.getTime() + (sessionData.time_limit ? parseInt(sessionData.time_limit) : 0) * 60000);
        return formatDateTime(endTime.toISOString());
    };

    if (loading) {
        return (
            <div className="p-3 d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="p-3 d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="alert alert-info" role="alert">
                    No active sessions found.
                </div>
            </div>
        );
    }

    return (
        <div className="p-3">
            {/* Navbar */}
            <nav className="">
                <div className="">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <h1 className="fs-3 fw-bold text-dark">Session Tracker</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="mt-2">
                {/* Session Info Card */}
                <div className="mb-4">
                    <div className="bg-white rounded-3 shadow-sm p-4">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="text-muted small mb-1">Table Type</div>
                                <div className="fs-5 fw-semibold text-warning text-capitalize">
                                    {sessionData.table_type} Table
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="text-muted small mb-1">Session ID</div>
                                <div className="fs-5 fw-semibold font-monospace">{sessionData.session_id}</div>
                            </div>
                            <div className="col-md-4">
                                <div className="text-muted small mb-1">Status</div>
                                <span className={`badge ${sessionData.status === 'active' ? 'bg-success' : 'bg-warning'} rounded-pill`} style={{ width: '8px', height: '8px' }}></span>
                                <span className={`fw-medium text-capitalize ${sessionData.status === 'active' ? 'text-success' : 'text-warning'}`}>
                                    {sessionData.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Timer Card */}
                    <div className="col-lg-8">
                        <div className={`bg-white rounded-4 shadow-sm p-4 p-md-5 position-relative ${isWarningState ? 'warning-glow' : ''}`}>
                            <div className="text-center">
                                <div className="position-relative d-inline-block mb-4 mb-md-5">
                                    <svg className="w-100 h-auto" style={{ maxWidth: '300px' }} viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" stroke="#e9ecef" strokeWidth="2" fill="none" />
                                        <circle
                                            cx="50" cy="50" r="45"
                                            stroke={isWarningState ? "#dc3545" : "#ffc107"}
                                            strokeWidth="3"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={offset}
                                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                        />
                                    </svg>
                                    <div className="position-absolute top-50 start-50 translate-middle w-100 text-center">
                                        <div className="text-muted small mb-1">ELAPSED TIME</div>
                                        <div className="fs-4 fw-bold text-warning mb-3">{formatTime(elapsedSeconds)}</div>
                                        <div className="text-muted small mb-1">REMAINING TIME</div>
                                        <div className="fs-4 fw-bold">{formatTime(remainingSeconds)}</div>
                                    </div>
                                </div>
                                <div className="bg-light rounded-3 p-3 mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small">Session Progress</span>
                                        <span className={`small fw-medium ${isWarningState ? 'text-danger' : 'text-warning'}`}>
                                            {Math.round(progressPercent)}%
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '6px' }}>
                                        <div
                                            className={`progress-bar ${isWarningState ? 'bg-danger' : 'bg-warning'}`}
                                            role="progressbar"
                                            style={{ width: `${progressPercent}%` }}
                                            aria-valuenow={progressPercent}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>
                                <button
                                    className={`btn ${isExtended ? 'btn-success' : 'btn-warning'} px-4 py-2 px-md-5 py-md-3 fw-semibold d-flex align-items-center mx-auto`}
                                    onClick={extendSession}
                                    disabled={isExtended}
                                >
                                    <RiTimeLine className="me-2" />
                                    {isExtended ? 'Session Extended!' : 'Extend Session (+30 min)'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Cards */}
                    <div className="col-lg-4">
                        <div className="d-flex flex-column gap-4">
                            {/* Session Details */}
                            <div className="bg-white rounded-3 shadow-sm p-4">
                                <h3 className="fs-5 fw-semibold mb-3 d-flex align-items-center">
                                    <RiInformationLine className="text-warning me-2" />
                                    Session Details
                                </h3>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Start Time</span>
                                        <span className="fw-medium font-monospace">
                                            {formatDateTime(sessionData.created_at)}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">End Time</span>
                                        <span className="fw-medium font-monospace">
                                            {calculateEndTime()}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Total Duration</span>
                                        <span className="fw-medium font-monospace">
                                            {formatTime(sessionData.time_limit ? parseInt(sessionData.time_limit) * 60 : 0)}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Rate</span>
                                        <span className="fw-semibold text-warning">
                                            ${parseFloat(sessionData.hourly_rate).toFixed(2)}/hour
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-3 shadow-sm p-4">
                                <h3 className="fs-5 fw-semibold mb-3 d-flex align-items-center">
                                    <RiSettings3Line className="text-warning me-2" />
                                    Quick Actions
                                </h3>
                                <div className="d-flex flex-column gap-2">
                                    {isPaused ? (
                                        <button
                                            className="btn btn-outline-success d-flex align-items-center justify-content-start py-2"
                                            onClick={resumeSession}
                                        >
                                            <RiPlayLine className="me-2" />
                                            Resume Session
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline-secondary d-flex align-items-center justify-content-start py-2"
                                            onClick={pauseSession}
                                        >
                                            <RiPauseLine className="me-2" />
                                            Pause Session
                                        </button>
                                    )}
                                    <button className="btn btn-outline-secondary d-flex align-items-center justify-content-start py-2">
                                        <RiStopLine className="me-2" />
                                        End Session
                                    </button>
                                    <Link to='/user/sessionhistory' className="text-decoration-none w-100 ">
                                        <button className="btn btn-outline-secondary d-flex align-items-center justify-content-start py-2 w-100">
                                            <RiHistoryLine className="me-2" />
                                            Session History
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            {/* Current Charges */}
                            <div className="bg-white rounded-3 shadow-sm p-4">
                                <h3 className="fs-5 fw-semibold mb-3 d-flex align-items-center">
                                    <RiMoneyDollarCircleLine className="text-warning me-2" />
                                    Current Charges
                                </h3>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Time Elapsed</span>
                                        <span className="fw-medium">
                                            {Math.floor(elapsedSeconds / 3600)}h {Math.floor((elapsedSeconds % 3600) / 60)}m
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Hourly Rate</span>
                                        <span className="fw-medium">
                                            ${parseFloat(sessionData.hourly_rate).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-top d-flex justify-content-between">
                                        <span className="fw-semibold text-warning">Total Cost</span>
                                        <span className="fw-bold text-warning fs-5">
                                            ${calculateCurrentCharges()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="position-fixed top-4 end-4 d-flex flex-column gap-3" style={{ zIndex: 1050 }}>
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`bg-white shadow-lg rounded-3 p-3 border-start border-4 ${notification.type === 'warning' ? 'border-warning' :
                            notification.type === 'error' ? 'border-danger' : 'border-warning'
                            }`}
                        style={{ maxWidth: '320px' }}
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center">
                                <RiNotification3Fill className={
                                    notification.type === 'warning' ? 'text-warning' :
                                        notification.type === 'error' ? 'text-danger' : 'text-warning'
                                } />
                            </div>
                            <div className="flex-grow-1">
                                <p className="fw-medium mb-1">{notification.message}</p>
                                <p className="text-muted small mb-0">{notification.time}</p>
                            </div>
                            <button
                                className="btn btn-sm btn-link text-muted p-0"
                                onClick={() => removeNotification(notification.id)}
                            >
                                <RiCloseLine />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom CSS */}
            <style>
                {`
          .pulse-bell {
            animation: bellPulse 2s infinite;
          }
          @keyframes bellPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .warning-glow {
            animation: warningGlow 1s ease-in-out infinite alternate;
          }
          @keyframes warningGlow {
            from { box-shadow: 0 0 10px rgba(220, 53, 69, 0.3); }
            to { box-shadow: 0 0 15px rgba(220, 53, 69, 0.5); }
          }
          .font-monospace {
            font-family: 'Courier New', Courier, monospace;
          }
        `}
            </style>
        </div>
    );
};

export default SessionTracker;