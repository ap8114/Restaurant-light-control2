import React, { useState, useEffect } from 'react';
import { RiBillLine, RiArrowDownSLine, RiArrowUpSLine, RiMoneyDollarCircleLine, RiQrCodeLine, RiTimeLine, RiCloseLine } from 'react-icons/ri';
import axiosInstance from '../../../utils/axiosInstance';
import axios from 'axios';

const MyBilling = () => {
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Payment status based on API data
  const [paymentStatus, setPaymentStatus] = useState({
    text: 'Unpaid',
    className: 'bg-danger text-white'
  });

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/sessions/my-sessions', {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.data.success) {
        // Find the active session
        const activeSession = response.data.data.sessions.find(session => session.status === 'active');
        if (activeSession) {
          setSessionId(activeSession.id);
          fetchBillData(activeSession.id);
        } else {
          setError('No active session found');
          setLoading(false);
        }
      } else {
        setError('Failed to fetch sessions');
        setLoading(false);
      }
    } catch (err) {
      setError('Error fetching sessions');
      console.error('Error fetching sessions:', err);
      setLoading(false);
    }
  };

  const fetchBillData = async (id) => {
    try {
      const response = await axiosInstance.get(`/billing/session/${id}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.success) {
        setBillData(response.data.data.bill);

        // Set payment status based on API response
        if (response.data.data.bill.payment_status === 'paid') {
          setPaymentStatus({
            text: 'Paid',
            className: 'bg-success text-white'
          });
          setPaymentSuccess(true);
        }
      } else {
        // If API returns success: false but no error
        setError('No billing data available');
      }
    } catch (err) {
      // For any error (network error, 404, etc.), show "No billing data available"
      setError('No billing data available');
      console.error('Error fetching bill data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  const handleCashPayment = () => {
    setShowQRCode(false);
    setTimeout(() => {
      setPaymentSuccess(true);
      setPaymentStatus({
        text: 'Paid',
        className: 'bg-success text-white'
      });
    }, 1000);
  };

  const handleQRPayment = () => {
    setPaymentSuccess(false);
    setShowQRCode(true);
  };

  const handlePaymentComplete = () => {
    setShowQRCode(false);
    setPaymentSuccess(true);
    setPaymentStatus({
      text: 'Paid',
      className: 'bg-success text-white'
    });
  };

  const closeQRCode = () => {
    setShowQRCode(false);
  };

  // Format date and time functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate duration display
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours} hours ${minutes} minutes`;
  };

  if (loading) {
    return (
      <div className="p-3 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="alert alert-info" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="p-3 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="alert alert-info" role="alert">
          No billing data available
        </div>
      </div>
    );
  }

  // Calculate tax percentage if tax amount exists
  const taxPercentage = billData.totals.tax_amount && billData.totals.subtotal > 0
    ? ((billData.totals.tax_amount / billData.totals.subtotal) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-3">
      {/* Header */}
      <header className="">
        <div className="">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 gap-md-3 mb-2 mb-sm-0">
              <h1 className="fs-3 fw-bold text-dark">My Bill</h1>
            </div>
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <div className="text-muted small text-center text-sm-end">
                <div>{formatDate(billData.session.created_at)}</div>
                <div>{formatTime(billData.session.created_at)}</div>
              </div>
              <div className={`badge rounded-pill px-2 px-md-3 py-1 ${paymentStatus.className}`}>
                {paymentStatus.text}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mt-3">
        <div className="card shadow-lg">
          <div className="card-body">
            {/* Session Information */}
            <section className="border-bottom pb-3 pb-md-4 mb-3 mb-md-4">
              <h2 className="fs-5 fs-md-4 fw-bold text-dark mb-2 mb-md-3">Session Information</h2>
              <div className="row g-2">
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Session ID</span>
                    <span className="fw-medium">{billData.session.session_id}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Table</span>
                    <span className="fw-medium">{billData.session.table_name}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Customer</span>
                    <span className="fw-medium">{billData.session.customer_name}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Status</span>
                    <span className="fw-medium">{billData.session.status}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Session Charges */}
            <section className="border-bottom pb-3 pb-md-4 mb-3 mb-md-4">
              <h2 className="fs-5 fs-md-4 fw-bold text-dark mb-2 mb-md-3">Session Charges</h2>
              <div className="row g-2">
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Duration</span>
                    <span className="fw-medium">{billData.session.duration_display}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Hourly Rate</span>
                    <span className="fw-medium">${parseFloat(billData.session.hourly_rate).toFixed(2)}/hour</span>
                  </div>
                </div>
                <div className="col-12 pt-2 border-top">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold text-dark">Session Subtotal</span>
                    <span className="fw-bold text-dark">${parseFloat(billData.session.session_cost).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* My Orders */}
            <section className="mb-3 mb-md-4">
              <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                <h2 className="fs-5 fs-md-4 fw-bold text-dark m-0">My Orders</h2>
                {billData.orders && billData.orders.length > 0 && (
                  <button
                    className="btn btn-link text-warning p-0 d-flex align-items-center gap-1 gap-md-2"
                    onClick={toggleOrderDetails}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="small fw-medium">
                      {showOrderDetails ? 'Hide Details' : 'View Details'}
                    </span>
                    {showOrderDetails ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                  </button>
                )}
              </div>

              {billData.orders && billData.orders.length > 0 ? (
                <>
                  {showOrderDetails && (
                    <div className="mb-3">
                      <div className="row g-2 mb-3">
                        {billData.orders.map((order, index) => (
                          <div className="col-12" key={index}>
                            <div className="d-flex justify-content-between align-items-center p-2 p-md-3 bg-light rounded mb-2">
                              <div className="d-flex align-items-center gap-2 gap-md-3">
                                <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🍔</div>
                                <div>
                                  <div className="fw-medium">Order #{order.order_number}</div>
                                  <div className="text-muted small">{order.items_summary}</div>
                                </div>
                              </div>
                              <span className="fw-semibold">${parseFloat(order.total_amount).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-top pt-2 pt-md-3">
                        <div className="d-flex justify-content-between">
                          <span className="fw-semibold text-dark">Orders Subtotal</span>
                          <span className="fw-bold text-dark">${parseFloat(billData.totals.order_subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold text-dark">Orders Subtotal</span>
                    <span className="fw-bold text-dark">${parseFloat(billData.totals.order_subtotal).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No orders placed during this session</p>
                </div>
              )}
            </section>

            {/* Summary */}
            <section className="bg-warning bg-opacity-10 rounded-2 rounded-md-3 p-3 p-md-4 mb-3 mb-md-4">
              <div className="row g-2">
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-dark">Subtotal</span>
                    <span className="fw-medium">
                      ${parseFloat(billData.totals.subtotal).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-dark">Tax ({taxPercentage}%)</span>
                    <span className="fw-medium">${parseFloat(billData.totals.tax_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
                {billData.totals.discount_amount > 0 && (
                  <div className="col-12">
                    <div className="d-flex justify-content-between">
                      <span className="text-dark">Discount</span>
                      <span className="fw-medium">-${parseFloat(billData.totals.discount_amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="col-12 border-top border-warning border-opacity-30 pt-2 pt-md-3">
                  <div className="d-flex justify-content-between">
                    <span className="fs-5 fw-bold text-dark">Total Amount</span>
                    <span className="fs-4 fw-bold text-dark">
                      ${parseFloat(billData.totals.grand_total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Options - Only show if not paid */}
            {!paymentSuccess && (
              <section>
                <h3 className="fs-5 fw-bold text-dark mb-2 mb-md-3">Payment Options</h3>

                <div className="row g-2 g-md-3 mb-3">
                  <div className="col-12 col-md-6">
                    <button
                      className="btn btn-warning text-dark fw-bold w-100 py-2 py-md-3 d-flex align-items-center justify-content-center gap-1 gap-md-2"
                      onClick={handleCashPayment}
                      style={{ borderRadius: '8px' }}
                    >
                      <RiMoneyDollarCircleLine style={{ fontSize: '1rem' }} />
                      <span>Pay with Cash</span>
                    </button>
                  </div>
                  <div className="col-12 col-md-6">
                    <button
                      className="btn btn-dark text-white fw-bold w-100 py-2 py-md-3 d-flex align-items-center justify-content-center gap-1 gap-md-2"
                      onClick={handleQRPayment}
                      style={{ borderRadius: '8px' }}
                    >
                      <RiQrCodeLine style={{ fontSize: '1rem' }} />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                </div>

                {showQRCode && (
                  <div className="bg-light rounded-2 rounded-md-3 p-3 p-md-4 text-center mb-3 position-relative">
                    <button
                      className="position-absolute top-0 end-0 m-2 m-md-3 btn btn-sm btn-outline-secondary"
                      onClick={closeQRCode}
                    >
                      <RiCloseLine />
                    </button>
                    <h4 className="fs-5 fw-semibold text-dark mb-2 mb-md-3">Scan & Pay</h4>
                    <div className="bg-white p-2 p-md-3 rounded-2 rounded-md-3 d-inline-block shadow-sm">
                      <div className="rounded d-flex align-items-center justify-content-center mx-auto"
                        style={{
                          width: '150px',
                          height: '150px',
                          maxWidth: '100%',
                          backgroundColor: '#f8f9fa'
                        }}>
                        <div className="text-center">
                          <div className="mx-auto mb-1 mb-md-2" style={{
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <RiQrCodeLine style={{ fontSize: '2rem', color: '#adb5bd' }} />
                          </div>
                          <div className="text-muted small">QR Code</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            ${parseFloat(billData.totals.grand_total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small mt-2 mt-md-3">Use your mobile banking app to scan and pay</p>
                    <div className="mt-2 mt-md-3">
                      <div className="d-inline-flex align-items-center gap-1 gap-md-2 px-2 px-md-3 py-1 bg-warning bg-opacity-25 text-warning-emphasis rounded-pill small">
                        <RiTimeLine style={{ fontSize: '0.8rem' }} />
                        <span>Waiting for payment...</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-success mt-3 mt-md-4"
                      onClick={handlePaymentComplete}
                    >
                      I've Completed Payment
                    </button>
                  </div>
                )}
              </section>
            )}

            {paymentSuccess && (
              <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2 rounded-md-3 p-3 p-md-4 text-center">
                <div className="mx-auto mb-2 mb-md-3" style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* You can add a checkmark icon here */}
                </div>
                <h4 className="fs-5 fw-semibold text-success mb-1 mb-md-2">Payment Successful!</h4>
                <p className="text-success small">
                  Your payment of ${parseFloat(billData.totals.grand_total).toFixed(2)} has been processed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBilling;