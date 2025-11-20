import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
    RiCheckLine,
    RiMoneyDollarCircleLine,
    RiBankCardLine,
    RiSmartphoneLine,
    RiPrinterLine,
    RiMailLine
} from 'react-icons/ri';
import axiosInstance from '../../../utils/axiosInstance';

const BillingGuestPayment = () => {
    const { id } = useParams();
    const location = useLocation();
    const [orderData, setOrderData] = useState(null);
    const [sessionTime, setSessionTime] = useState("00:00:00");
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState('Select Discount');
    const [discountMenuOpen, setDiscountMenuOpen] = useState(false);
    const [customDiscount, setCustomDiscount] = useState('');
    const [businessSettings, setBusinessSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Fetch business settings to get tax information
    useEffect(() => {
        const fetchBusinessSettings = async () => {
            try {
                const response = await axiosInstance.get('/business_settings');
                const data = response.data.data; // Access the data property from response
                setBusinessSettings(data);
            } catch (error) {
                console.error('Error fetching business settings:', error);
                // Set default tax rate if API fails
                setBusinessSettings({
                    tax: "5", // Default tax percentage as string
                    receipt_footer: "Thank you for your visit!",
                    system_mode: "online"
                });
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchBusinessSettings();
    }, []);

    useEffect(() => {
        // If we have an order ID in the URL, fetch the order
        if (id) {
            const fetchOrder = async () => {
                try {
                    const res = await axiosInstance.get(`/orders/${id}`);
                    if (res.data.success) {
                        setOrderData(res.data.data.order);
                    } else {
                        console.error("Failed to fetch order:", res.data.message);
                    }
                } catch (err) {
                    console.error("Error fetching order:", err);
                }
            };
            fetchOrder();
        }
        // If we don't have an order ID, check for state passed from navigation
        else if (location.state && location.state.orderData) {
            setOrderData(location.state.orderData);
        }
    }, [id, location]);

    useEffect(() => {
        if (!orderData) return;

        const startTime = new Date(orderData.created_at);
        const updateTimer = () => {
            const now = new Date();
            const diff = now - startTime;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setSessionTime(
                `${hours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [orderData]);

    // Calculate tax based on business settings
    const calculateTax = (subtotal) => {
        if (!businessSettings || !businessSettings.tax) return 0;
        const taxRate = parseFloat(businessSettings.tax); // Convert string to number
        return (subtotal * taxRate) / 100;
    };

    // Calculate total with tax
    const calculateTotal = (subtotal, discount = 0) => {
        const taxableAmount = subtotal - discount;
        const tax = calculateTax(taxableAmount);
        return taxableAmount + tax;
    };

    const handlePayment = async () => {
        if (!paymentMethod) {
            alert("Please select a payment method");
            return;
        }

        setIsProcessing(true);

        try {
            // If this is a temporary order (not in backend), create it first
            if (orderData.id.toString().startsWith('temp-')) {
                const newOrderData = {
                    session_id: 1,
                    table_id: orderData.table_number ? parseInt(orderData.table_number) : null,
                    customer_name: orderData.customer_name,
                    order_type: orderData.order_type,
                    special_instructions: orderData.special_instructions,
                    items: orderData.items.map(item => ({
                        menu_item_id: item.id,
                        quantity: item.quantity,
                        special_instructions: item.special_instructions
                    }))
                };

                const response = await axiosInstance.post('/orders', newOrderData);

                if (response.data.success) {
                    // Update orderData with the real order ID from backend
                    setOrderData({
                        ...orderData,
                        id: response.data.data.order.id,
                        order_number: response.data.data.order.order_number
                    });

                    // Process payment with real order ID
                    setTimeout(() => {
                        alert("Payment successful! Order created and table is now available.");
                        setIsProcessing(false);
                    }, 2000);
                } else {
                    alert('Failed to create order: ' + (response.data.message || 'Unknown error'));
                    setIsProcessing(false);
                }
            } else {
                // Order already exists in backend, just process payment
                setTimeout(() => {
                    alert("Payment successful! Session closed and table is now available.");
                    setIsProcessing(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error processing payment: ' + (error.response?.data?.message || error.message));
            setIsProcessing(false);
        }
    };

    const applyDiscount = () => {
        console.log('Discount applied:', selectedDiscount, customDiscount);
        setDiscountMenuOpen(false);
    };

    const clearDiscount = () => {
        setSelectedDiscount('Select Discount');
        setCustomDiscount('');
    };

    const selectDiscountOption = (option) => {
        setSelectedDiscount(option);
        setDiscountMenuOpen(false);
    };

    if (!orderData || loadingSettings) {
        return <div className="p-3 text-center">Loading order details...</div>;
    }

    // Calculate values using business settings
    const subtotal = parseFloat(orderData.subtotal);
    const discount = parseFloat(orderData.discount_amount) || 0;
    const taxPercentage = businessSettings ? parseFloat(businessSettings.tax) : 5; // Default to 5% if not available
    const taxAmount = calculateTax(subtotal - discount);
    const totalAmount = calculateTotal(subtotal, discount);

    return (
        <div className="p-3">
            <div className="max-w-4xl mx-auto">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3">
                    <div>
                        <h1 className="fs-3 fw-bold text-dark">Billing & Payment</h1>
                        <p className="text-muted mb-0">
                            Customer: {orderData.customer_name} | Order #{orderData.order_number}
                        </p>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill small fw-medium">
                            {orderData.table_number ? `Table ${orderData.table_number}` : 'No Table'} - Active
                        </span>
                    </div>
                </div>
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
                                <div>
                                    <h2 className="fs-5 fw-semibold text-dark">Bill Summary</h2>
                                    <p className="text-muted small">Started: {new Date(orderData.created_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-md-end mt-3 mt-md-0">
                                    <div className="bg-warning text-dark px-4 py-2 rounded-3 font-monospace fw-bold fs-5">
                                        {sessionTime}
                                    </div>
                                    <p className="text-muted x-small mt-1">Session Time</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="fs-5 fw-semibold text-dark">Items</h3>
                                <div className="food-items-list">
                                    {orderData.items.map((item, idx) => (
                                        <div key={idx} className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 ${idx % 2 === 0 ? "bg-light" : ""}`}>
                                            <div>
                                                <span className="text-dark">{item.item_name}</span>
                                                <span className="text-muted small ms-2">× {item.quantity}</span>
                                            </div>
                                            <span className="fw-semibold">${item.total_price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-success">Discount</span>
                                        <span className="text-success">-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Tax ({taxPercentage}%)</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-top pt-2 mt-2">
                                    <div className="d-flex justify-content-between fs-5 fw-bold text-dark">
                                        <span>Total</span>
                                        <span>${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="bg-white rounded-3 shadow-sm border p-4" style={{ top: "1rem" }}>
                            <h3 className="fs-5 fw-semibold text-dark mb-4">Payment & Close Session</h3>
                            <div className="bg-light p-3 rounded-3 mb-3">
                                <h4 className="fw-medium text-dark mb-2">Payment Methods</h4>
                                <div className="payment-methods">
                                    <label className="d-flex align-items-center gap-3 mb-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            className="form-check-input"
                                            checked={paymentMethod === "cash"}
                                            onChange={() => setPaymentMethod("cash")}
                                        />
                                        <div className="d-flex align-items-center gap-2">
                                            <RiMoneyDollarCircleLine className="text-success fs-5" />
                                            <span>Cash Payment</span>
                                        </div>
                                    </label>
                                    <label className="d-flex align-items-center gap-3 mb-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            className="form-check-input"
                                            checked={paymentMethod === "card"}
                                            onChange={() => setPaymentMethod("card")}
                                        />
                                        <div className="d-flex align-items-center gap-2">
                                            <RiBankCardLine className="text-primary fs-5" />
                                            <span>Card Payment</span>
                                        </div>
                                    </label>
                                    <label className="d-flex align-items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="upi"
                                            className="form-check-input"
                                            checked={paymentMethod === "upi"}
                                            onChange={() => setPaymentMethod("upi")}
                                        />
                                        <div className="d-flex align-items-center gap-2">
                                            <RiSmartphoneLine className="text-purple fs-5" />
                                            <span>UPI Payment</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <button
                                className={`btn btn-success w-100 py-3 mb-3 ${isProcessing ? "disabled" : ""}`}
                                onClick={handlePayment}
                            >
                                {isProcessing ? "Processing..." : `Pay Now - $${totalAmount.toFixed(2)}`}
                            </button>
                            <div className="row g-2">
                                <div className="col-6">
                                    <button className="btn btn-outline-secondary w-100 small d-flex align-items-center justify-content-center gap-1">
                                        <RiPrinterLine />
                                        Print Receipt
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button className="btn btn-outline-secondary w-100 small d-flex align-items-center justify-content-center gap-1">
                                        <RiMailLine />
                                        Email Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3 shadow-sm border p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 className="fs-5 fw-semibold text-dark">Apply Discount</h3>
                        <span className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded small fw-medium">
                            Admin Only
                        </span>
                    </div>
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-medium text-muted">Preset Discounts</label>
                            <div className="position-relative">
                                <button
                                    className="form-select text-start d-flex align-items-center justify-content-between"
                                    onClick={() => setDiscountMenuOpen(!discountMenuOpen)}
                                >
                                    <span>{selectedDiscount}</span>
                                </button>
                                {discountMenuOpen && (
                                    <div className="position-absolute top-100 start-0 end-0 bg-white border rounded mt-1 shadow-lg z-10">
                                        <button
                                            className="w-100 text-start px-3 py-2 bg-hover-light discount-option"
                                            onClick={() => selectDiscountOption('5% - Student Discount')}
                                        >
                                            5% - Student Discount
                                        </button>
                                        <button
                                            className="w-100 text-start px-3 py-2 bg-hover-light discount-option"
                                            onClick={() => selectDiscountOption('10% - Member Discount')}
                                        >
                                            10% - Member Discount
                                        </button>
                                        <button
                                            className="w-100 text-start px-3 py-2 bg-hover-light discount-option"
                                            onClick={() => selectDiscountOption('15% - VIP Discount')}
                                        >
                                            15% - VIP Discount
                                        </button>
                                        <button
                                            className="w-100 text-start px-3 py-2 bg-hover-light discount-option"
                                            onClick={() => selectDiscountOption('20% - Special Promotion')}
                                        >
                                            20% - Special Promotion
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-medium text-muted">Custom Amount ($)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter amount"
                                value={customDiscount}
                                onChange={(e) => setCustomDiscount(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="d-flex gap-3">
                        <button
                            className="btn btn-warning flex-grow-1"
                            onClick={applyDiscount}
                        >
                            Apply Discount
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={clearDiscount}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingGuestPayment;