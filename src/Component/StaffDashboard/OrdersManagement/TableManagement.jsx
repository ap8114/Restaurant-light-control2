import React, { useState, useEffect } from 'react';
import './TableManagement.css';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInstance';

const TableManagement = ({ orders = [], onJumpToOrders, onSelectTable }) => {
  // State management
  const [activeTab, setActiveTab] = useState('Electric');
  const [quickJumpInput, setQuickJumpInput] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPanel, setShowPanel] = useState(!isMobile);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('dining');
  const [searchTerm, setSearchTerm] = useState('');

  // Table categories
  const electricCategories = [
    { id: 'snooker', name: 'Snooker' },
    { id: 'pool', name: 'Pool' },
    { id: 'playstation', name: 'PlayStation' }
  ];

  const nonElectricCategories = [
    { id: 'dining', name: 'Dining' },
    { id: 'largetable', name: 'Large Table' }
  ];

  // Fetch tables from API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/tables`);
        setTables(response.data.data.tables);
      } catch (err) {
        setError('Failed to fetch tables');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowPanel(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJump = () => {
    const table = tables.find(t => t.table_number === quickJumpInput);
    if (table) {
      const tableElement = document.getElementById(`table-${table.id}`);
      if (tableElement) {
        document.querySelectorAll('.table-highlight').forEach((el) => {
          el.classList.remove('table-highlight', 'animate-pulse');
        });
        tableElement.classList.add('table-highlight', 'animate-pulse');
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          tableElement.classList.remove('table-highlight', 'animate-pulse');
        }, 2000);
      }
    }
  };

  // Handle table selection
  const handleTableSelect = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setSelectedTable(tableId);
      // Pass the entire table object instead of just the table number
      onSelectTable(table);
      onJumpToOrders();
    }
  };

  const getTableOrders = (tableId) => {
    return orders.filter(order =>
      String(order.table_id) === String(tableId) && order.status !== "paid"
    );
  };

  // Get tables by category and search term
  const getFilteredTables = () => {
    let filteredTables = tables.filter(table => table.table_type == selectedCategory);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredTables = filteredTables.filter(table =>
        table.table_name.toLowerCase().includes(term) ||
        table.table_number.toLowerCase().includes(term) ||
        table.id.toString().includes(term)
      );
    }

    return filteredTables;
  };

  // Render table based on category
  const renderTable = (table) => {
    const statusColor =
      table.status === 'occupied' ? '#4CAF50' :
        table.status === 'reserved' ? '#FFC107' : '#9E9E9E';

    const isElectric = electricCategories.some(cat => cat.id === table.table_type);

    return (
      <div
        key={table.id}
        id={`table-${table.id}`}
        className={`table-selectable ${selectedTable === table.id ? 'selected' : ''} ${isElectric ? 'electric-table' : 'non-electric-table'}`}
        style={{ borderColor: statusColor, cursor: 'pointer' }}
        onClick={() => handleTableSelect(table.id)}
      >
        <div className="table-number">{table.table_number}</div>
        <div className="table-name">{table.table_name}</div>
        {/* Status inside card, styled */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // Center horizontally
          margin: '8px 0'
        }}>
          <div
            className="table-status-indicator"
            style={{
              backgroundColor: statusColor,
              width: 16,
              height: 16,
              borderRadius: '50%',
              marginRight: 8,
              border: '1px solid #ccc'
            }}
          ></div>
          <span style={{ fontWeight: 500 }}>
            {table.status === "reserved" ? "Reserved" : "Available"}
          </span>
        </div>
        {table.hourly_rate && (
          <div className="table-rate">${table.hourly_rate}/hr</div>
        )}
        {table.capacity && (
          <div className="table-capacity">Capacity: {table.capacity}</div>
        )}
        {selectedTable === table.id && (
          <div className="table-orders-history">
            <h4>Previous Orders</h4>
            {getTableOrders(table.id).length > 0 ? (
              getTableOrders(table.id).map(order => (
                <div key={order.id} className="order-history-item">
                  <div>Order #{order.order_number}</div>
                  <div>Date: {new Date(order.created_at).toLocaleString()}</div>
                  <div>Total: ${order.total_amount}</div>
                  <div>Status: {order.status}</div>
                </div>
              ))
            ) : (
              <div>No previous orders for this table.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render category section
  const renderCategorySection = (categories, title) => (
    <div className="category-section">
      <h3 className="category-title">{title}</h3>
      <div className="categories-container">
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="category-icon">
              {category.id === 'snooker' && '🎱'}
              {category.id === 'pool' && '🎱'}
              {category.id === 'playstation' && '🎮'}
              {category.id === 'dining' && '🍽️'}
              {category.id === 'largetable' && '🪑'}
            </div>
            <div className="category-name">{category.name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const updateTableStatus = async (table, status) => {
    try {
      await axiosInstance.put(`/tables/${table.id}`, {
        ...table,
        status,
      });
      // Optionally update local state for instant UI feedback
      setTables(prev =>
        prev.map(t => t.id === table.id ? { ...t, status } : t)
      );
    } catch (err) {
      console.error('Failed to update table status', err);
    }
  };

  useEffect(() => {
    tables.forEach(table => {
      const hasUnpaid = orders.some(
        order => String(order.table_id) === String(table.id) && order.status !== "paid"
      );
      if (table.status === "available" && hasUnpaid) {
        updateTableStatus(table, "reserved");
      } else if (table.status === "reserved" && !hasUnpaid) {
        updateTableStatus(table, "available");
      }
    });
  }, [orders, tables]);

  if (loading) {
    return <div className="loading">Loading tables...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="table-management-container">
      <div className="main-content">
        {/* Left Panel - Categories */}
        <div className="categories-panel">
          {renderCategorySection(nonElectricCategories, 'Tables')}
        </div>

        {/* Right Panel - Tables */}
        <div className="tables-panel">
          <div className="tables-header">
            <h2>
              {nonElectricCategories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="table-count">
              {getFilteredTables().length} tables
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by name, number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="tables-grid">
            {getFilteredTables().length > 0 ? (
              getFilteredTables().map(renderTable)
            ) : (
              <div className="no-tables-message">
                {searchTerm ? "No tables match your search" : "No tables available in this category"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      {showPanel && (
        <div className="control-panel">
          <h2>Table Management</h2>
          <div className="panel-content">
            <input
              type="text"
              placeholder="Enter table number"
              value={quickJumpInput}
              onChange={(e) => setQuickJumpInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJump()}
            />
            <div className="action-buttons">
              <button
                className="jump-btn"
                onClick={() => {
                  handleJump();
                  if (quickJumpInput) {
                    const table = tables.find(t => t.table_number === quickJumpInput);
                    if (table) {
                      handleTableSelect(table.id);
                    }
                  }
                }}
              >
                Jump to Table
              </button>
            </div>
            <div className="status-legend">
              <h3>Table Status</h3>
              <div className="legend-item">
                <div className="status-indicator occupied"></div>
                <span>Occupied</span>
              </div>
              <div className="legend-item">
                <div className="status-indicator available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="status-indicator reserved"></div>
                <span>Reserved</span>
              </div>
            </div>
          </div>
          {isMobile && (
            <button className="close-panel-btn" onClick={() => setShowPanel(false)}>
              Close Panel
            </button>
          )}
        </div>
      )}
      {!showPanel && isMobile && (
        <button className="show-panel-btn" onClick={() => setShowPanel(true)}>
          Show Panel
        </button>
      )}
    </div>
  );
};

export default TableManagement;