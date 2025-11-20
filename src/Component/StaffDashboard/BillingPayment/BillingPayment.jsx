import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import {
    RiMoneyDollarCircleLine,
    RiBankCardLine,
    RiSmartphoneLine,
    RiPrinterLine,
    RiMailLine
} from 'react-icons/ri';
import axiosInstance from '../../../utils/axiosInstance';

const BillingPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [billData, setBillData] = useState(null);
    const [sessionTime, setSessionTime] = useState("00:00:00");
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Discount states
    const [selectedDiscount, setSelectedDiscount] = useState('Select Discount');
    const [discountMenuOpen, setDiscountMenuOpen] = useState(false);
    const [customDiscount, setCustomDiscount] = useState('');
    const [finalTotal, setFinalTotal] = useState(0);

    useEffect(() => {
        // Get bill data from location state
        if (location.state && location.state.orderData) {
            console.log("Bill data from location state:", location.state.orderData);
            setBillData(location.state.orderData);
        }
    }, [location.state]);

    useEffect(() => {
        if (!billData || !billData.recentOrderTime) return;
        const startTime = new Date(billData.recentOrderTime);
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
    }, [billData]);

    useEffect(() => {
        if (billData) {
            setFinalTotal(parseFloat(billData.totals.total) || 0);
        }
    }, [billData]);

    const handlePayment = async () => {
        if (!paymentMethod) {
            alert("Please select a payment method");
            return;
        }
        setIsProcessing(true);
        try {
            // Payment data
            const paymentData = {
                paymentMethod,
                amount: finalTotal, // discounted total
                discount: selectedDiscount !== 'Select Discount' ? selectedDiscount : null,
                customDiscount: customDiscount || null
            };

            // Update all orders to paid
            const updateOrderPromises = billData.orders.map(order =>
                axiosInstance.patch(`/orders/${order.id}/status`, { status: 'paid' })
            );
            await Promise.all(updateOrderPromises);

            // === TABLE UPDATE ===
            const tableRes = await axiosInstance.get(`/tables/${billData.table_id}`);
            const tableData = tableRes.data?.data?.table;

            if (!tableData) {
                throw new Error("Table data not found");
            }

            const updatedTableData = {
                ...tableData,
                status: "available",
            };

            await axiosInstance.put(`/tables/${billData.table_id}`, updatedTableData);

            alert("Payment successful! All orders marked as paid and table is now available.");
            setIsProcessing(false);

            navigate('/staff/ordermanagement');
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error processing payment: ' + (error.response?.data?.message || error.message));
            setIsProcessing(false);
        }
    };

    // === DISCOUNT LOGIC ===
    const applyDiscount = () => {
        let newTotal = parseFloat(billData.totals.total) || 0;

        if (selectedDiscount !== 'Select Discount') {
            const match = selectedDiscount.match(/(\d+)%/);
            if (match) {
                const discountPercent = parseFloat(match[1]);
                newTotal = newTotal - (newTotal * discountPercent / 100);
            }
        }

        if (customDiscount) {
            const customVal = parseFloat(customDiscount);
            if (!isNaN(customVal) && customVal > 0) {
                newTotal = newTotal - customVal;
            }
        }

        if (newTotal < 0) newTotal = 0;
        setFinalTotal(newTotal);
        setDiscountMenuOpen(false);
    };

    const clearDiscount = () => {
        setSelectedDiscount('Select Discount');
        setCustomDiscount('');
        setFinalTotal(parseFloat(billData.totals.total) || 0);
    };

    const selectDiscountOption = (option) => {
        setSelectedDiscount(option);
        setDiscountMenuOpen(false);
    };

    if (!billData) {
        return <div className="p-3 text-center">No bill data found. Please go back and select a table.</div>;
    }

    const subtotal = parseFloat(billData.totals.subtotal) || 0;
    const discount = parseFloat(billData.totals.discount) || 0;
    const taxAmount = parseFloat(billData.totals.tax) || 0;
    const totalAmount = parseFloat(billData.totals.total) || 0;
    const taxableAmount = subtotal - discount;
    const taxPercentage = billData.taxPercentage || (taxableAmount > 0 ? (taxAmount / taxableAmount) * 100 : 0);

    return (
        <div className="p-3">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3">
                    <div>
                        <h1 className="fs-3 fw-bold text-dark">Combined Table Bill</h1>
                        <p className="text-muted mb-0">
                            Customer: {billData.customer_name} | Table: {billData.table_label} | Orders: {billData.orders_count}
                        </p>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill small fw-medium">
                            {billData.table_label} - Active
                        </span>
                    </div>
                </div>

                <div className="row g-4">
                    {/* LEFT SIDE */}
                    <div className="col-lg-8">
                        <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
                                <div>
                                    <h2 className="fs-5 fw-semibold text-dark">Bill Summary</h2>
                                    <p className="text-muted small">Last Order: {new Date(billData.recentOrderTime).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-md-end mt-3 mt-md-0">
                                    <div className="bg-warning text-dark px-4 py-2 rounded-3 font-monospace fw-bold fs-5">
                                        {sessionTime}
                                    </div>
                                    <p className="text-muted x-small mt-1">Session Time</p>
                                </div>
                            </div>

                            {/* ORDERS */}
                            <div className="mb-4">
                                <h3 className="fs-5 fw-semibold text-dark mb-3">Orders</h3>
                                {billData.orders.map((order, orderIdx) => (
                                    <div key={order.id} className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h4 className="fs-6 fw-medium text-dark">Order #{order.order_number}</h4>
                                            <span className="small text-muted">
                                                {new Date(order.created_at).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="food-items-list">
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item, itemIdx) => (
                                                    <div key={`${order.id}-${itemIdx}`} className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 ${itemIdx % 2 === 0 ? "bg-light" : ""}`}>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <span className="text-dark fw-medium">
                                                                        {item.item_details?.item_name || item.item_name || `Item #${item.id || itemIdx}`}
                                                                    </span>
                                                                    <div className="text-muted small">
                                                                        {item.item_details?.description || item.item_description || ""}
                                                                    </div>
                                                                    {item.special_instructions && (
                                                                        <div className="small text-info mt-1">
                                                                            Note: {item.special_instructions}
                                                                        </div>
                                                                    )}
                                                                    {item.item_details?.sides && item.item_details.sides.length > 0 && (
                                                                        <div className="small text-muted mt-1">
                                                                            Sides: {item.item_details.sides.map(side => side.name).join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className="fw-semibold">
                                                                        ${parseFloat(item.item_total_with_tax || item.total_with_tax || 0).toFixed(2)}
                                                                    </div>
                                                                    <div className="small text-muted">
                                                                        ${parseFloat(item.base_price || item.unit_price || 0).toFixed(2)} × {item.quantity || 1}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-3 text-muted">
                                                    No items found for this order
                                                </div>
                                            )}
                                        </div>

                                        <div className="d-flex justify-content-end mt-2">
                                            <div className="text-end">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="text-muted">Subtotal</span>
                                                    <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                                                </div>
                                                {order.discount_amount > 0 && (
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-success">Discount</span>
                                                        <span className="text-success">-${parseFloat(order.discount_amount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="text-muted">Tax</span>
                                                    <span>${parseFloat(order.tax_amount).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between fw-bold">
                                                    <span>Order Total</span>
                                                    <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTAL SUMMARY */}
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
                                    <span className="text-muted">Tax ({taxPercentage.toFixed(2)}%)</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-top pt-2 mt-2">
                                    <div className="d-flex justify-content-between fs-5 fw-bold text-dark">
                                        <span>Total</span>
                                        <span>${finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE - PAYMENT */}
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
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Processing..." : `Pay Now - $${finalTotal.toFixed(2)}`}
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

                {/* DISCOUNT SECTION */}
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

export default BillingPayment;
