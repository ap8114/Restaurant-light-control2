import React, { useState, useEffect } from "react";
import { apiUrl } from "../../../utils/config";
import axios from "axios";
import axiosInstance from "../../../utils/axiosInstance";
import { RiEditLine } from "react-icons/ri";

const categoryOrder = {
  electric: ["playstation", "pool", "snooker"],
  nonElectric: ["dining", "largetable"],
};

const getCategoryIcon = (type) => {
  switch (type) {
    case "pool":
      return "🎱";
    case "snooker":
      return "🎯";
    case "playstation":
      return "🎮";
    case "largetable":
      return "🪑";
    default:
      return "🍽️";
  }
};

const getCategoryColor = (type) => {
  switch (type) {
    case "largetable":
      return "#8d2606ff";
    case "dining":
      return "#fd7e14";
    case "pool":
      return "#17a2b8";
    case "snooker":
      return "#28a745";
    case "playstation":
      return "#6f42c1";
    case "food":
      return "#fd7e14";
    case "all":
      return "#ffc107";
    default:
      return "#adb5bd";
  }
};

const statusColors = {
  available: "#9e9e9eff",
  occupied: "#4CAF50",
  reserved: "#FFC107",
  inactive: "#f44336",
};

const Tables = () => {
  // State management
  const [tablesByCategory, setTablesByCategory] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPanel, setShowPanel] = useState(!isMobile);

  // Modal states
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  // Group form state with minimumSessionTime
  const [groupForm, setGroupForm] = useState({
    id: null,
    name: "",
    selectedTables: [],
    hourlyRate: "",
    fixedRate: "",
    discount: "",
    minimumSessionTime: "",
  });

  // Tables and groups
  const [tables, setTables] = useState([]);
  const [groupTables, setGroupTables] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableActions, setShowTableActions] = useState(false);

  // Filter states
  const [electricFilter, setElectricFilter] = useState(["pool", "snooker", "playstation"]);
  const [nonElectricFilter, setNonElectricFilter] = useState(["dining", "largetable"]);
  const [selectedElectricType, setSelectedElectricType] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Multi-select states
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Table form state with hourlyRate and location
  const [tableForm, setTableForm] = useState({
    group: "",
    name: "",
    type: "",
    seats: "",
    plugId: "",
    status: "available",
    hourlyRate: "",
    location: "",
    count: ""
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowPanel(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGroupFormChange = (e) => {
    const { name, value } = e.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableSelection = (tableId) => {
    setGroupForm((prev) => {
      const currentSelectedTables = Array.isArray(prev.selectedTables) ? prev.selectedTables : [];
      return {
        ...prev,
        selectedTables: currentSelectedTables.includes(tableId)
          ? currentSelectedTables.filter((id) => id !== tableId)
          : [...currentSelectedTables, tableId],
      };
    });
  };

  const handleDeleteTable = async (tableId) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await axiosInstance.delete(`/tables/${tableId}`);
        setTables((prev) => prev.filter((table) => table.id !== tableId));
        setGroupTables((prev) => prev.filter((table) => table.id !== tableId));
        setGroups((prev) =>
          prev.map((group) => ({
            ...group,
            selectedTables: group.selectedTables.filter((id) => id !== tableId),
          }))
        );
        setShowTableActions(false);
        alert("Table deleted successfully!");
        window.location.reload();
      } catch (error) {
        console.error("Error deleting table:", error);
        alert("Failed to delete table. Please try again.");
      }
    }
  };

  const handleDeleteMultipleTables = async () => {
    if (selectedTableIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTableIds.length} tables?`)) {
      try {
        await axiosInstance.delete(`/tables`, {
          data: { ids: selectedTableIds }
        });
        setTables((prev) => prev.filter((table) => !selectedTableIds.includes(table.id)));
        setGroupTables((prev) => prev.filter((table) => !selectedTableIds.includes(table.id)));
        setGroups((prev) =>
          prev.map((group) => ({
            ...group,
            selectedTables: group.selectedTables.filter((id) => !selectedTableIds.includes(id)),
          }))
        );
        setSelectedTableIds([]);
        setIsMultiSelectMode(false);
        alert(`${selectedTableIds.length} tables deleted successfully!`);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting tables:", error);
        alert("Failed to delete tables. Please try again.");
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await axiosInstance.delete(`/tables/tablegroups/${groupId}`);
        setGroups((prev) => prev.filter((group) => group.id !== groupId));
        alert("Group deleted successfully!");
        window.location.reload();
      } catch (error) {
        console.error("❌ Error deleting group:", error);
        alert("Failed to delete group!");
      }
    }
  };

  const handleTableClick = (table, event) => {
    event.stopPropagation();
    if (isMultiSelectMode) {
      setSelectedTableIds(prev =>
        prev.includes(table.id)
          ? prev.filter(id => id !== table.id)
          : [...prev, table.id]
      );
    } else {
      setSelectedTable(table);
      setShowTableActions(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowTableActions(false);
    };
    if (showTableActions) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showTableActions]);

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedTableIds([]);
    }
  };

  const allTableData = [...tables, ...groupTables];

  const renderTableCard = (table) => {
    const isSelected = selectedTableIds.includes(table.id);
    return (
      <div
        key={table.id}
        id={`table-${table.id}`}
        onClick={(e) => handleTableClick(table, e)}
        style={{
          background: "#fff",
          border: `3px solid ${isSelected ? "#ff6b6b" : statusColors[table.status] || "#bbb"}`,
          borderRadius: "12px",
          margin: "15px",
          padding: "12px",
          minWidth: "150px",
          maxWidth: "200px",
          minHeight: "150px",
          maxHeight: "200px",
          boxShadow:
            selectedTable?.id === table.id
              ? "0 0 8px #ffc107"
              : isSelected
                ? "0 0 8px #ff6b6b"
                : "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s",
          textAlign: "center",
        }}
      >
        {isMultiSelectMode && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              zIndex: 10,
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedTableIds(prev =>
                  prev.includes(table.id)
                    ? prev.filter(id => id !== table.id)
                    : [...prev, table.id]
                );
              }}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
              }}
            />
          </div>
        )}
        <div
          style={{
            fontSize: "40px",
            marginBottom: "8px",
          }}
        >
          {getCategoryIcon(table.table_type)}
        </div>
        <div
          style={{
            fontWeight: "bold",
            color: "#333",
            marginBottom: "3px",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={table.table_name}
        >
          {table.table_name}
        </div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          Status: {table.status}
        </div>
        {table.guests > 0 && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "#17a2b8",
              color: "#fff",
              borderRadius: "10px",
              padding: "3px 7px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Guests: {table.guests}
          </div>
        )}
        {table.seats && (
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            Seats: {table.seats}
          </div>
        )}
        {table.group && (
          <div
            style={{
              marginTop: "2px",
              fontSize: "11px",
              background: "#ffc10760",
              color: "#444",
              borderRadius: "7px",
              padding: "2px 7px",
            }}
          >
            Group: {table.group}
          </div>
        )}
      </div>
    );
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: groupForm.name,
        description: groupForm.description || "Group for selected tables",
        hourly_rate: groupForm.hourlyRate,
        fixed_rate: groupForm.fixedRate,
        discout: groupForm.discount,
        minimum_session_time: groupForm.minimumSessionTime || null,
        selected_pool: Array.isArray(groupForm.selectedTables)
          ? groupForm.selectedTables.join(",")
          : groupForm.selectedTables,
      };
      let res;
      if (editingGroup) {
        res = await axiosInstance.put(`/tables/tablegroups/${groupForm.id}`, payload);
        console.log("✅ Group updated:", res.data);
        alert("Group updated successfully!");
        window.location.reload();
      } else {
        res = await axiosInstance.post(`/tables/groups`, payload);
        console.log("✅ Group created:", res.data);
        alert("Group created successfully!");
        window.location.reload();
      }
      setGroupModalOpen(false);
      setGroupForm({
        id: null,
        name: "",
        description: "",
        hourlyRate: "",
        fixedRate: "",
        discount: "",
        minimumSessionTime: "",
        selectedTables: [],
      });
      setEditingGroup(null);
    } catch (error) {
      console.error("❌ Error creating/updating group:", error);
      alert(editingGroup ? "Failed to update group!" : "Failed to create group!");
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axiosInstance.get(`tables/groups/all`);
        console.log("Groups API Data:", res.data);
        setGroups(res.data.data.groups);
      } catch (error) {
        console.error("❌ Error fetching groups:", error);
      }
    };
    fetchGroups();
  }, []);

  const [plugs, setPlugs] = useState([]);
  const fetchPlugs = async () => {
    try {
      const res = await axiosInstance.get("/plugs");
      const plugsData = res.data?.data?.plugs || [];
      setPlugs(plugsData);
    } catch (err) {
      console.error("❌ Error fetching plugs:", err.message);
    }
  };

  useEffect(() => {
    if (tableModalOpen) {
      fetchPlugs();
    }
  }, [tableModalOpen]);

  const randomnumber = () => {
    return Math.floor(Math.random() * 1000) + 1;
  };

  const handleTableFormChange = (e) => {
    const { name, value } = e.target;

    // Special handling for group selection to auto-populate hourly rate
    if (name === "group" && value) {
      const selectedGroup = groups.find(g => g.id === parseInt(value));
      if (selectedGroup) {
        setTableForm(prev => ({
          ...prev,
          group: value,
          hourlyRate: selectedGroup.hourly_rate
        }));
        return;
      }
    }

    // For all other fields
    setTableForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm({
      name: table.table_name,
      type: table.table_type,
      group: table.group_id,
      seats: table.capacity,
      plugId: table.plug_id,
      status: table.status,
      hourlyRate: table.hourly_rate,
      location: table.location,
    });
    setTableModalOpen(true);
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = {
        table_number: editingTable ? editingTable.table_number : randomnumber(),
        table_name: tableForm.name || editingTable?.table_name,
        table_type: tableForm.type || editingTable?.table_type,
        group_id: parseInt(tableForm.group || editingTable?.group_id, 10) || null,
        capacity: tableForm.seats || editingTable?.capacity || 4,
        plug_id: tableForm.plugId || editingTable?.plug_id || null,
        status: tableForm.status || editingTable?.status || "available",
        location: tableForm.location || editingTable?.location || "Main Hall",
        hourly_rate: tableForm.hourlyRate || editingTable?.hourly_rate || "0",
      };

      if (!editingTable) {
        payload.count = parseInt(tableForm.count);
      }

      let res;
      if (editingTable) {
        res = await axiosInstance.put(`tables/${editingTable.id}`, payload);
        console.log("✅ Table Updated:", res.data);
        alert("Table updated successfully!");
        window.location.reload();
      } else {
        res = await axiosInstance.post(`tables`, payload);
        console.log("✅ Table Added:", res.data);
        alert("Table added successfully!");
        window.location.reload();
      }
      setTableModalOpen(false);
      setEditingTable(null);
      setTableForm({
        group: "",
        name: "",
        type: "",
        seats: "",
        plugId: "",
        status: "available",
        hourlyRate: "",
        location: "",
        count: ""
      });
      fetchTables();
    } catch (err) {
      console.error("❌ Error saving table:", err.response?.data || err.message);
      alert("Failed to save table");
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axiosInstance.get(`/tables`);
      console.log("API response:", res.data);
      let tables = res.data?.data?.tables || [];
      
      // Apply group filter if a specific group is selected
      if (selectedGroup !== "all") {
        tables = tables.filter(table => table.group_id === parseInt(selectedGroup));
      }
      
      // Apply electric type filter if a specific type is selected
      if (selectedElectricType !== "all") {
        tables = tables.filter(table => table.table_type === selectedElectricType);
      }
      
      const electricTables = tables.filter((t) =>
        electricFilter.includes(t.table_type)
      );
      const nonElectricTables = tables.filter((t) =>
        nonElectricFilter.includes(t.table_type)
      );
      setTablesByCategory([
        { category: "electric", tables: electricTables },
        { category: "non-electric", tables: nonElectricTables },
      ]);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [electricFilter, nonElectricFilter, selectedElectricType, selectedGroup]);

  const [quickJumpInput, setQuickJumpInput] = useState("");
  const handleJump = async () => {
    const num = parseInt(quickJumpInput, 10);
    if (isNaN(num)) return;
    try {
      const res = await axiosInstance.get(`/tables/${num}`);
      if (res.data?.success && res.data?.data?.table) {
        const table = res.data.data.table;
        const tableElement = document.getElementById(`table-${table.id}`);
        if (tableElement) {
          document.querySelectorAll(".table-highlight").forEach((el) => {
            el.classList.remove("table-highlight", "animate-pulse");
          });
          tableElement.classList.add("table-highlight", "animate-pulse");
          tableElement.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            tableElement.classList.remove("table-highlight", "animate-pulse");
          }, 2000);
        } else {
          alert(`Table with ID ${table.id} not found in DOM.`);
        }
      } else {
        alert("Table not found in API.");
      }
    } catch (err) {
      console.error("Error fetching table:", err);
      alert("Failed to fetch table. Please try again.");
    }
  };

  const handleElectricTypeChange = (e) => {
    const value = e.target.value;
    setSelectedElectricType(value);
    if (value === "all") {
      setElectricFilter(["pool", "snooker", "playstation"]);
    } else {
      setElectricFilter([value]);
    }
  };

  const handleGroupFilterChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  const areAllElectricFiltersSelected = electricFilter.length === 3;
  const areAllNonElectricFiltersSelected = nonElectricFilter.length === 2;

  const FilterButton = ({ type, active, onClick, icon, label }) => (
    <button
      onClick={() => onClick(type)}
      style={{
        padding: "8px 12px",
        margin: "0 5px 5px 0",
        borderRadius: "20px",
        border: "none",
        backgroundColor: active ? getCategoryColor(type) : "#efece9ff",
        color: active ? "white" : "#575249ff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "14px",
        fontWeight: "bold",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div>
      {/* Quick Jump */}
      <div
        style={{
          marginBottom: "20px",
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
              flex: "1 1 300px",
            }}
          >
            <label style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
              Quick Jump to Table:
            </label>
            <input
              type="number"
              value={quickJumpInput}
              onChange={(e) => setQuickJumpInput(e.target.value)}
              placeholder="Enter table ID"
              style={{
                padding: "5px 10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
                maxWidth: "100%",
              }}
            />
            <button
              onClick={handleJump}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                padding: "5px 15px",
                borderRadius: "4px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Jump
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flex: "1 1 200px",
            }}
          >
            <button
              onClick={toggleMultiSelectMode}
              style={{
                backgroundColor: isMultiSelectMode ? "#dc3545" : "#6c757d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                flex: "1 1 auto",
              }}
            >
              {isMultiSelectMode ? "Cancel Selection" : "Select Multiple"}
            </button>
            {isMultiSelectMode && selectedTableIds.length > 0 && (
              <button
                onClick={handleDeleteMultipleTables}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  flex: "1 1 auto",
                }}
              >
                Delete Selected ({selectedTableIds.length})
              </button>
            )}
            <button
              onClick={() => setTableModalOpen(true)}
              style={{
                backgroundColor: "#ffc107",
                color: "black",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                flex: "1 1 auto",
              }}
            >
              + Add Table
            </button>
            <button
              onClick={() => setGroupModalOpen(true)}
              style={{
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                flex: "1 1 auto",
              }}
            >
              + Add Group
            </button>
          </div>
        </div>
      </div>

      {isMultiSelectMode && (
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #bbdefb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <strong>Multi-select mode:</strong> Click on tables to select them.
            {selectedTableIds.length > 0 ? ` ${selectedTableIds.length} table(s) selected.` : " No tables selected yet."}
          </div>
          <button
            onClick={toggleMultiSelectMode}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #2196f3",
              color: "#2196f3",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}

      <div className="bg-white p-4 p-md-5 rounded shadow-sm mb-4 min-height-600">
        {tablesByCategory.map((cat) => {
          if (
            cat.tables.length === 0 ||
            (cat.category === "electric" && electricFilter.length === 0) ||
            (cat.category === "non-electric" && nonElectricFilter.length === 0)
          ) {
            return null;
          }
          return (
            <div key={cat.category} className="mb-4 mb-md-5">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                <h2
                  className="text-white p-3 rounded fs-5 fs-md-4 fw-bold text-start mb-3 mb-md-0"
                  style={{
                    background: getCategoryColor(
                      cat.category === "electric" ? "playstation" : "food"
                    )
                  }}
                >
                  {cat.category === "electric"
                    ? "Smart"
                    : "Tables"}
                </h2>
                <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-md-end">
                  {cat.category === "electric" && (
                    <div className="d-flex align-items-center gap-2">
                      <select
                        value={selectedElectricType}
                        onChange={handleElectricTypeChange}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          backgroundColor: "white",
                          color: "#333",
                          fontWeight: "bold",
                        }}
                      >
                        <option value="all">All Types</option>
                        <option value="pool">Pool</option>
                        <option value="snooker">Snooker</option>
                        <option value="playstation">PlayStation</option>
                      </select>
                      
                      <select
                        value={selectedGroup}
                        onChange={handleGroupFilterChange}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          backgroundColor: "white",
                          color: "#333",
                          fontWeight: "bold",
                        }}
                      >
                        <option value="all">All Groups</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {cat.category === "non-electric" && (
                    <>
                      <FilterButton
                        type="all"
                        active={areAllNonElectricFiltersSelected}
                        onClick={() => setNonElectricFilter(["dining", "largetable"])}
                        icon=""
                        label="All"
                      />
                      <FilterButton
                        type="dining"
                        active={nonElectricFilter.includes("dining")}
                        onClick={() => setNonElectricFilter(["dining"])}
                        icon=""
                        label="Dining"
                      />
                      <FilterButton
                        type="largetable"
                        active={nonElectricFilter.includes("largetable")}
                        onClick={() => setNonElectricFilter(["largetable"])}
                        icon=""
                        label="Large Table"
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="row justify-content-center g-3">
                {cat.tables.map((table, index) => (
                  <div
                    key={index}
                    className="col-10 col-sm-6 col-md-4 col-lg-2 d-flex justify-content-center"
                  >
                    {renderTableCard(table)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Modal */}
      {tableModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 style={{ margin: 0 }}>
                {editingTable ? "Edit Table" : "Add Table"}
              </h5>
              <button
                onClick={() => setTableModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleTableSubmit}>
              <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Select Group
                  </label>
                  <select
                    name="group"
                    value={tableForm.group || ""}
                    onChange={handleTableFormChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="">-- Select Group --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (${g.hourly_rate}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Table Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={tableForm.name || ""}
                    onChange={handleTableFormChange}
                    placeholder="Enter table name"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Hourly Rate ($)
                    {tableForm.group && (
                      <span style={{ color: "#28a745", marginLeft: "8px", fontSize: "12px" }}>
                        Auto-filled from group
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={tableForm.hourlyRate || ""}
                    onChange={handleTableFormChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: tableForm.group ? "#f8f9fa" : "white",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={tableForm.location || ""}
                    onChange={handleTableFormChange}
                    placeholder="Enter location"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    Select Table Type
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {[
                      {
                        type: "snooker",
                        icon: "🎯",
                        color: "#28a745",
                      },
                      {
                        type: "pool",
                        icon: "🎱",
                        color: "#17a2b8",
                      },
                      {
                        type: "playstation",
                        icon: "🎮",
                        color: "#6f42c1",
                      },
                      {
                        type: "dining",
                        icon: "🍽️",
                        color: "#fd7e14",
                      },
                      {
                        type: "largetable",
                        icon: "🪑",
                        color: "#ffc107",
                      },
                    ].map((tableType) => (
                      <div
                        key={tableType.type}
                        onClick={() => {
                          setTableForm((prev) => ({
                            ...prev,
                            type: tableType.type,
                            seats:
                              tableType.type === "largetable"
                                ? prev.seats || 8
                                : undefined,
                          }));
                        }}
                        style={{
                          border: `2px solid ${tableForm.type === tableType.type
                            ? tableType.color
                            : "#ddd"
                            }`,
                          borderRadius: "8px",
                          padding: "12px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor:
                            tableForm.type === tableType.type
                              ? `${tableType.color}20`
                              : "white",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ fontSize: "30px", marginBottom: "5px" }}>
                          {tableType.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {tableForm.type === "largetable" && (
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Number of Seats
                    </label>
                    <input
                      type="number"
                      name="seats"
                      value={tableForm.seats || ""}
                      onChange={handleTableFormChange}
                      placeholder="Enter number of seats"
                      min="4"
                      max="20"
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}

                {!editingTable && (
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Number Of Tables
                    </label>
                    <input
                      type="text"
                      name="count"
                      value={tableForm.count || ""}
                      onChange={handleTableFormChange}
                      placeholder="Enter Count Of Table"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}

                {tableForm.type !== "food" && tableForm.type !== "dining" && tableForm.type !== "largetable" && !tableForm.count && (
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Smart Plug ID
                    </label>
                    <select
                      name="plugId"
                      value={tableForm.plugId || ""}
                      onChange={handleTableFormChange}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        backgroundColor: "white",
                      }}
                    >
                      <option value="">-- Select Plug --</option>
                      {plugs.map((plug) => (
                        <option key={plug.id} value={plug.plug_id}>
                          {plug.plug_id} ({plug.name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    Status
                  </label>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="radio"
                        name="status"
                        value="available"
                        checked={tableForm.status === "available" || tableForm.status === "active"}
                        onChange={handleTableFormChange}
                      />
                      <span>Active</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={tableForm.status === "inactive"}
                        onChange={handleTableFormChange}
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#ffc107",
                    color: "black",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {editingTable ? "Update Table" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Action Popup */}
      {showTableActions && selectedTable && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            border: "3px solid #ffc107",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 1000,
            minWidth: "280px",
            animation: "fadeInScale 0.2s ease-out",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "2px solid #ffc107",
              fontWeight: "bold",
              textAlign: "center",
              backgroundColor: "#ffc107",
              color: "#333",
              borderRadius: "8px 8px 0 0",
              fontSize: "16px",
            }}
          >
            {selectedTable.name}
            <div
              style={{
                fontSize: "12px",
                fontWeight: "normal",
                marginTop: "4px",
                color: "#666",
              }}
            >
              {selectedTable.type || "food"} • {selectedTable.status}
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <button
              onClick={() => handleEditTable(selectedTable)}
              style={{
                width: "100%",
                padding: "15px",
                marginBottom: "12px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#17a2b8",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <span style={{ fontSize: "16px" }}></span>
              Edit Table
            </button>
            <button
              onClick={() => handleDeleteTable(selectedTable.id)}
              style={{
                width: "100%",
                padding: "15px",
                marginBottom: "12px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#dc3545",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <span style={{ fontSize: "16px" }}></span>
              Delete Table
            </button>
            <button
              onClick={() => {
                setShowTableActions(false);
                setSelectedTable(null);
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #6c757d",
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#6c757d",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
            >
              Cancel
            </button>
          </div>
          <button
            onClick={() => {
              setShowTableActions(false);
              setSelectedTable(null);
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            ×
          </button>
        </div>
      )}

      {showTableActions && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
          onClick={() => {
            setShowTableActions(false);
            setSelectedTable(null);
          }}
        />
      )}

      {/* Groups Display - Graphical View */}
      {groups.length > 0 && (
        <div className="mt-4 mt-md-5 bg-white p-3 p-md-4 rounded shadow-sm">
          <h2 className="mb-3 mb-md-4 text-dark text-center">
            Created Groups - Visual Overview
          </h2>
          <div className="row">
            {groups.map((group) => {
              const allTables = [...tables, ...groupTables];
              const selectedTables = allTables.filter((table) =>
                (group.selectedTables || []).includes(table.id)
              );
              return (
                <div key={group.id} className="col-12 col-md-6 col-lg-4 mb-4">
                  <div
                    className="border border-warning p-3 rounded bg-warning bg-opacity-10 position-relative h-100 d-flex flex-column"
                    style={{ minHeight: "380px" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="m-0 text-warning fw-bold fs-5 fs-md-6">
                        {group.name}
                      </h3>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGroup(true);
                            setGroupForm({
                              id: group.id,
                              name: group.name,
                              hourlyRate: group.hourly_rate,
                              fixedRate: group.fixed_rate,
                              discount: group.discout,
                              minimumSessionTime: group.minimum_session_time || "",
                              selectedTables: group.selected_pool
                                ? String(group.selected_pool)
                                  .split(",")
                                  .map((id) => Number(id))
                                : [],
                            });
                            setGroupModalOpen(true);
                          }}
                          className="bg-info text-white border-0 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "30px",
                            height: "30px",
                          }}
                          title="Edit Group"
                        >
                          <RiEditLine className="m-0" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="bg-danger text-white border-0 rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: "30px",
                            height: "30px",
                          }}
                          title="Delete Group"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Group Stats */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="bg-success text-white p-2 rounded text-center fw-bold small">
                          ${group.hourly_rate}/hr
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-primary text-white p-2 rounded text-center fw-bold small">
                          ${group.fixed_rate} fixed
                        </div>
                      </div>
                      {group.discout > 0 && (
                        <div className="col-6">
                          <div className="bg-danger text-white p-2 rounded text-center fw-bold small">
                            {group.discout}% off
                          </div>
                        </div>
                      )}
                      {group.minimum_session_time && (
                        <div className="col-6">
                          <div className="bg-info text-white p-2 rounded text-center fw-bold small">
                            Min: {group.minimum_session_time} min
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visual representation of tables in group */}
                    <div className="border border-warning border-dashed rounded p-3 bg-white position-relative mb-3 flex-grow-1">
                      <div className="text-warning fw-bold small text-center mb-2">
                        GROUP LAYOUT
                      </div>
                      <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 position-relative z-2 h-100">
                        {group.tables && group.tables.length > 0 ? (
                          group.tables.map((table, index) => {
                            const getTableIcon = (type) => {
                              switch (type) {
                                case "pool":
                                  return "🎱";
                                case "snooker":
                                  return "🎯";
                                case "playstation":
                                  return "🎮";
                                case "largetable":
                                  return "🪑";
                                default:
                                  return "🍽️";
                              }
                            };
                            const getTableColor = (type) => {
                              switch (type) {
                                case "pool":
                                  return "#4caf50";
                                case "snooker":
                                  return "#2196f3";
                                case "playstation":
                                  return "#9c27b0";
                                case "largetable":
                                  return "#795548";
                                default:
                                  return "#ff9800";
                              }
                            };
                            return (
                              <div
                                key={table.id || index}
                                className="d-flex flex-column align-items-center mx-1 position-relative z-2"
                              >
                                <div
                                  className="d-flex align-items-center justify-content-center border-2 border-white"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: table.table_type === "food" ? "50%" : "8px",
                                    backgroundColor: getTableColor(table.table_type || "food"),
                                    fontSize: "18px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  {getTableIcon(table.table_type || "food")}
                                  {table.status === "occupied" && (
                                    <div
                                      className="position-absolute rounded-circle border border-white"
                                      style={{
                                        top: "-3px",
                                        right: "-3px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#f44336",
                                      }}
                                    ></div>
                                  )}
                                  {table.status === "reserved" && (
                                    <div
                                      className="position-absolute rounded-circle border border-white"
                                      style={{
                                        top: "-3px",
                                        right: "-3px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#ff9800",
                                      }}
                                    ></div>
                                  )}
                                </div>
                                <div className="fw-bold text-secondary small text-center mt-1 lh-1" style={{ fontSize: "10px", maxWidth: "50px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {table.table_name || "Table"}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-secondary small d-flex align-items-center justify-content-center h-100">
                            No tables added
                          </div>
                        )}
                      </div>

                      {/* Connection lines */}
                      <svg
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      >
                        {group.tables &&
                          group.tables.map((_, index) => {
                            if (index === group.tables.length - 1) return null;
                            const startX = 50 + index * 60;
                            const startY = 80;
                            const endX = 50 + (index + 1) * 60;
                            const endY = 80;
                            return (
                              <line
                                key={index}
                                x1={`${startX}px`}
                                y1={`${startY}px`}
                                x2={`${endX}px`}
                                y2={`${endY}px`}
                                stroke="#ffc107"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.6"
                              />
                            );
                          })}
                      </svg>
                    </div>

                    {/* Group summary stats at bottom */}
                    <div className="p-2 bg-light rounded small mt-auto">
                      {/* Total Revenue Potential */}
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold">Total Revenue Potential:</span>
                        <span className="fw-bold text-success">
                          ${(group.hourly_rate * selectedTables.length).toFixed(2)}/hr
                        </span>
                      </div>
                      {/* Fixed Revenue */}
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold">Fixed Revenue:</span>
                        <span className="fw-bold text-primary">
                          ${(group.fixed_rate * selectedTables.length).toFixed(2)}
                        </span>
                      </div>
                      {/* Discounted Revenue (Only if discount > 0) */}
                      {Number(group.discout) > 0 && (
                        <div className="d-flex justify-content-between text-pink">
                          <span className="fw-bold">After Discount ({group.discout}%):</span>
                          <span className="fw-bold text-pink">
                            $                             {(
                              group.hourly_rate *
                              selectedTables.length *
                              (1 - Number(group.discout) / 100)
                            ).toFixed(2)}
                            /hr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {groupModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 style={{ margin: 0 }}>
                {editingGroup ? "Edit Group" : "Create Group"}
              </h5>
              <button
                onClick={() => setGroupModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleGroupSubmit}>
              <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Group Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={groupForm.name}
                    onChange={handleGroupFormChange}
                    placeholder="Enter group name"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Select Tables
                  </label>
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {tablesByCategory.map(
                      (cat) =>
                        cat.tables.length > 0 && (
                          <div key={cat.category} style={{ marginBottom: "10px" }}>
                            <div
                              style={{
                                backgroundColor: "#f8f9fa",
                                padding: "8px 15px",
                                fontWeight: "bold",
                                borderBottom: "1px solid #dee2e6",
                              }}
                            >
                              {cat.category === "electric"
                                ? "Electric Tables"
                                : "Non-Electric Tables"}
                            </div>
                            <div style={{ padding: "10px 15px" }}>
                              {cat.tables.map((table) => (
                                <div
                                  key={table.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    id={`table-${table.id}`}
                                    checked={Array.isArray(groupForm.selectedTables) && groupForm.selectedTables.includes(table.id)}
                                    onChange={() => handleTableSelection(table.id)}
                                  />
                                  <label
                                    htmlFor={`table-${table.id}`}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {table.table_name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>

                {Array.isArray(groupForm.selectedTables) && groupForm.selectedTables.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Selected Tables
                    </label>
                    <div
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {groupForm.selectedTables.map((id) => {
                        let table =
                          allTableData.find((t) => t.id === Number(id)) ||
                          tablesByCategory
                            .flatMap((cat) => cat.tables)
                            .find((t) => t.id === Number(id));
                        return (
                          table && (
                            <span
                              key={table.id}
                              style={{
                                backgroundColor: "#ffc107",
                                color: "black",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {table.table_name || table.name}
                              <button
                                type="button"
                                style={{
                                  marginLeft: "4px",
                                  background: "none",
                                  border: "none",
                                  color: "#dc3545",
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  borderRadius: "50%",
                                  padding: "0 4px",
                                  lineHeight: 1,
                                }}
                                title="Remove"
                                onClick={() => {
                                  setGroupForm((prev) => ({
                                    ...prev,
                                    selectedTables: prev.selectedTables.filter(
                                      (tid) => tid !== id
                                    ),
                                  }));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={groupForm.hourlyRate}
                      onChange={handleGroupFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Fixed Rate ($)
                    </label>
                    <input
                      type="number"
                      name="fixedRate"
                      value={groupForm.fixedRate}
                      onChange={handleGroupFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Discounted Rate (%)
                    <span style={{ color: "#6c757d", fontWeight: "normal" }}>
                      {" "}
                      Optional
                    </span>
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={groupForm.discount}
                    onChange={handleGroupFormChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                {/* Minimum Session Time Field */}
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Minimum Session Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="minimumSessionTime"
                    value={groupForm.minimumSessionTime || ''}
                    onChange={handleGroupFormChange}
                    placeholder="0"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#ffc107",
                    color: "black",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {editingGroup ? "Update Group" : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .table-highlight {
          box-shadow: 0 0 20px #ff6b6b !important;
          transform: scale(1.1) !important;
          transition: all 0.3s ease !important;
        }
        @keyframes pulse {0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; }}
        .animate-pulse {animation: pulse 1s infinite;}
      `}</style>
    </div>
  );
};

export default Tables;