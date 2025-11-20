import React, { useState, useEffect } from 'react';
import {
  RiPrinterLine,
  RiRestaurantLine,
  RiGobletLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiDownloadLine,
} from 'react-icons/ri';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axiosInstance from '../../../utils/axiosInstance';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import printerService from '../../../services/PrinterService';

const PrinterSetup = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState([]);
  // State for printer mappings
  const [kitchenPrinter, setKitchenPrinter] = useState('');
  const [barPrinter, setBarPrinter] = useState('');
  const [kitchenMapping, setKitchenMapping] = useState('');
  const [barMapping, setBarMapping] = useState('');
  // State for save button feedback
  const [kitchenSaveStatus, setKitchenSaveStatus] = useState(false);
  const [barSaveStatus, setBarSaveStatus] = useState(false);
  // State for add printer modal
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  // State for edit printer modal
  const [showEditPrinterModal, setShowEditPrinterModal] = useState(false);
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState(null);
  const [newPrinter, setNewPrinter] = useState({
    printer_id: '',
    name: '',
    type: 'kitchen',
    ip_address: '',
    port: 9100,
  });
  const [editingPrinter, setEditingPrinter] = useState(null);

  // Fetch printers from API
  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/printers');
      setPrinters(response.data.data.printers);
      // Set default mappings if they exist
      const kitchenPrinters = response.data.data.printers.filter(
        (p) => p.type === 'kitchen'
      );
      const barPrinters = response.data.data.printers.filter(
        (p) => p.type === 'bar'
      );
      if (kitchenPrinters.length > 0) {
        setKitchenPrinter(kitchenPrinters[0].printer_id);
        setKitchenMapping(`Food → ${kitchenPrinters[0].name}`);
      }
      if (barPrinters.length > 0) {
        setBarPrinter(barPrinters[0].printer_id);
        setBarMapping(`Drinks → ${barPrinters[0].name}`);
      }
    } catch (err) {
      setError('Failed to fetch printers');
      console.error('Error fetching printers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle save kitchen mapping
  const handleSaveKitchen = () => {
    const selectedPrinter = printers.find(
      (p) => p.printer_id === kitchenPrinter
    );
    if (selectedPrinter) {
      setKitchenMapping(`Food → ${selectedPrinter.name}`);
      setKitchenSaveStatus(true);
      setTimeout(() => setKitchenSaveStatus(false), 2000);
    }
  };

  // Handle save bar mapping
  const handleSaveBar = () => {
    const selectedPrinter = printers.find((p) => p.printer_id === barPrinter);
    if (selectedPrinter) {
      setBarMapping(`Drinks → ${selectedPrinter.name}`);
      setBarSaveStatus(true);
      setTimeout(() => setBarSaveStatus(false), 2000);
    }
  };

  // Handle add new printer
  const handleAddPrinter = async () => {
    try {
      await axiosInstance.post(`/printers`, newPrinter);
      setShowAddPrinterModal(false);
      setNewPrinter({
        printer_id: '',
        name: '',
        type: 'kitchen',
        ip_address: '',
        port: 9100,
      });
      fetchPrinters(); // Refresh the list
      toast.success('Printer added successfully!');
    } catch (err) {
      setError('Failed to add printer');
      console.error('Error adding printer:', err);
      toast.error('Failed to add printer');
    }
  };

  // Handle edit printer
  const handleEditPrinter = async () => {
    try {
      await axiosInstance.put(`/printers/${editingPrinter.id}`, editingPrinter);
      setShowEditPrinterModal(false);
      setEditingPrinter(null);
      fetchPrinters(); // Refresh the list
      toast.success('Printer updated successfully!');
    } catch (err) {
      setError('Failed to update printer');
      console.error('Error updating printer:', err);
      toast.error('Failed to update printer');
    }
  };

  // Handle delete printer
  const handleDeletePrinter = async () => {
    try {
      await axiosInstance.delete(`/printers/${printerToDelete.id}`);
      setShowDeleteModal(false);
      setPrinterToDelete(null);
      fetchPrinters(); // Refresh the list
      toast.success('Printer deleted successfully!');
    } catch (err) {
      setError('Failed to delete printer');
      console.error('Error deleting printer:', err);
      toast.error('Failed to delete printer');
    }
  };

  // Open edit modal with printer data
  const openEditModal = (printer) => {
    setEditingPrinter({ ...printer });
    setShowEditPrinterModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (printer) => {
    setPrinterToDelete(printer);
    setShowDeleteModal(true);
  };

  // Handle Test Print with fallback system
  const handleTestPrint = async (printer) => {
    try {
      // Initialize printer service
      await printerService.initialize();

      // Add printer to service if not already added
      printerService.addNetworkPrinter({
        id: printer.id,
        name: printer.name,
        type: printer.type,
        ip: printer.ip_address,
        port: printer.port || 9100
      });

      // Test print with automatic fallback
      const result = await printerService.testPrint(printer.id);

      if (result.success) {
        toast.success(`Test successful using ${result.method}: ${printer.name}`);
      } else {
        toast.warning(`Direct print failed, but fallback saved receipt`);
      }
    } catch (err) {
      toast.error(`Test print failed: ${err.message}`);
      console.error(err);
    }
  };

  // Discover printers on network
  const handleDiscoverPrinters = async () => {
    setDiscovering(true);
    try {
      const discovered = await printerService.discoverPrinters('192.168.1');
      setDiscoveredPrinters(discovered);
      toast.success(`Found ${discovered.length} potential printers!`);
    } catch (error) {
      toast.error('Failed to discover printers');
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) {
    return <div className="p-3">Loading printers...</div>;
  }

  if (error) {
    return <div className="p-3 alert alert-danger">{error}</div>;
  }

  return (
    <div className="p-3">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3 mb-2">
            <h1 className="fs-3 fw-bold text-dark">Printer Setup</h1>
          </div>
        </div>
      </div>
      <div className="row g-4">
        {/* Left Column - Printer Mappings */}
        <div className="col-lg-4">
          {/* Food to Kitchen Printer Mapping */}
          <div className="card bg-white mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <RiRestaurantLine className="text-warning" />
                <h2 className="h5 mb-0">Map Food → Kitchen Printer</h2>
              </div>
              <div className="mb-3">
                <label className="form-label">Select Kitchen Printer</label>
                <div className="input-group">
                  <select
                    className="form-select"
                    value={kitchenPrinter}
                    onChange={(e) => setKitchenPrinter(e.target.value)}
                  >
                    {printers
                      .filter((p) => p.type === 'kitchen')
                      .map((printer) => (
                        <option
                          key={printer.id}
                          value={printer.printer_id}
                        >
                          {printer.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="alert alert-light mb-3">
                <p className="mb-1 small text-muted">Current Mapping:</p>
                <p className="mb-0 fw-medium">{kitchenMapping}</p>
              </div>
              <button
                className={`btn w-100 ${kitchenSaveStatus ? 'btn-success' : 'btn-warning'
                  }`}
                onClick={handleSaveKitchen}
                disabled={!kitchenPrinter}
              >
                {kitchenSaveStatus ? 'Saved!' : 'Save Kitchen Mapping'}
              </button>
            </div>
          </div>
          {/* Drinks to Bar Printer Mapping */}
          <div className="card bg-white">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <RiGobletLine className="text-warning" />
                <h2 className="h5 mb-0">Map Drinks → Bar Printer</h2>
              </div>
              <div className="mb-3">
                <label className="form-label">Select Bar Printer</label>
                <div className="input-group">
                  <select
                    className="form-select"
                    value={barPrinter}
                    onChange={(e) => setBarPrinter(e.target.value)}
                  >
                    {printers
                      .filter((p) => p.type === 'bar')
                      .map((printer) => (
                        <option
                          key={printer.id}
                          value={printer.printer_id}
                        >
                          {printer.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="alert alert-light mb-3">
                <p className="mb-1 small text-muted">Current Mapping:</p>
                <p className="mb-0 fw-medium">{barMapping}</p>
              </div>
              <button
                className={`btn w-100 ${barSaveStatus ? 'btn-success' : 'btn-warning'
                  }`}
                onClick={handleSaveBar}
                disabled={!barPrinter}
              >
                {barSaveStatus ? 'Saved!' : 'Save Bar Mapping'}
              </button>
            </div>
          </div>
        </div>
        {/* Right Column - Printer Controls */}
        <div className="col-lg-8">
          <div className="card bg-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h5 mb-0">Printer List</h2>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-warning d-flex align-items-center gap-2"
                    onClick={handleDiscoverPrinters}
                    disabled={discovering}
                  >
                    {discovering ? (
                      <><Spinner size="sm" /> Scanning...</>
                    ) : (
                      <><RiSearchLine /> Discover</>
                    )}
                  </button>
                  <button
                    className="btn btn-warning d-flex align-items-center gap-2"
                    onClick={() => setShowAddPrinterModal(true)}
                  >
                    <RiAddLine /> Add Printer
                  </button>
                </div>
              </div>

              {/* Discovered Printers Alert */}
              {discoveredPrinters.length > 0 && (
                <Alert variant="success" className="mb-3">
                  <strong>Found {discoveredPrinters.length} Printer(s)!</strong>
                  <div className="mt-2">
                    {discoveredPrinters.map((dp, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                        <span>{dp.ip}:{dp.port}</span>
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => {
                            setNewPrinter({
                              ...newPrinter,
                              ip_address: dp.ip,
                              port: dp.port
                            });
                            setShowAddPrinterModal(true);
                          }}
                        >
                          Add This Printer
                        </Button>
                      </div>
                    ))}
                  </div>
                </Alert>
              )}

              {/* Fallback Info */}
              <Alert variant="info" className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <RiDownloadLine />
                  <div>
                    <strong>Multi-Level Fallback Enabled:</strong><br />
                    <small>Network → Web Print → PDF → Email → Local Storage</small>
                  </div>
                </div>
              </Alert>
              <div className="row g-3">
                {printers.map((printer) => (
                  <div className="col-12" key={printer.id}>
                    <div
                      className={`card ${printer.status === 'online'
                        ? 'border-success'
                        : 'border-danger'
                        }`}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <RiPrinterLine
                              className={`fs-4 ${printer.status === 'online'
                                ? 'text-success'
                                : 'text-danger'
                                }`}
                            />
                            <div>
                              <h3 className="h6 mb-0">{printer.name}</h3>
                              <p className="small text-muted mb-0">
                                {printer.type.charAt(0).toUpperCase() +
                                  printer.type.slice(1)}{' '}
                                Printer
                                {printer.ip_address &&
                                  ` • ${printer.ip_address}:${printer.port}`}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className={`rounded-circle ${printer.status === 'online'
                                ? 'bg-success'
                                : 'bg-danger'
                                }`}
                              style={{ width: '12px', height: '12px' }}
                            ></div>
                            <span
                              className={`small fw-medium ${printer.status === 'online'
                                ? 'text-success'
                                : 'text-danger'
                                }`}
                            >
                              {printer.status === 'online'
                                ? 'Online'
                                : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end mt-3 gap-2">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleTestPrint(printer)}
                          >
                            Test Print
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditModal(printer)}
                          >
                            <RiEditLine /> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openDeleteModal(printer)}
                          >
                            <RiDeleteBinLine /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Printer Modal */}
      <Modal
        show={showAddPrinterModal}
        onHide={() => setShowAddPrinterModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Printer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Printer ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. KITCHEN_02"
                value={newPrinter.printer_id}
                onChange={(e) =>
                  setNewPrinter({
                    ...newPrinter,
                    printer_id: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Printer Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Kitchen Printer 2"
                value={newPrinter.name}
                onChange={(e) =>
                  setNewPrinter({ ...newPrinter, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Printer Type</Form.Label>
              <Form.Select
                value={newPrinter.type}
                onChange={(e) =>
                  setNewPrinter({ ...newPrinter, type: e.target.value })
                }
              >
                <option value="kitchen">Kitchen Printer</option>
                <option value="bar">Bar Printer</option>
                <option value="receipt">Receipt Printer</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IP Address (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 192.168.1.102"
                value={newPrinter.ip_address}
                onChange={(e) =>
                  setNewPrinter({
                    ...newPrinter,
                    ip_address: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g. 9100"
                value={newPrinter.port}
                onChange={(e) =>
                  setNewPrinter({
                    ...newPrinter,
                    port: parseInt(e.target.value) || 9100,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddPrinterModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleAddPrinter}
            disabled={!newPrinter.printer_id || !newPrinter.name}
          >
            Add Printer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Printer Modal */}
      <Modal
        show={showEditPrinterModal}
        onHide={() => setShowEditPrinterModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Printer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Printer ID</Form.Label>
              <Form.Control
                type="text"
                value={editingPrinter?.printer_id || ''}
                onChange={(e) =>
                  setEditingPrinter({
                    ...editingPrinter,
                    printer_id: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Printer Name</Form.Label>
              <Form.Control
                type="text"
                value={editingPrinter?.name || ''}
                onChange={(e) =>
                  setEditingPrinter({ ...editingPrinter, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Printer Type</Form.Label>
              <Form.Select
                value={editingPrinter?.type || 'kitchen'}
                onChange={(e) =>
                  setEditingPrinter({ ...editingPrinter, type: e.target.value })
                }
              >
                <option value="kitchen">Kitchen Printer</option>
                <option value="bar">Bar Printer</option>
                <option value="receipt">Receipt Printer</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IP Address</Form.Label>
              <Form.Control
                type="text"
                value={editingPrinter?.ip_address || ''}
                onChange={(e) =>
                  setEditingPrinter({
                    ...editingPrinter,
                    ip_address: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="number"
                value={editingPrinter?.port || 9100}
                onChange={(e) =>
                  setEditingPrinter({
                    ...editingPrinter,
                    port: parseInt(e.target.value) || 9100,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditPrinterModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleEditPrinter}
            disabled={!editingPrinter?.printer_id || !editingPrinter?.name}
          >
            Update Printer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the printer "{printerToDelete?.name}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeletePrinter}
          >
            Delete Printer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PrinterSetup;