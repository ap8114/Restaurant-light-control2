import React, { useState, useEffect } from 'react';
import {
  RiGamepadLine,
  RiBilliardsLine,
  RiRestaurantLine,
  RiTvLine,
  RiLightbulbLine,
  RiMusicLine,
  RiRefreshLine,
  RiSearchLine,
  RiFilterLine,
  RiArrowDownSLine,
  RiAlertLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiCloseLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine
} from 'react-icons/ri';
import { apiUrl } from '../../../utils/config';

const DeviceMonitor = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingDevices, setUpdatingDevices] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});

  // New state for adding/editing devices
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [newDevice, setNewDevice] = useState({
    plug_id: '',
    name: '',
    table_id: '',
    ip_address: '',
    mac_address: '',
    power_state: 'off',
    brand: '',
    device_id: '',
    auth_username: '',
    auth_password: '',
    api_key: '' // Added api_key field for Baytion devices
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // State for tables
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Fetch devices from API
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/plugs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Transform API data to match our device format
        const transformedDevices = data.data.plugs.map(plug => {
          // Determine icon based on table type
          let icon;
          let bgColor;
          switch (plug.table_type) {
            case 'playstation':
              icon = <RiGamepadLine className="text-blue-600" />;
              bgColor = 'bg-blue-50';
              break;
            case 'billiards':
            case 'snooker':
            case 'pool':
              icon = <RiBilliardsLine className="text-green-600" />;
              bgColor = 'bg-green-50';
              break;
            case 'restaurant':
              icon = <RiRestaurantLine className="text-purple-600" />;
              bgColor = 'bg-purple-50';
              break;
            case 'tv':
              icon = <RiTvLine className="text-red-600" />;
              bgColor = 'bg-red-50';
              break;
            case 'lighting':
              icon = <RiLightbulbLine className="text-indigo-600" />;
              bgColor = 'bg-indigo-50';
              break;
            case 'sound':
              icon = <RiMusicLine className="text-pink-600" />;
              bgColor = 'bg-pink-50';
              break;
            default:
              icon = <RiGamepadLine className="text-orange-600" />;
              bgColor = 'bg-orange-50';
          }
          return {
            id: plug.id,
            plugId: plug.plug_id,
            name: plug.name,
            location: plug.table_name ? `Table ${plug.table_name}` : 'Unknown Location',
            icon: icon,
            status: plug.status,
            powerState: plug.power_state,
            powerConsumption: plug.power_consumption ? parseFloat(plug.power_consumption) : null,
            lastUpdated: formatLastUpdated(plug.updated_at),
            bgColor: bgColor,
            tableType: plug.table_type,
            // Additional fields needed for status updates
            tableId: plug.table_id,
            ipAddress: plug.ip_address,
            macAddress: plug.mac_address,
            brand: plug.brand,
            deviceId: plug.device_id,
            authUsername: plug.auth_username,
            authPassword: plug.auth_password,
            apiKey: plug.api_key // Added api_key field
          };
        });
        setDevices(transformedDevices);
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err.message);
      // Fallback to sample data if API fails
      setDevices([
        {
          id: 1,
          name: 'PlayStation 5',
          location: 'Table PS-01',
          icon: <RiGamepadLine className="text-blue-600" />,
          status: 'online',
          powerState: 'on',
          powerConsumption: 180,
          lastUpdated: '2 min ago',
          bgColor: 'bg-blue-50',
          tableId: 1,
          ipAddress: '192.168.1.101',
          macAddress: 'AA:BB:CC:DD:EE:F1',
          brand: 'Sonoff',
          deviceId: '10009553c8',
          authUsername: '',
          authPassword: '',
          apiKey: ''
        },
        {
          id: 2,
          name: 'Snooker Table',
          location: 'Table SN-03',
          icon: <RiBilliardsLine className="text-green-600" />,
          status: 'online',
          powerState: 'off',
          powerConsumption: 0,
          lastUpdated: '1 min ago',
          bgColor: 'bg-green-50',
          tableId: 2,
          ipAddress: '192.168.1.102',
          macAddress: 'AA:BB:CC:DD:EE:F2',
          brand: 'Tapo',
          deviceId: '',
          authUsername: 'user@example.com',
          authPassword: 'password123',
          apiKey: ''
        },
        {
          id: 3,
          name: 'Lighting System',
          location: 'Table LG-09',
          icon: <RiLightbulbLine className="text-indigo-600" />,
          status: 'online',
          powerState: 'on',
          powerConsumption: 45,
          lastUpdated: '5 min ago',
          bgColor: 'bg-indigo-50',
          tableId: 5,
          ipAddress: '192.168.1.105',
          macAddress: 'AA:BB:CC:DD:EE:F5',
          brand: 'Baytion',
          deviceId: '',
          authUsername: '',
          authPassword: '',
          apiKey: 'b7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables from API
  const fetchTables = async () => {
    setTablesLoading(true);
    try {
      const response = await fetch(`${apiUrl}/tables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Extract tables array from the response
        setTables(data.data.tables);
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      // Fallback to sample tables if API fails
      setTables([
        {
          id: 1,
          table_name: "PS-01",
          table_type: "playstation",
          status: "available",
          location: "Main Floor"
        },
        {
          id: 2,
          table_name: "SN-03",
          table_type: "snooker",
          status: "occupied",
          location: "Main Floor"
        },
        {
          id: 3,
          table_name: "TV-05",
          table_type: "tv",
          status: "available",
          location: "Lounge Area"
        },
        {
          id: 4,
          table_name: "RS-07",
          table_type: "restaurant",
          status: "occupied",
          location: "Main Floor"
        },
        {
          id: 5,
          table_name: "LG-09",
          table_type: "lighting",
          status: "available",
          location: "Main Floor"
        },
        {
          id: 6,
          table_name: "SD-11",
          table_type: "sound",
          status: "available",
          location: "Lounge Area"
        }
      ]);
    } finally {
      setTablesLoading(false);
    }
  };

  // Format last updated time
  const formatLastUpdated = (dateString) => {
    const updatedDate = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - updatedDate) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 min ago';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Toggle device power state with API call
  const toggleDevicePower = async (deviceId, action) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status === 'offline') return;

    // Show loading state
    setUpdatingDevices(prev => ({ ...prev, [deviceId]: true }));
    try {
      const response = await fetch(`${apiUrl}/plugs/${deviceId}/power`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: action
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Update device state on success
        setDevices(devices.map(device => {
          if (device.id === deviceId) {
            const message = `${device.name} has been turned ${action.toUpperCase()}`;
            setToastMessage(message);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return {
              ...device,
              powerState: action,
              lastUpdated: 'Just now'
            };
          }
          return device;
        }));
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error toggling device power:', err);
      setToastMessage(`Failed to toggle power for ${device.name}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      // Remove loading state
      setUpdatingDevices(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  // Update device status (online/offline) with API call
  const updateDeviceStatus = async (deviceId, newStatus) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    // Show loading state
    setUpdatingStatus(prev => ({ ...prev, [deviceId]: true }));
    try {
      const response = await fetch(`${apiUrl}/plugs/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plug_id: device.plugId,
          name: device.name,
          table_id: device.tableId,
          ip_address: device.ipAddress,
          mac_address: device.macAddress,
          status: newStatus,
          power_state: device.powerState,
          brand: device.brand,
          device_id: device.deviceId,
          auth_username: device.authUsername,
          auth_password: device.authPassword,
          api_key: device.apiKey // Include api_key in payload
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Update device state on success
        setDevices(devices.map(device => {
          if (device.id === deviceId) {
            const message = `${device.name} status changed to ${newStatus.toUpperCase()}`;
            setToastMessage(message);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return {
              ...device,
              status: newStatus,
              lastUpdated: 'Just now'
            };
          }
          return device;
        }));
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error updating device status:', err);
      setToastMessage(`Failed to update status for ${device.name}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      // Remove loading state
      setUpdatingStatus(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  // Add or update device
  const saveDevice = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      // Create payload and handle Baytion API key mapping
      let payload = {
        ...newDevice,
        table_id: newDevice.table_id ? parseInt(newDevice.table_id, 10) : null
      };

      // For Baytion devices, ensure api_key is properly set
      if (newDevice.brand === 'Baytion') {
        // If api_key is empty but auth_password has a value, use auth_password as api_key
        const apiKey = newDevice.api_key || newDevice.auth_password || '';
        payload = {
          ...payload,
          api_key: apiKey,
          auth_password: '' // Clear auth_password for Baytion devices
        };
      }

      console.log('Payload being sent:', payload); // Debug log

      let response;
      let data;
      if (isEditMode) {
        // Update existing device
        response = await fetch(`${apiUrl}/plugs/${editingDeviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        if (data.success) {
          // Update device in state
          const updatedPlug = data.data.plug;
          let icon;
          let bgColor;
          switch (updatedPlug.table_type) {
            case 'playstation':
              icon = <RiGamepadLine className="text-blue-600" />;
              bgColor = 'bg-blue-50';
              break;
            case 'billiards':
            case 'snooker':
            case 'pool':
              icon = <RiBilliardsLine className="text-green-600" />;
              bgColor = 'bg-green-50';
              break;
            case 'restaurant':
              icon = <RiRestaurantLine className="text-purple-600" />;
              bgColor = 'bg-purple-50';
              break;
            case 'tv':
              icon = <RiTvLine className="text-red-600" />;
              bgColor = 'bg-red-50';
              break;
            case 'lighting':
              icon = <RiLightbulbLine className="text-indigo-600" />;
              bgColor = 'bg-indigo-50';
              break;
            case 'sound':
              icon = <RiMusicLine className="text-pink-600" />;
              bgColor = 'bg-pink-50';
              break;
            default:
              icon = <RiGamepadLine className="text-orange-600" />;
              bgColor = 'bg-orange-50';
          }
          const transformedDevice = {
            id: updatedPlug.id,
            plugId: updatedPlug.plug_id,
            name: updatedPlug.name,
            location: updatedPlug.table_name ? `Table ${updatedPlug.table_name}` : 'Unknown Location',
            icon: icon,
            status: updatedPlug.status,
            powerState: updatedPlug.power_state,
            powerConsumption: updatedPlug.power_consumption ? parseFloat(updatedPlug.power_consumption) : null,
            lastUpdated: formatLastUpdated(updatedPlug.updated_at),
            bgColor: bgColor,
            tableType: updatedPlug.table_type,
            // Additional fields needed for status updates
            tableId: updatedPlug.table_id,
            ipAddress: updatedPlug.ip_address,
            macAddress: updatedPlug.mac_address,
            brand: updatedPlug.brand,
            deviceId: updatedPlug.device_id,
            authUsername: updatedPlug.auth_username,
            authPassword: updatedPlug.auth_password,
            apiKey: updatedPlug.api_key // Added api_key field
          };
          setDevices(devices.map(device =>
            device.id === editingDeviceId ? transformedDevice : device
          ));
          setToastMessage(`Device "${newDevice.name}" updated successfully`);
        } else {
          throw new Error('API response indicates failure');
        }
      } else {
        // Add new device
        response = await fetch(`${apiUrl}/plugs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        if (data.success) {
          // Transform the new device data to match our format
          const newPlug = data.data.plug;
          let icon;
          let bgColor;
          switch (newPlug.table_type) {
            case 'playstation':
              icon = <RiGamepadLine className="text-blue-600" />;
              bgColor = 'bg-blue-50';
              break;
            case 'billiards':
            case 'snooker':
            case 'pool':
              icon = <RiBilliardsLine className="text-green-600" />;
              bgColor = 'bg-green-50';
              break;
            case 'restaurant':
              icon = <RiRestaurantLine className="text-purple-600" />;
              bgColor = 'bg-purple-50';
              break;
            case 'tv':
              icon = <RiTvLine className="text-red-600" />;
              bgColor = 'bg-red-50';
              break;
            case 'lighting':
              icon = <RiLightbulbLine className="text-indigo-600" />;
              bgColor = 'bg-indigo-50';
              break;
            case 'sound':
              icon = <RiMusicLine className="text-pink-600" />;
              bgColor = 'bg-pink-50';
              break;
            default:
              icon = <RiGamepadLine className="text-orange-600" />;
              bgColor = 'bg-orange-50';
          }
          const transformedDevice = {
            id: newPlug.id,
            plugId: newPlug.plug_id,
            name: newPlug.name,
            location: newPlug.table_name ? `Table ${newPlug.table_name}` : 'Unknown Location',
            icon: icon,
            status: newPlug.status,
            powerState: newPlug.power_state,
            powerConsumption: newPlug.power_consumption ? parseFloat(newPlug.power_consumption) : null,
            lastUpdated: formatLastUpdated(newPlug.updated_at),
            bgColor: bgColor,
            tableType: newPlug.table_type,
            // Additional fields needed for status updates
            tableId: newPlug.table_id,
            ipAddress: newPlug.ip_address,
            macAddress: newPlug.mac_address,
            brand: newPlug.brand,
            deviceId: newPlug.device_id,
            authUsername: newPlug.auth_username,
            authPassword: newPlug.auth_password,
            apiKey: newPlug.api_key // Added api_key field
          };
          setDevices([...devices, transformedDevice]);
          setToastMessage(`Device "${newDevice.name}" added successfully`);
        } else {
          throw new Error('API response indicates failure');
        }
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      // Reset form and close
      setNewDevice({
        plug_id: '',
        name: '',
        table_id: '',
        ip_address: '',
        mac_address: '',
        power_state: 'off',
        brand: '',
        device_id: '',
        auth_username: '',
        auth_password: '',
        api_key: '' // Reset api_key field
      });
      setShowDeviceForm(false);
      setIsEditMode(false);
      setEditingDeviceId(null);
    } catch (err) {
      console.error('Error saving device:', err);
      setToastMessage(`Failed to ${isEditMode ? 'update' : 'add'} device: ${err.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete device
  const deleteDevice = async () => {
    if (!deviceToDelete) return;

    setDeleteSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/plugs/${deviceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Remove device from state
        setDevices(devices.filter(device => device.id !== deviceToDelete.id));
        setToastMessage(`Device "${deviceToDelete.name}" deleted successfully`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error deleting device:', err);
      setToastMessage(`Failed to delete device: ${err.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setDeleteSubmitting(false);
      setShowDeleteConfirm(false);
      setDeviceToDelete(null);
    }
  };

  // Open edit form with device data
  const openEditForm = (device) => {
    // For Baytion devices, map api_key to auth_password for form display
    const authPassword = device.brand === 'Baytion' ? device.apiKey : device.authPassword;
    const apiKey = device.brand === 'Baytion' ? device.apiKey : '';

    setNewDevice({
      plug_id: device.plugId || '',
      name: device.name || '',
      table_id: device.tableId ? device.tableId.toString() : '',
      ip_address: device.ipAddress || '',
      mac_address: device.macAddress || '',
      power_state: device.powerState || 'off',
      brand: device.brand || '',
      device_id: device.deviceId || '',
      auth_username: device.authUsername || '',
      auth_password: authPassword || '', // Use api_key for Baytion devices
      api_key: apiKey // Include api_key field
    });
    setIsEditMode(true);
    setEditingDeviceId(device.id);
    setShowDeviceForm(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (device) => {
    setDeviceToDelete(device);
    setShowDeleteConfirm(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDevice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form when closing
  const closeForm = () => {
    setNewDevice({
      plug_id: '',
      name: '',
      table_id: '',
      ip_address: '',
      mac_address: '',
      power_state: 'off',
      brand: '',
      device_id: '',
      auth_username: '',
      auth_password: '',
      api_key: '' // Reset api_key field
    });
    setShowDeviceForm(false);
    setIsEditMode(false);
    setEditingDeviceId(null);
  };

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Fetch tables when modal is opened
  useEffect(() => {
    if (showDeviceForm) {
      fetchTables();
    }
  }, [showDeviceForm]);

  const refreshAll = () => {
    fetchDevices();
    setToastMessage('Devices refreshed');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Filter devices based on search and status filter
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'online' && device.status === 'online') ||
      (statusFilter === 'offline' && device.status === 'offline');
    return matchesSearch && matchesStatus;
  });

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  if (loading) {
    return (
      <div className="p-5 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Header */}
      <header className="">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
          <div className="mb-3">
            <h1 className="fs-3 fw-bold text-dark">Device Monitor</h1>
            <p className="text-muted mb-0">Monitor and control smart plugs across all gaming areas</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center px-3 py-2 bg-success bg-opacity-10 rounded-3">
              <span className="device-status-dot bg-success me-2"></span>
              <span className="text-success small fw-medium">Live Updates Active</span>
            </div>
            <button className="btn btn-warning d-flex align-items-center" onClick={refreshAll}>
              <RiRefreshLine className="me-2" />
              Refresh All
            </button>
            <button className="btn btn-primary d-flex align-items-center" onClick={() => setShowDeviceForm(true)}>
              <RiAddLine className="me-2" />
              Add New Device
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <RiErrorWarningLine className="me-2" />
          <div>
            Error fetching data: {error}. Showing sample data.
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white px-4 py-3 border-bottom">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
          <div className="d-flex flex-wrap gap-3 mb-3 mb-md-0">
            <div className="position-relative">
              <RiSearchLine className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                placeholder="Search devices..."
                className="form-control ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
              >
                <RiFilterLine className="me-2" />
                Filter by Status
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => setStatusFilter('all')}>All Status</button></li>
                <li><button className="dropdown-item" onClick={() => setStatusFilter('online')}>Online</button></li>
                <li><button className="dropdown-item" onClick={() => setStatusFilter('offline')}>Offline</button></li>
              </ul>
            </div>
          </div>
          <div className="d-flex gap-3 text-muted small">
            <span>Total Devices: <strong className="text-dark">{devices.length}</strong></span>
            <span className="text-success">Online: <strong>{onlineCount}</strong></span>
            <span className="text-danger">Offline: <strong>{offlineCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="row g-3 mt-2">
        {filteredDevices.length === 0 ? (
          <div className="col-12 text-center py-5">
            <RiSearchLine className="text-muted mb-2" style={{ fontSize: '3rem' }} />
            <h5 className="text-muted">No devices found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredDevices.map(device => (
            <div key={device.id} className="col-md-3">
              <div className={`card shadow-sm p-3 ${device.bgColor}`}>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="fw-bold">{device.name}</h6>
                    <div className="text-muted small">{device.location}</div>
                  </div>
                  <div>
                    <span className={`badge ${device.status === 'online' ? 'bg-success' : 'bg-secondary'} me-1`}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                    <span className={`badge ${device.powerState === 'on' ? 'bg-primary' : 'bg-danger'}`}>
                      {device.powerState === 'on' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 mb-2">Power Consumption</div>
                <div className="fw-bold">
                  {device.powerConsumption !== null ? `${device.powerConsumption}W` : '--W'}
                </div>
                <div className="progress my-2" style={{ height: "6px" }}>
                  <div
                    className={`progress-bar ${device.powerState === 'on' ? 'bg-warning' : 'bg-secondary'}`}
                    style={{ width: device.powerConsumption ? `${Math.min(device.powerConsumption / 3, 100)}%` : '0%' }}
                  ></div>
                </div>
                {/* Power Switch */}
                <div className="d-flex justify-content-center my-3">
                  <div className="power-switch-container">
                    <label className="power-switch">
                      <input
                        type="checkbox"
                        checked={device.powerState === 'on'}
                        onChange={(e) => toggleDevicePower(device.id, e.target.checked ? 'on' : 'off')}
                        disabled={device.status === 'offline' || updatingDevices[device.id]}
                      />
                      <span className="slider round"></span>
                    </label>
                    <div className="text-center mt-1 small text-muted">
                      {updatingDevices[device.id] ? 'Switching...' : 'Power'}
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <small className={device.status === 'offline' ? 'text-danger' : 'text-muted'}>
                    {device.status === 'offline' ? `Last seen: ${device.lastUpdated}` : `Updated: ${device.lastUpdated}`}
                  </small>
                  <div className="d-flex align-items-center gap-2">
                    {/* Status Toggle */}
                    <div className="d-flex align-items-center">
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={device.status === 'online'}
                          onChange={() => updateDeviceStatus(device.id, device.status === 'online' ? 'offline' : 'online')}
                          disabled={updatingStatus[device.id]}
                        />
                      </div>
                    </div>
                    {/* Edit Button */}
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center"
                      onClick={() => openEditForm(device)}
                      title="Edit Device"
                    >
                      <RiEditLine />
                    </button>
                    {/* Delete Button */}
                    <button
                      className="btn btn-outline-danger btn-sm d-flex align-items-center"
                      onClick={() => openDeleteConfirm(device)}
                      title="Delete Device"
                    >
                      <RiDeleteBinLine />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Device Modal */}
      {showDeviceForm && (
        <>
          {/* Modal Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={closeForm}
          ></div>
          {/* Modal */}
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">{isEditMode ? 'Update Device' : 'Add New Device'}</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeForm}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={saveDevice}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="plugId" className="form-label">Plug ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="plugId"
                            name="plug_id"
                            value={newDevice.plug_id}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="deviceName" className="form-label">Device Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="deviceName"
                            name="name"
                            value={newDevice.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="tableId" className="form-label">Table</label>
                          {tablesLoading ? (
                            <div className="d-flex align-items-center">
                              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <span>Loading tables...</span>
                            </div>
                          ) : (
                            <select
                              className="form-select"
                              id="tableId"
                              name="table_id"
                              value={newDevice.table_id}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select a table</option>
                              {tables.map(table => (
                                <option key={table.id} value={table.id}>
                                  {table.table_name} ({table.table_type}) - {table.location}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="brand" className="form-label">Brand</label>
                          <select
                            className="form-select"
                            id="brand"
                            name="brand"
                            value={newDevice.brand}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select a brand</option>
                            <option value="Sonoff">Sonoff</option>
                            <option value="Tapo">Tapo</option>
                            <option value="Baytion">Baytion</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {/* Brand-specific fields */}
                    {newDevice.brand === 'Sonoff' && (
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label htmlFor="deviceId" className="form-label">Device ID</label>
                            <input
                              type="text"
                              className="form-control"
                              id="deviceId"
                              name="device_id"
                              value={newDevice.device_id}
                              onChange={handleInputChange}
                              required={newDevice.brand === 'Sonoff'}
                            />
                            <div className="form-text">Required for Sonoff devices</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {newDevice.brand === 'Tapo' && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="authUsername" className="form-label">Auth Username</label>
                            <input
                              type="text"
                              className="form-control"
                              id="authUsername"
                              name="auth_username"
                              value={newDevice.auth_username}
                              onChange={handleInputChange}
                              required={newDevice.brand === 'Tapo'}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="authPassword" className="form-label">Auth Password</label>
                            <input
                              type="password"
                              className="form-control"
                              id="authPassword"
                              name="auth_password"
                              value={newDevice.auth_password}
                              onChange={handleInputChange}
                              required={newDevice.brand === 'Tapo'}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {newDevice.brand === 'Baytion' && (
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label htmlFor="apiKey" className="form-label">API Key</label>
                            <input
                              type="password"
                              className="form-control"
                              id="apiKey"
                              name="api_key"
                              value={newDevice.api_key}
                              onChange={handleInputChange}
                              required={newDevice.brand === 'Baytion'}
                            />
                            <div className="form-text">Required for Baytion devices</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="ipAddress" className="form-label">IP Address</label>
                          <input
                            type="text"
                            className="form-control"
                            id="ipAddress"
                            name="ip_address"
                            value={newDevice.ip_address}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="macAddress" className="form-label">MAC Address</label>
                          <input
                            type="text"
                            className="form-control"
                            id="macAddress"
                            name="mac_address"
                            value={newDevice.mac_address}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="powerState" className="form-label">Power State</label>
                          <select
                            className="form-select"
                            id="powerState"
                            name="power_state"
                            value={newDevice.power_state}
                            onChange={handleInputChange}
                          >
                            <option value="on">On</option>
                            <option value="off">Off</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveDevice}
                    disabled={formSubmitting || tablesLoading}
                  >
                    {formSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isEditMode ? 'Updating...' : 'Adding...'}
                      </>
                    ) : isEditMode ? 'Update Device' : 'Add Device'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          {/* Modal Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          {/* Modal */}
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDeleteConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete the device "{deviceToDelete?.name}"?</p>
                  <p className="text-muted">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={deleteDevice}
                    disabled={deleteSubmitting}
                  >
                    {deleteSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : 'Delete Device'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Toast */}
      {showToast && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-success text-white px-4 py-3 rounded-3 shadow d-flex align-items-center"
          style={{ zIndex: 1060, transition: 'opacity 0.3s ease-in-out' }}
        >
          <RiCheckLine className="me-2" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Custom styles for power switch */}
      <style jsx>{`
        .power-switch-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .power-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }
        
        .power-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 30px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #28a745;
        }
        
        input:checked + .slider:before {
          transform: translateX(30px);
        }
        
        input:disabled + .slider {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        /* Rounded sliders */
        .slider.round {
          border-radius: 30px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default DeviceMonitor;