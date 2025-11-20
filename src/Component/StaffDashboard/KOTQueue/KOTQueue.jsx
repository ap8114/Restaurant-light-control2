import React, { useState, useEffect, useCallback } from 'react';
import {
  RiDashboardLine, RiShoppingCartLine, RiPrinterLine, RiGamepadLine,
  RiUserLine, RiBarChartLine, RiPrinterFill, RiRefreshLine,
  RiSearchLine, RiRestaurantLine, RiCupLine, RiCheckLine,
  RiTimeLine, RiTimerLine
} from 'react-icons/ri';
import axiosInstance from "../../../utils/axiosInstance";

const KOTQueue = () => {
  const [activeTab, setActiveTab] = useState('activeKots');
  const [lastUpdated, setLastUpdated] = useState(0);
  const [printerData, setPrinterData] = useState({ printers: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All Subcategories');

  // Derived state for all orders (flat list)
  const allOrders = printerData.printers.flatMap(printer => printer.items);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/orders/pending");
      console.log("Fetched orders:", res.data);
      if (res.data.success) {
        setPrinterData(res.data.data);
        setLastUpdated(0); // Reset timer
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Timer for last updated
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update order status
  const updateOrderStatus = async (itemId, status) => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(`/orders/items/${itemId}/status`, {
        status: status
      });
      if (response.data.success) {
        // Update local state
        setPrinterData(prevData => {
          const updatedPrinters = prevData.printers.map(printer => {
            const updatedItems = printer.items.map(item => {
              if (item.item_id === itemId) {
                return { ...item, item_status: status };
              }
              return item;
            });
            return { ...printer, items: updatedItems };
          });
          return { ...prevData, printers: updatedPrinters };
        });
      } else {
        console.error('Failed to update status:', response.data.message);
        alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get printer details dynamically
  const getPrinterDetails = (printerId) => {
    const printer = printerData.printers.find(p => p.printer_id === printerId);
    if (!printer) return {
      title: `Printer ${printerId}`,
      subtitle: 'Items routing',
      iconColor: 'gray',
      statusText: 'Sent'
    };

    // Determine printer type based on items categories
    const hasBeverages = printer.items.some(item => item.category_name === "Beverages");
    const hasDesert = printer.items.some(item => item.category_name === "Desert");

    if (hasBeverages && !hasDesert) {
      return {
        title: 'Bar Printer',
        subtitle: 'Beverage items routing',
        iconColor: 'blue',
        statusText: 'Sent to Bar'
      };
    } else if (hasDesert && !hasBeverages) {
      return {
        title: 'Kitchen Printer',
        subtitle: 'Food items routing',
        iconColor: 'orange',
        statusText: 'Sent to Kitchen'
      };
    } else {
      return {
        title: `Printer ${printerId}`,
        subtitle: 'Mixed items routing',
        iconColor: 'purple',
        statusText: 'Sent'
      };
    }
  };

  // Calculate time elapsed
  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (lastUpdated < 60) {
      return `Last updated: ${lastUpdated} seconds ago`;
    } else {
      const minutes = Math.floor(lastUpdated / 60);
      return `Last updated: ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  // Get unique categories and subcategories from API data
  const categories = [...new Set(allOrders.map(order => order.category_name))];
  const subcategories = [...new Set(allOrders.map(order => order.subcategory_name))];

  // Filter orders based on search and category/subcategory
  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.table_name && order.table_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All Categories' ||
      order.category_name === categoryFilter;

    const matchesSubcategory = subcategoryFilter === 'All Subcategories' ||
      order.subcategory_name === subcategoryFilter;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Calculate stats
  const completedToday = allOrders.filter(order => order.item_status !== 'pending').length;
  const pendingOrders = allOrders.filter(order => order.item_status === 'pending').length;
  const activePrinters = printerData.printers.length;

  return (
    <div className='p-3'>
      {/* Main Content */}
      <div className="">
        {/* Header */}
        <header className="">
          <div className=" d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div>
                <h1 className="fs-3 fw-bold text-dark">KOT Queue Management</h1>
                <p className="text-muted small">Monitor and manage kitchen order tickets</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="kot-update-status d-flex align-items-center gap-2 small text-muted">
                <div className="kot-status-indicator bg-success rounded-circle"></div>
                <span>{formatLastUpdated()}</span>
              </div>
              <button
                className="kot-refresh-btn btn btn-warning text-dark rounded-1 fw-medium d-flex align-items-center"
                onClick={fetchOrders}
                disabled={loading}
              >
                <RiRefreshLine className="me-2" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="kot-content-container">
          {/* Tab Navigation */}
          <div className="kot-tab-navigation mb-4">
            <div className="kot-tab-buttons bg-light p-1 rounded d-inline-flex">
              <button
                className={`kot-tab-btn btn ${activeTab === 'activeKots' ? 'btn-warning text-dark' : 'text-muted'} rounded-1 fw-medium px-4 py-2`}
                onClick={() => setActiveTab('activeKots')}
              >
                View Active KOTs
              </button>
              <button
                className={`kot-tab-btn btn ${activeTab === 'printerRouting' ? 'btn-warning text-dark' : 'text-muted'} rounded-1 fw-medium px-4 py-2`}
                onClick={() => setActiveTab('printerRouting')}
              >
                Printer-Wise Routing
              </button>
            </div>
          </div>

          {/* Active KOTs Section */}
          {activeTab === 'activeKots' && (
            <div className="kot-active-kots-section">
              <div className="kot-section-header d-flex justify-content-between align-items-center mb-4">
                <h2 className="kot-section-title text-dark fs-5 fw-semibold">Active Kitchen Order Tickets</h2>
                <div className="kot-section-filters d-flex align-items-center gap-3">
                  <div className="kot-search-input position-relative">
                    <input
                      type="text"
                      placeholder="Search KOTs..."
                      className="kot-search-field form-control ps-4 pe-3 py-2 border rounded-1"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <RiSearchLine className="kot-search-icon position-absolute top-50 start-0 translate-middle-y ms-1 text-muted" />
                  </div>
                  <select
                    className="kot-category-select form-select px-3 py-2 border rounded-1 me-2"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option>All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    className="kot-subcategory-select form-select px-3 py-2 border rounded-1"
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                  >
                    <option>All Subcategories</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="kot-table-container bg-white rounded shadow-sm border border-light overflow-hidden">
                <div className="table-responsive">
                  <table className="kot-table table mb-0">
                    <thead className="kot-table-header bg-light border-bottom border-light">
                      <tr>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          KOT Number
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Table/Session
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Items
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Category
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Subcategory
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Time Elapsed
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Status
                        </th>
                        <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="kot-table-body">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            {searchTerm || categoryFilter !== 'All Categories' || subcategoryFilter !== 'All Subcategories'
                              ? 'No orders match your filters'
                              : 'No active orders found'}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, index) => (
                          <tr key={`${order.order_id}-${order.item_id}`} className="kot-table-row">
                            <td className="kot-table-td px-4 py-3">
                              <div className="kot-id fw-medium text-dark">
                                #{order.order_number}
                              </div>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <div className="kot-table-info">{order.table_name || 'N/A'}</div>
                              <div className="kot-session-info small text-muted">
                                {order.table_number || 'N/A'}
                              </div>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <div className="kot-item-info">
                                {order.item_name} × {order.quantity}
                              </div>
                              {order.special_instructions && (
                                <div className="kot-item-note small text-muted">
                                  Note: {order.special_instructions}
                                </div>
                              )}
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <span className={`kot-category-badge d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-medium ${order.category_name === "Beverages"
                                ? "bg-blue-100 text-blue-800"
                                : order.category_name === "Desert"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-orange-100 text-orange-800"
                                }`}>
                                {order.category_name === "Beverages"
                                  ? <RiCupLine className="me-1" />
                                  : order.category_name === "Desert"
                                    ? <RiRestaurantLine className="me-1" />
                                    : <RiRestaurantLine className="me-1" />}
                                {order.category_name}
                              </span>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <span className={`kot-subcategory-badge d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-medium ${order.subcategory_name === "hot" || order.subcategory_name === "cold"
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-pink-100 text-pink-800"
                                }`}>
                                {order.subcategory_name}
                              </span>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <div className="kot-time-elapsed small fw-medium text-warning">
                                {getTimeElapsed(order.created_at)}
                              </div>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              <span className={`kot-status-badge d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-medium ${order.item_status === "pending"
                                ? "bg-warning-100 text-warning-800"
                                : "bg-success-100 text-success-800"
                                }`}>
                                {order.item_status}
                              </span>
                            </td>
                            <td className="kot-table-td px-4 py-3">
                              {order.item_status === "pending" ? (
                                <button
                                  className="kot-complete-btn btn btn-success text-white rounded-1 small fw-medium px-3 py-1"
                                  onClick={() => updateOrderStatus(order.item_id, 'ready')}
                                  disabled={loading}
                                >
                                  {loading ? 'Updating...' : 'Mark Complete'}
                                </button>
                              ) : (
                                <button
                                  className="kot-completed-btn btn btn-light text-muted rounded-1 small fw-medium px-3 py-1"
                                  disabled
                                >
                                  Completed
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Printer Routing Section */}
          {activeTab === 'printerRouting' && (
            <div className="kot-printer-routing-section">
              <h2 className="kot-section-title text-dark fs-5 fw-semibold mb-4">Printer-Wise Routing Status</h2>
              <div className="kot-printer-grid row g-4">
                {printerData.printers.map((printer) => {
                  const details = getPrinterDetails(printer.printer_id);
                  return (
                    <div key={printer.printer_id} className="kot-printer-card col-lg-6">
                      <div className="kot-card bg-white rounded shadow-sm border border-light p-4 h-100">
                        <div className="kot-printer-header d-flex justify-content-between align-items-center mb-4">
                          <div className="kot-printer-info d-flex align-items-center gap-3">
                            <div className={`kot-printer-icon bg-${details.iconColor}-100 rounded-2 d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                              <RiPrinterFill className={`text-${details.iconColor}-600 fs-5`} />
                            </div>
                            <div>
                              <h3 className="kot-printer-title text-dark fs-5 fw-semibold">{details.title}</h3>
                              <p className="kot-printer-subtitle small text-muted">{details.subtitle}</p>
                            </div>
                          </div>
                          <div className="kot-printer-status d-flex align-items-center gap-2">
                            <div className="kot-status-indicator bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                            <span className="kot-status-text small fw-medium text-success">Online</span>
                          </div>
                        </div>
                        <div className="kot-order-list">
                          {printer.items.length === 0 ? (
                            <div className="text-center py-4 text-muted">No orders for this printer</div>
                          ) : (
                            printer.items.map((order, index) => (
                              <div key={`${order.order_id}-${order.item_id}`} className="kot-order-card border border-light rounded-1 p-3 mb-3">
                                <div className="kot-order-header d-flex justify-content-between align-items-center mb-2">
                                  <span className="kot-order-id fw-medium text-dark">#{order.order_number}</span>
                                  <span className={`kot-order-status small px-2 py-1 rounded-pill fw-medium ${order.item_status === "pending"
                                    ? "bg-warning text-dark"
                                    : "bg-success-100 text-success-800"
                                    }`}>
                                    {order.item_status === "pending" ? details.statusText : "Completed"}
                                  </span>
                                </div>
                                <div className="kot-order-items small text-muted">
                                  {order.item_name} × {order.quantity}
                                </div>
                                <div className="kot-order-details d-flex justify-content-between mt-2">
                                  <div className="kot-order-category small">
                                    <span className="fw-medium">Category:</span> {order.category_name}
                                  </div>
                                  <div className="kot-order-subcategory small">
                                    <span className="fw-medium">Subcategory:</span> {order.subcategory_name}
                                  </div>
                                </div>
                                <div className="kot-order-time small text-muted mt-2">
                                  {order.table_name || 'N/A'} • {getTimeElapsed(order.created_at)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Printer Stats */}
              <div className="kot-printer-stats bg-white rounded shadow-sm border border-light p-4 mt-4">
                <h3 className="kot-stats-title text-dark fs-5 fw-semibold mb-3">Printer Status Overview</h3>
                <div className="kot-stats-grid row">
                  <div className="kot-stat-col col-md-3 text-center">
                    <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)'
                    }}>
                      <RiCheckLine className="text-green-500 fs-4" style={{ color: '#22c55e' }} />
                    </div>
                    <div className="kot-stat-value text-dark fs-3 fw-bold">
                      {completedToday}
                    </div>
                    <div className="kot-stat-label small text-muted">Completed Today</div>
                  </div>
                  <div className="kot-stat-col col-md-3 text-center">
                    <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'rgba(249, 115, 22, 0.1)'
                    }}>
                      <RiTimeLine className="fs-4" style={{ color: '#f97316' }} />
                    </div>
                    <div className="kot-stat-value text-dark fs-3 fw-bold">
                      {pendingOrders}
                    </div>
                    <div className="kot-stat-label small text-muted">Pending Orders</div>
                  </div>
                  <div className="kot-stat-col col-md-3 text-center">
                    <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }}>
                      <RiPrinterLine className="fs-4" style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="kot-stat-value text-dark fs-3 fw-bold">
                      {activePrinters}
                    </div>
                    <div className="kot-stat-label small text-muted">Active Printers</div>
                  </div>
                  <div className="kot-stat-col col-md-3 text-center">
                    <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)'
                    }}>
                      <RiTimerLine className="fs-4" style={{ color: '#a855f7' }} />
                    </div>
                    <div className="kot-stat-value text-dark fs-3 fw-bold">
                      {pendingOrders > 0
                        ? (allOrders.reduce((sum, order) => {
                          const elapsed = (new Date() - new Date(order.created_at)) / 60000;
                          return sum + elapsed;
                        }, 0) / pendingOrders).toFixed(1)
                        : '0.0'
                      }
                    </div>
                    <div className="kot-stat-label small text-muted">Avg. Time (min)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KOTQueue;