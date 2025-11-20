import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { FaFileExport } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiUrl } from '../../../utils/config';

const ReportsAnalytics = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportBy, setReportBy] = useState("Last 7 days");
  const [reportType, setReportType] = useState("X Report (Summary)");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Get auth token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    } else {
      setError("Authentication token not found. Please log in again.");
    }
  }, []);

  // Map frontend values to API parameter values
  const reportTypeMapping = {
    "X Report (Summary)": "X Report (Summary)",
    "Item Sales Report": "Item Sales Report",
    "Table Revenue Report": "Table Revenue Report",
    "Category Sales Report": "Category Sales Report",
    "Detailed Transactions": "Detailed Transactions",
    "Staff Summary Report": "Staff Summary Report",
    "Financial Summary": "Financial Summary"
  };

  const reportByMapping = {
    "Daily": "Today",
    "Last 7 days": "Last 7 days",
    "Last 30 days": "Last 30 days",
    "Last year": "Last year",
    "Year until end": "Year to date",
    "Custom range": "Custom range"
  };

  // Fetch report data from API
  const fetchReportData = async () => {
    if (!authToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let apiReportBy = reportByMapping[reportBy];

      // Handle custom date range
      if (reportBy === "Custom range") {
        const formatDate = (date) => {
          return date.toISOString().split('T')[0];
        };
        apiReportBy = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      }

      const apiReportType = reportTypeMapping[reportType];

      const response = await fetch(
        `${apiUrl}/reports?reportBy=${encodeURIComponent(apiReportBy)}&reportType=${encodeURIComponent(apiReportType)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setReportData(data);
      } else {
        throw new Error(data.message || "Failed to fetch report data");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change or auth token is available
  useEffect(() => {
    if (authToken) {
      fetchReportData();
    }
  }, [reportBy, reportType, startDate, endDate, authToken]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleExport = async (format) => {
    if (format === 'pdf') {
      setExportLoading(true);
      try {
        await exportToPDF();
      } catch (error) {
        console.error("Error exporting PDF:", error);
        alert("Failed to export PDF. Please try again.");
      } finally {
        setExportLoading(false);
      }
    } else {
      console.log(`Exporting as ${format} for ${reportBy} and ${reportType}`);
      alert(`Report exported as ${format.toUpperCase()}`);
    }
  };

  const exportToPDF = async () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      alert("No data available to export");
      return;
    }

    // Create new PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(reportType, 14, 15);

    // Add report period
    doc.setFontSize(10);
    doc.text(`Report Period: ${reportData.reportBy}`, 14, 22);

    // Add generation date
    const now = new Date();
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 29);

    // Define column configurations for different report types
    const columnConfig = {
      "Table Revenue Report": {
        columns: ["Table Name", "Total Revenue", "Orders Count"],
        dataMapper: (item) => [
          item.table_name || "N/A",
          item.total_revenue ? `$${parseFloat(item.total_revenue).toFixed(2)}` : "$0.00",
          item.orders_count || 0
        ]
      },
      "Item Sales Report": {
        columns: ["Item Name", "Quantity Sold", "Total Revenue"],
        dataMapper: (item) => [
          item.item_name || "N/A",
          item.total_sold || 0,
          item.total_revenue ? `$${parseFloat(item.total_revenue).toFixed(2)}` : "$0.00"
        ]
      },
      "Category Sales Report": {
        columns: ["Category", "Total Quantity", "Total Sales"],
        dataMapper: (item) => [
          item.category_name || "N/A",
          item.total_quantity || 0,
          item.total_sales ? `$${parseFloat(item.total_sales).toFixed(2)}` : "$0.00"
        ]
      },
      "X Report (Summary)": {
        columns: ["Total Sessions", "Total Sales", "Total Items Sold", "Total Orders"],
        dataMapper: (item) => [
          item.total_sessions || 0,
          item.total_sales ? `$${parseFloat(item.total_sales).toFixed(2)}` : "$0.00",
          item.total_items_sold || 0,
          item.total_orders || 0
        ]
      },
      "Detailed Transactions": {
        columns: ["Order ID", "Date", "Item Name", "Quantity", "Total Price"],
        dataMapper: (item) => [
          item.order_id || "N/A",
          item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A",
          item.item_name || "N/A",
          item.quantity || 0,
          item.total_price ? `$${parseFloat(item.total_price).toFixed(2)}` : "$0.00"
        ]
      },
      "Staff Summary Report": {
        columns: ["Staff Name", "Role", "Total Orders", "Revenue Generated"],
        dataMapper: (item) => [
          item.staff_name || "N/A",
          item.role || "N/A",
          item.total_orders || 0,
          item.revenue_generated ? `$${parseFloat(item.revenue_generated).toFixed(2)}` : "$0.00"
        ]
      },
      "Financial Summary": {
        columns: ["Gross Sales", "Total Tax", "Total Discount", "Net Sales"],
        dataMapper: (item) => [
          item.gross_sales ? `$${parseFloat(item.gross_sales).toFixed(2)}` : "$0.00",
          item.total_tax ? `$${parseFloat(item.total_tax).toFixed(2)}` : "$0.00",
          item.total_discount ? `$${parseFloat(item.total_discount).toFixed(2)}` : "$0.00",
          item.net_sales ? `$${parseFloat(item.net_sales).toFixed(2)}` : "$0.00"
        ]
      }
    };

    const config = columnConfig[reportType] || columnConfig["Table Revenue Report"];

    // Prepare data for PDF
    const tableData = reportData.data.map(item => config.dataMapper(item));

    // Add table to PDF
    autoTable(doc, {
      head: [config.columns],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save the PDF
    const fileName = `${reportType.replace(/\s+/g, '_')}_${reportBy.replace(/\s+/g, '_')}_${now.getTime()}.pdf`;
    doc.save(fileName);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mt-3">
          Error: {error}
        </Alert>
      );
    }

    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return (
        <div className="bg-white rounded shadow-sm border mt-3 p-5 text-center">
          <p className="text-muted">No data available for the selected filters</p>
        </div>
      );
    }

    // Define column mappings for different report types
    const columnConfig = {
      "Table Revenue Report": {
        columns: ["Table Name", "Total Revenue", "Orders Count"],
        dataMapper: (item) => [
          item.table_name || "N/A",
          item.total_revenue ? `$${parseFloat(item.total_revenue).toFixed(2)}` : "$0.00",
          item.orders_count || 0
        ]
      },
      "Item Sales Report": {
        columns: ["Item Name", "Quantity Sold", "Total Revenue"],
        dataMapper: (item) => [
          item.item_name || "N/A",
          item.total_sold || 0,
          item.total_revenue ? `$${parseFloat(item.total_revenue).toFixed(2)}` : "$0.00"
        ]
      },
      "Category Sales Report": {
        columns: ["Category", "Total Quantity", "Total Sales"],
        dataMapper: (item) => [
          item.category_name || "N/A",
          item.total_quantity || 0,
          item.total_sales ? `$${parseFloat(item.total_sales).toFixed(2)}` : "$0.00"
        ]
      },
      "X Report (Summary)": {
        columns: ["Total Sessions", "Total Sales", "Total Items Sold", "Total Orders"],
        dataMapper: (item) => [
          item.total_sessions || 0,
          item.total_sales ? `$${parseFloat(item.total_sales).toFixed(2)}` : "$0.00",
          item.total_items_sold || 0,
          item.total_orders || 0
        ]
      },
      "Detailed Transactions": {
        columns: ["Order ID", "Date", "Item Name", "Quantity", "Total Price"],
        dataMapper: (item) => [
          item.order_id || "N/A",
          item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A",
          item.item_name || "N/A",
          item.quantity || 0,
          item.total_price ? `$${parseFloat(item.total_price).toFixed(2)}` : "$0.00"
        ]
      },
      "Staff Summary Report": {
        columns: ["Staff Name", "Role", "Total Orders", "Revenue Generated"],
        dataMapper: (item) => [
          item.staff_name || "N/A",
          item.role || "N/A",
          item.total_orders || 0,
          item.revenue_generated ? `$${parseFloat(item.revenue_generated).toFixed(2)}` : "$0.00"
        ]
      },
      "Financial Summary": {
        columns: ["Gross Sales", "Total Tax", "Total Discount", "Net Sales"],
        dataMapper: (item) => [
          item.gross_sales ? `$${parseFloat(item.gross_sales).toFixed(2)}` : "$0.00",
          item.total_tax ? `$${parseFloat(item.total_tax).toFixed(2)}` : "$0.00",
          item.total_discount ? `$${parseFloat(item.total_discount).toFixed(2)}` : "$0.00",
          item.net_sales ? `$${parseFloat(item.net_sales).toFixed(2)}` : "$0.00"
        ]
      }
    };

    const config = columnConfig[reportType] || columnConfig["Table Revenue Report"];

    return (
      <div className="bg-white rounded shadow-sm border mt-3">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h3 className="h5 font-weight-semibold mb-0">{reportType}</h3>
          <span className="text-muted small">
            Report Period: {reportData.reportBy}
          </span>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="bg-light">
              <tr>
                {config.columns.map((column, index) => (
                  <th key={index} className="small text-uppercase text-muted py-2">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {config.dataMapper(item).map((value, colIndex) => (
                    <td key={colIndex} className="py-2">{value || "N/A"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3">
      <div className="">
        <div className="">
          <h1 className="fs-3 fw-bold text-dark">Reports & Analytics</h1>

          {/* Report Controls Section */}
          <div className="bg-white rounded shadow-sm p-3 mb-3 mt-3">
            <Row className="gy-2 gx-3 align-items-end">
              <Col lg={2} md={3} sm={6} xs={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Report By:</Form.Label>
                  <Form.Select
                    value={reportBy}
                    onChange={(e) => setReportBy(e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last year">Last year</option>
                    <option value="Year until end">Year until end</option>
                    <option value="Custom range">Custom range</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {reportBy === "Custom range" && (
                <>
                  <Col lg={2} md={3} sm={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">From:</Form.Label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        className="form-control"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={2} md={3} sm={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">To:</Form.Label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        className="form-control"
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col lg={3} md={4} sm={6} xs={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Report Type:</Form.Label>
                  <Form.Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="X Report (Summary)">X Report (Summary)</option>
                    <option value="Item Sales Report">Item Sales Report</option>
                    <option value="Table Revenue Report">Table Revenue Report</option>
                    <option value="Category Sales Report">Category Sales Report</option>
                    <option value="Detailed Transactions">Detailed Transactions</option>
                    <option value="Staff Summary Report">Staff Summary Report</option>
                    <option value="Financial Summary">Financial Summary</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={2} md={3} sm={6} xs={12}>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => handleExport("pdf")}
                  disabled={loading || exportLoading || !authToken}
                >
                  {exportLoading ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <FaFileExport className="me-2" />
                  )}
                  {exportLoading ? "Exporting..." : "Export"}
                </Button>
              </Col>
            </Row>
          </div>

          {/* Report Display Area */}
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;