import React, { useMemo, useState, useEffect, useRef } from "react";
import { FaEye, FaFilePdf } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from 'jspdf';
import { apiUrl } from "../../../utils/config";

const Report = () => {
  // ---- Local UI state ------------------------------------------------------
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState(null); // row selected for modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiData, setApiData] = useState([]);
  const reportRef = useRef(null);
  const modalRef = useRef(null);
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/reports/table-orders`);
        const result = await response.json();
        
        if (result.success) {
          setApiData(result.data);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---- PDF Export Functions -------------------------------------------------
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setLoading(true);
      
      // Create a canvas from the report content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title to the PDF
      pdf.setFontSize(18);
      pdf.text('Restaurant Report', 105, 15, { align: 'center' });
      
      // Add date range if applied
      if (fromDate || toDate) {
        pdf.setFontSize(10);
        let dateRangeText = 'Date Range: ';
        if (fromDate) dateRangeText += fromDate;
        if (fromDate && toDate) dateRangeText += ' to ';
        if (toDate) dateRangeText += toDate;
        pdf.text(dateRangeText, 105, 22, { align: 'center' });
      }
      
      // Add the image to PDF
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 30;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const fileName = `restaurant-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      setError('Error generating PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportOrderToPDF = async () => {
    if (!modalRef.current) return;
    
    try {
      setLoading(true);
      
      // Create a canvas from the modal content
      const canvas = await html2canvas(modalRef.current, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title to the PDF
      pdf.setFontSize(18);
      pdf.text('Order Details', 105, 15, { align: 'center' });
      
      // Add the image to PDF
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 30;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const fileName = `order-details-${selected.tableNo}-${selected.date}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      setError('Error generating order PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Helpers -------------------------------------------------------------
  const formatCurrency = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" }); // change to INR if needed
    
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toISOString().split('T')[0];
  };
  
  const withinRange = (d) => {
    if (!d || !fromDate && !toDate) return true;
    const ts = new Date(d).getTime();
    const fromOk = fromDate ? ts >= new Date(fromDate).getTime() : true;
    const toOk = toDate ? ts <= new Date(toDate).getTime() + 86400000 : true; // Add one day to include the end date
    return fromOk && toOk;
  };
  
  // ---- Filtering + totals --------------------------------------------------
  const filtered = useMemo(() => {
    return apiData.filter((r) => {
      const hitRange = withinRange(r.order_date);
      const q = search.trim().toLowerCase();
      const hitSearch = q
        ? [
            r.table_name, 
            r.orders?.[0]?.customerNo,
            r.orders?.[0]?.customerName
          ].filter(Boolean).join(" ").toLowerCase().includes(q)
        : true;
      return hitRange && hitSearch;
    });
  }, [apiData, search, fromDate, toDate]);
  
  const totals = useMemo(() => {
    const tPeople = filtered.reduce((a, b) => a + parseInt(b.people || 0), 0);
    const tItems = filtered.reduce((a, b) => a + parseInt(b.total_items || 0), 0);
    const tAmount = filtered.reduce((a, b) => a + parseFloat(b.total_revenue || 0), 0);
    return { tPeople, tItems, tAmount };
  }, [filtered]);

  // ---- Transform API data to match UI structure ---------------------------
  const transformData = (data) => {
    return data.map(item => {
      // Create a unique ID for each row
      const id = `${item.table_name}-${item.order_date || 'no-date'}`;
      
      // Get customer info from the first order if available
      const firstOrder = item.orders?.[0] || {};
      
      return {
        id,
        date: formatDate(item.order_date),
        tableNo: item.table_name,
        customerNo: firstOrder.customerNo || "N/A",
        customerName: firstOrder.customerName || "Walk-in Customer",
        people: parseInt(item.people || 0),
        items: parseInt(item.total_items || 0),
        total: parseFloat(item.total_revenue || 0),
        orders: item.orders || [],
        foodItems: item.orders?.flatMap(order => 
          order?.items?.map((foodItem, index) => ({
            sn: index + 1,
            name: foodItem.itemName || "Item name not available",
            qty: foodItem.quantity,
            price: foodItem.price
          })) || []
        ) || []
      };
    });
  };

  const transformedData = transformData(filtered);

  // ---- Styles --------------------------------------------------------------
  const cardCls = "bg-white border rounded-3 shadow-sm";
  
  return (
    <div className="container-fluid p-4" style={{ background: "#f6f6f6", minHeight: "100vh" }}>
      {/* Page Heading */}
      <h2 className="fw-bold mb-4">Reports</h2>
      
      {/* Loading and Error states */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading report data...</p>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          {/* Filters */}
          <div className={`${cardCls} p-3 mb-3`}>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <input
                  className="form-control"
                  placeholder="Search by Table, Customer No, or Name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Date range */}
              <div className="col-6 col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From"
                />
              </div>
              <div className="col-6 col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To"
                />
              </div>
              <div className="col-12 col-md-2 d-flex gap-2">
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => {
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </button>
                <button
                  className="btn btn-danger w-50 d-flex align-items-center justify-content-center"
                  onClick={exportToPDF}
                  title="Download as PDF"
                >
                  <FaFilePdf className="me-1" /> PDF
                </button>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <div className={`${cardCls} p-3`}>
                <div className="text-muted small">Total People</div>
                <div className="fs-3 fw-bold">{totals.tPeople}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className={`${cardCls} p-3`}>
                <div className="text-muted small">Total Food Items</div>
                <div className="fs-3 fw-bold">{totals.tItems}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className={`${cardCls} p-3`}>
                <div className="text-muted small">Total Amount</div>
                <div className="fs-3 fw-bold">{formatCurrency(totals.tAmount)}</div>
              </div>
            </div>
          </div>
          
          {/* Report Table */}
          <div ref={reportRef} className={`${cardCls} p-0`}>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: 120 }}>Date</th>
                    <th>Table No</th>
                    <th>Customer Name</th>
                    <th className="text-center">People</th>
                    {/* show ONLY items S/Ns in the table */}
                    <th className="text-center">Items (S/N)</th>
                    <th className="text-end">Order Total</th>
                    <th className="text-center" style={{ width: 90 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transformedData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No records found.
                      </td>
                    </tr>
                  )}
                  {transformedData.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td className="fw-semibold">{r.tableNo}</td>
                      <td>{r.customerName}</td>
                      <td className="text-center">{r.people}</td>
                      {/* Render S/Ns as comma-separated: 1,2,3... */}
                      <td className="text-center">
                        {r.foodItems?.map((fi) => fi.sn).join(", ")}
                      </td>
                      <td className="text-end">{formatCurrency(r.total)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-light border"
                          title="View details"
                          onClick={() => setSelected(r)}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {transformedData.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan={3} className="text-end">
                        Totals:
                      </th>
                      <th className="text-center">{totals.tPeople}</th>
                      <th />
                      <th className="text-end">{formatCurrency(totals.tAmount)}</th>
                      <th />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Modal: show food item details */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            onClick={() => setSelected(null)}
            style={{ cursor: "pointer" }}
          />
          {/* Modal */}
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div ref={modalRef} className="modal-content">
         <div className="modal-header">
  <h5 className="modal-title">
    Table {selected.tableNo} • Customer {selected.customerNo}
  </h5>
  <div className="d-flex align-items-center ms-auto">
    <button
      className="btn btn-sm btn-danger me-2"
      onClick={exportOrderToPDF}
      title="Download as PDF"
    >
      <FaFilePdf /> PDF
    </button>
    <button
      type="button"
      className="btn-close"
      onClick={() => setSelected(null)}
    />
  </div>
</div>

                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col">
                      <div className="small text-muted">Date</div>
                      <div className="fw-semibold">{selected.date}</div>
                    </div>
                    <div className="col">
                      <div className="small text-muted">People</div>
                      <div className="fw-semibold">{selected.people}</div>
                    </div>
                    <div className="col">
                      <div className="small text-muted">Customer Name</div>
                      <div className="fw-semibold">{selected.customerName}</div>
                    </div>
                    <div className="col text-end">
                      <div className="small text-muted">Order Total</div>
                      <div className="fw-semibold">
                        {formatCurrency(selected.total)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Orders list */}
                  {selected.orders && selected.orders.length > 0 && (
                    <div className="mb-4">
                      <h6 className="mb-3">Orders</h6>
                      <div className="accordion" id="ordersAccordion">
                        {selected.orders.map((order, orderIndex) => (
                          order && (
                            <div className="accordion-item mb-2" key={orderIndex}>
                              <h2 className="accordion-header">
                                <button 
                                  className="accordion-button collapsed" 
                                  type="button" 
                                  data-bs-toggle="collapse" 
                                  data-bs-target={`#order${orderIndex}`}
                                >
                                  Order #{order.orderId} • {formatCurrency(order.orderTotal)}
                                </button>
                              </h2>
                              <div 
                                id={`order${orderIndex}`} 
                                className="accordion-collapse collapse" 
                                data-bs-parent="#ordersAccordion"
                              >
                                <div className="accordion-body">
                                  <div className="table-responsive">
                                    <table className="table table-sm align-middle">
                                      <thead className="table-light">
                                        <tr>
                                          <th style={{ width: 70 }}>S/N</th>
                                          <th>Food Item</th>
                                          <th className="text-center" style={{ width: 100 }}>Qty</th>
                                          <th className="text-end" style={{ width: 140 }}>Price</th>
                                          <th className="text-end" style={{ width: 160 }}>Line Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items?.map((fi, itemIndex) => (
                                          <tr key={itemIndex}>
                                            <td>{itemIndex + 1}</td>
                                            <td>{fi.itemName || "Item name not available"}</td>
                                            <td className="text-center">{fi.quantity}</td>
                                            <td className="text-end">{formatCurrency(fi.price)}</td>
                                            <td className="text-end">
                                              {formatCurrency(fi.price * fi.quantity)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="table-light">
                                        <tr>
                                          <th colSpan={4} className="text-end">Order Total</th>
                                          <th className="text-end">{formatCurrency(order.orderTotal)}</th>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Combined food items table */}
                  {selected.foodItems && selected.foodItems.length > 0 && (
                    <div className="table-responsive">
                      <h6 className="mb-3">All Food Items</h6>
                      <table className="table table-sm align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 70 }}>S/N</th>
                            <th>Food Item</th>
                            <th className="text-center" style={{ width: 100 }}>Qty</th>
                            <th className="text-end" style={{ width: 140 }}>Price</th>
                            <th className="text-end" style={{ width: 160 }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.foodItems.map((fi) => (
                            <tr key={fi.sn}>
                              <td>{fi.sn}</td>
                              <td>{fi.name}</td>
                              <td className="text-center">{fi.qty}</td>
                              <td className="text-end">{formatCurrency(fi.price)}</td>
                              <td className="text-end">
                                {formatCurrency(fi.price * fi.qty)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <th colSpan={4} className="text-end">Grand Total</th>
                            <th className="text-end">{formatCurrency(selected.total)}</th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;