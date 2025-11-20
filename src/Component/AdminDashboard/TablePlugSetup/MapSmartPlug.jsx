import React, { useEffect, useState } from "react";
import {
    FaGamepad,
    FaTableTennis,
    FaPlug,
    FaPlay,
    FaStop,
    FaAngleDown,
    FaFilter,
    FaSearch,
    FaLightbulb,
} from "react-icons/fa";
import { Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import axios from "axios";
import axiosInstance from "../../../utils/axiosInstance";
import tapoService from "../../../services/TapoSmartPlugService";

const API_BASE = "https://restaurant-backend-production-a63a.up.railway.app/api";

const MapSmartPlug = () => {
    const [tables, setTables] = useState([]);
    const [plugs, setPlugs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [mappingLoading, setMappingLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });

    // Tapo configuration modal
    const [showTapoConfig, setShowTapoConfig] = useState(false);
    const [tapoConfig, setTapoConfig] = useState({
        email: '',
        password: '',
        deviceType: 'plug' // 'plug' or 'bulb'
    });
    const [discoveringDevices, setDiscoveringDevices] = useState(false);
    const [discoveredDevices, setDiscoveredDevices] = useState([]);

    // Filter
    const [plugFilters, setPlugFilters] = useState({
        snooker: true,
        pool: true,
        playstation: true,
        food: false,
    });

    // Form states
    const [plugTableDropdownOpen, setPlugTableDropdownOpen] = useState(false);
    const [tableForm, setTableForm] = useState({
        tableId: "",
        name: "",
        plugId: "",
    });

    useEffect(() => {
        fetchTables();
        fetchPlugs();
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/tables`);
            const tables = res.data?.data?.tables || [];

            setTables(tables || []);
        } catch (err) {
            console.error("Error fetching tables", err);
            showAlert("Error fetching tables", "danger");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlugs = async () => {
        try {
            const res = await axiosInstance.get("/plugs");
            const plugsData = res.data?.data?.plugs || [];
            setPlugs(plugsData || []);
        } catch (err) {
            console.error("Error fetching plugs", err);
            showAlert("Error fetching plugs", "danger");
        }
    };

    // Handle form changes
    const handleTableFormChange = (e) => {
        const { name, value } = e.target;
        setTableForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // filters
    const togglePlugFilter = (type) => {
        setPlugFilters((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    };

    // only show tables that have plug mapped
    const getFilteredTables = () => {
        return tables.filter(
            (table) =>
                table.plug_id &&
                plugFilters[table.table_type?.toLowerCase()]
        );
    };

    // toggle plug ON/OFF using Tapo service
    const togglePlug = async (plugId, action) => {
        try {
            setActionLoading((prev) => ({ ...prev, [plugId]: true }));

            // Find the plug details
            const plug = plugs.find(p => p.id === plugId);
            if (!plug) {
                throw new Error('Plug not found');
            }

            // Use Tapo service for local control
            let success = false;
            if (action === 'on') {
                success = await tapoService.turnOn(plug.plug_id, plug.ip_address);
            } else {
                success = await tapoService.turnOff(plug.plug_id, plug.ip_address);
            }

            if (success) {
                // Update plug status locally
                const updatedPlugs = plugs.map((p) =>
                    p.id === plugId
                        ? {
                            ...p,
                            power_state: action,
                            status: action === "on" ? "online" : "offline",
                        }
                        : p
                );
                setPlugs(updatedPlugs);

                // Also update backend
                await axiosInstance.post(`/plugs/${plugId}/power`, { action });
            }
        } catch (err) {
            console.error("Error controlling plug", err);
            showAlert("Error controlling plug. Manual override may be required.", "danger");
        } finally {
            setActionLoading((prev) => ({ ...prev, [plugId]: false }));
        }
    };

    // Discover Tapo devices on network
    const discoverTapoDevices = async () => {
        setDiscoveringDevices(true);
        try {
            const devices = await tapoService.discoverDevices('192.168.1', 1, 255);
            setDiscoveredDevices(devices);
            showAlert(`Found ${devices.length} potential Tapo devices`, 'success');
        } catch (error) {
            showAlert('Error discovering devices', 'danger');
        } finally {
            setDiscoveringDevices(false);
        }
    };

    // Test Tapo connection
    const testTapoConnection = async (ip) => {
        try {
            const result = await tapoService.testConnection(
                ip,
                tapoConfig.email,
                tapoConfig.password
            );

            if (result.success) {
                showAlert(`Successfully connected to device at ${ip}`, 'success');
                return true;
            } else {
                showAlert(`Connection failed: ${result.error}`, 'danger');
                return false;
            }
        } catch (error) {
            showAlert(`Error testing connection: ${error.message}`, 'danger');
            return false;
        }
    };

    // Initialize Tapo device
    const initializeTapoDevice = async (plugId, ip) => {
        try {
            const result = await tapoService.initializeDevice({
                ip,
                email: tapoConfig.email,
                password: tapoConfig.password,
                deviceId: plugId
            });

            if (result.success) {
                showAlert('Device initialized successfully', 'success');
                return true;
            } else {
                showAlert(`Initialization failed: ${result.message}`, 'warning');
                return false;
            }
        } catch (error) {
            showAlert(`Error initializing device: ${error.message}`, 'danger');
            return false;
        }
    };

    // Map plug to table
    const mapPlugToTable = async () => {
        if (!tableForm.tableId || !tableForm.plugId) {
            showAlert("Please select both a table and a plug", "warning");
            return;
        }

        try {
            setMappingLoading(true);

            // Find the selected table and plug
            const selectedTable = tables.find(table => table.id === parseInt(tableForm.tableId));
            const selectedPlug = plugs.find(plug => plug.plug_id === tableForm.plugId);

            if (!selectedTable || !selectedPlug) {
                showAlert("Invalid table or plug selection", "danger");
                return;
            }

            // Update the table with plug_id
            const tableUpdateData = {
                table_number: selectedTable.table_number,
                table_name: selectedTable.table_name,
                table_type: selectedTable.table_type,
                group_id: selectedTable.group_id,
                capacity: selectedTable.capacity,
                plug_id: tableForm.plugId,
                status: selectedTable.status,
                location: selectedTable.location,
                hourly_rate: selectedTable.hourly_rate
            };

            // Update the plug with table_id
            const plugUpdateData = {
                plug_id: selectedPlug.plug_id,
                name: selectedPlug.name,
                table_id: parseInt(tableForm.tableId),
                ip_address: selectedPlug.ip_address,
                mac_address: selectedPlug.mac_address,
                power_state: selectedPlug.power_state,
                brand: selectedPlug.brand,
                device_id: selectedPlug.device_id,
                auth_username: selectedPlug.auth_username,
                auth_password: selectedPlug.auth_password,
                api_key: selectedPlug.api_key
            };

            // Make API calls to update both table and plug
            await Promise.all([
                axiosInstance.put(`/tables/${tableForm.tableId}`, tableUpdateData),
                axiosInstance.put(`/plugs/${selectedPlug.id}`, plugUpdateData)
            ]);

            // Update local state
            const updatedTables = tables.map(table =>
                table.id === parseInt(tableForm.tableId)
                    ? { ...table, plug_id: tableForm.plugId }
                    : table
            );

            const updatedPlugs = plugs.map(plug =>
                plug.id === selectedPlug.id
                    ? { ...plug, table_id: parseInt(tableForm.tableId) }
                    : plug
            );

            setTables(updatedTables);
            setPlugs(updatedPlugs);

            // Reset form
            setTableForm({
                tableId: "",
                name: "",
                plugId: ""
            });

            showAlert("Smart plug mapped successfully!", "success");
        } catch (err) {
            console.error("Error mapping plug to table", err);
            showAlert("Error mapping plug to table", "danger");
        } finally {
            setMappingLoading(false);
        }
    };

    // Show alert message
    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => {
            setAlert({ show: false, message: "", type: "" });
        }, 3000);
    };

    return (
        <div className="col-12">
            <div className="bg-white rounded shadow-sm p-3 p-md-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-warning rounded p-2">
                        <FaPlug className="text-dark" />
                    </div>
                    <h5 className="fw-light text-dark mb-0">
                        Map Smart Plug (ON/OFF Control)
                    </h5>
                </div>

                {alert.show && (
                    <Alert variant={alert.type} className="mb-3">
                        {alert.message}
                    </Alert>
                )}

                {loading ? (
                    <div className="text-center p-4">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* LEFT FORM (mapping if needed) */}
                        <div className="col-12 col-lg-6">
                            <h4 className="fw-medium text-dark mb-3">Assign Smart Plug</h4>
                            <div className="mb-3">
                                <label className="form-label">Select Table</label>
                                <div className="position-relative">
                                    <button
                                        type="button"
                                        className="form-control text-start d-flex justify-content-between align-items-center"
                                        onClick={() =>
                                            setPlugTableDropdownOpen(!plugTableDropdownOpen)
                                        }
                                    >
                                        <span>{tableForm.name || "Select table"}</span>
                                        <FaAngleDown />
                                    </button>
                                    {plugTableDropdownOpen && (
                                        // <div className="position-absolute top-100 start-0 end-0 bg-white border rounded mt-1 shadow-lg z-3">
                                        //     <div className="py-1">
                                        //         {tables.map((table) => (
                                        //             <button
                                        //                 key={table.id}
                                        //                 type="button"
                                        //                 className="w-100 text-start btn btn-light"
                                        //                 onClick={() => {
                                        //                     setTableForm((prev) => ({
                                        //                         ...prev,
                                        //                         tableId: table.id,
                                        //                         name: table.table_name,
                                        //                     }));
                                        //                     setPlugTableDropdownOpen(false);
                                        //                 }}
                                        //             >
                                        //                 {table.table_name}
                                        //             </button>
                                        //         ))}
                                        //     </div>
                                        // </div>

                                        <div
                                            className="position-absolute top-100 start-0 end-0 bg-white border rounded mt-1 shadow-lg z-3"
                                            style={{ maxHeight: "200px", overflowY: "auto" }} // ✅ fix height with scroll
                                        >
                                            <div className="py-1">
                                                {tables.map((table) => (
                                                    <button
                                                        key={table.id}
                                                        type="button"
                                                        className="w-100 text-start btn btn-light"
                                                        onClick={() => {
                                                            setTableForm((prev) => ({
                                                                ...prev,
                                                                tableId: table.id,
                                                                name: table.table_name,
                                                            }));
                                                            setPlugTableDropdownOpen(false);
                                                        }}
                                                    >
                                                        {table.table_name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Smart Plug</label>
                                <select
                                    name="plugId"
                                    value={tableForm.plugId || ""}
                                    onChange={handleTableFormChange}
                                    className="form-control"
                                >
                                    <option value="">-- Select Plug --</option>
                                    {plugs.map((plug) => (
                                        <option key={plug.id} value={plug.plug_id}>
                                            {plug.plug_id} ({plug.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="w-100 btn btn-warning text-dark fw-medium"
                                onClick={mapPlugToTable}
                                disabled={mappingLoading}
                            >
                                {mappingLoading ? <Spinner size="sm" /> : "Map Smart Plug"}
                            </button>
                        </div>

                        {/* RIGHT CONTROL PANEL */}
                        <div className="col-12 col-lg-6">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="fw-medium text-dark mb-0">Smart Plug Control</h4>
                                <div className="dropdown">
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        <FaFilter /> <span>Filter</span>
                                    </Button>
                                    <ul className="dropdown-menu">
                                        {["snooker", "pool", "playstation"].map((type) => (
                                            <li key={type}>
                                                <div className="dropdown-item">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`filter${type}`}
                                                            checked={plugFilters[type]}
                                                            onChange={() => togglePlugFilter(type)}
                                                        />
                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={`filter${type}`}
                                                        >
                                                            {type.toUpperCase()} Tables
                                                        </label>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {plugs.map((plug) => {
                                    const connectedTables = tables.filter(
                                        (t) => t.plug_id === plug.plug_id
                                    );

                                    return (
                                        <div key={plug.id} className="border rounded p-3">
                                            {/* PLUG HEADER */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <div className="fw-medium text-dark">{plug.name}</div>
                                                    <div className="text-muted small">Plug ID: {plug.plug_id}</div>
                                                    <div className="text-muted small">
                                                        IP: {plug.ip_address} | MAC: {plug.mac_address}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div
                                                        className={`rounded-circle ${plug.status === "online" ? "bg-success" : "bg-danger"
                                                            }`}
                                                        style={{ width: "12px", height: "12px" }}
                                                    />
                                                    <span
                                                        className={`small fw-medium ${plug.status === "online" ? "text-success" : "text-danger"
                                                            }`}
                                                    >
                                                        {plug.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ON / OFF BUTTONS */}
                                            <div className="d-flex gap-3 mb-3">
                                                <button
                                                    className={`btn flex-grow-1 ${plug.power_state === "on" ? "btn-success" : "btn-outline-success"
                                                        }`}
                                                    onClick={() => togglePlug(plug.id, "on")}
                                                    disabled={plug.power_state === "on" || actionLoading[plug.id]}
                                                >
                                                    {actionLoading[plug.id] ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <>
                                                            <FaPlay /> Turn ON
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    className={`btn flex-grow-1 ${plug.power_state === "off" ? "btn-danger" : "btn-outline-danger"
                                                        }`}
                                                    onClick={() => togglePlug(plug.id, "off")}
                                                    disabled={plug.power_state === "off" || actionLoading[plug.id]}
                                                >
                                                    {actionLoading[plug.id] ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <>
                                                            <FaStop /> Turn OFF
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* CONNECTED TABLES */}
                                            <div>
                                                <div className="fw-medium mb-2">Connected Tables:</div>
                                                {connectedTables.length > 0 ? (
                                                    <ul className="list-unstyled mb-0">
                                                        {connectedTables.map((t) => (
                                                            <li key={t.id} className="small text-muted">
                                                                • {t.table_name} ({t.table_type})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-muted small fst-italic">
                                                        No tables mapped to this plug
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {plugs.length === 0 && (
                                    <div className="border rounded p-4 text-center text-muted">
                                        No plugs available
                                    </div>
                                )}
                            </div>

                            {/* Tapo Configuration & Discovery */}
                            <div className="mt-4">
                                <h5 className="fw-medium text-dark mb-3">Tapo Device Management</h5>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="warning"
                                        onClick={() => setShowTapoConfig(true)}
                                    >
                                        <FaLightbulb className="me-2" />
                                        Configure Tapo
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        onClick={discoverTapoDevices}
                                        disabled={discoveringDevices}
                                    >
                                        {discoveringDevices ? (
                                            <><Spinner size="sm" /> Scanning...</>
                                        ) : (
                                            <><FaSearch className="me-2" />Discover Devices</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tapo Configuration Modal */}
            <Modal show={showTapoConfig} onHide={() => setShowTapoConfig(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Tapo Configuration</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        <strong>Local Control Setup</strong><br />
                        Enter your Tapo account credentials for local device control.
                        Your credentials are only used for authentication and are not stored on any server.
                    </Alert>

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tapo Account Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="your-email@example.com"
                                value={tapoConfig.email}
                                onChange={(e) => setTapoConfig({...tapoConfig, email: e.target.value})}
                            />
                            <Form.Text className="text-muted">
                                The email you use for the Tapo mobile app
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tapo Account Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={tapoConfig.password}
                                onChange={(e) => setTapoConfig({...tapoConfig, password: e.target.value})}
                            />
                            <Form.Text className="text-muted">
                                Your Tapo account password (stored locally only)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Device Type</Form.Label>
                            <Form.Select
                                value={tapoConfig.deviceType}
                                onChange={(e) => setTapoConfig({...tapoConfig, deviceType: e.target.value})}
                            >
                                <option value="plug">Smart Plug (P100, P105, P110, P115)</option>
                                <option value="bulb">Smart Bulb (L510, L520, L530, etc.)</option>
                                <option value="strip">Power Strip (P300, P304M)</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>

                    <Alert variant="success">
                        <strong>Supported Devices:</strong>
                        <ul className="mb-0 mt-2">
                            <li><strong>Smart Plugs:</strong> P100, P105, P110, P115</li>
                            <li><strong>Smart Bulbs:</strong> L510, L520, L530, L535, L610, L630</li>
                            <li><strong>Power Strips:</strong> P300, P304M, P316M</li>
                        </ul>
                    </Alert>

                    {discoveredDevices.length > 0 && (
                        <div className="mt-3">
                            <h6>Discovered Devices:</h6>
                            <div className="list-group">
                                {discoveredDevices.map((device, index) => (
                                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{device.ip}</span>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => testTapoConnection(device.ip)}
                                        >
                                            Test Connection
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTapoConfig(false)}>
                        Close
                    </Button>
                    <Button
                        variant="warning"
                        onClick={() => {
                            localStorage.setItem('tapo_config', JSON.stringify(tapoConfig));
                            showAlert('Tapo configuration saved!', 'success');
                            setShowTapoConfig(false);
                        }}
                        disabled={!tapoConfig.email || !tapoConfig.password}
                    >
                        Save Configuration
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MapSmartPlug;