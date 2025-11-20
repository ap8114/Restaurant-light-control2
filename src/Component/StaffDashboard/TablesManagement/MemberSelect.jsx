import { useState, useEffect } from 'react';
import { Form, Button, Modal } from 'react-bootstrap';

const MemberSelect = ({ members, selectedMember, setSelectedMember, setMembers }) => {
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    discount: ''
  });
  const [errors, setErrors] = useState({
    name: false,
    discount: false
  });

  const [canAddCustomer, setCanAddCustomer] = useState(false);

  useEffect(() => {
    try {
      const permissions = JSON.parse(localStorage.getItem("permissions"));
      if (permissions?.customerManagement?.addCustomer) {
        setCanAddCustomer(true);
      }
    } catch (err) {
      console.error("Error parsing permissions", err);
    }
  }, []);

  const handleAddCustomer = () => {
    // Reset errors
    setErrors({ name: false, discount: false });

    // Validate inputs
    let isValid = true;
    if (!newCustomer.name.trim()) {
      setErrors(prev => ({ ...prev, name: true }));
      isValid = false;
    }

    const discountValue = parseInt(newCustomer.discount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      setErrors(prev => ({ ...prev, discount: true }));
      isValid = false;
    }

    if (!isValid) return;

    // Add new customer
    const newMember = {
      id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
      name: newCustomer.name.trim(),
      discount: discountValue
    };

    setMembers([...members, newMember]);
    setSelectedMember(newMember);
    setNewCustomer({ name: '', discount: '' });
    setShowModal(false);
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Select Customer</Form.Label>
        <div className="d-flex gap-2">
          <Form.Select
            value={selectedMember ? selectedMember.id : ""}
            onChange={(e) => {
              const memberId = Number(e.target.value);
              const member = members.find((m) => m.id === memberId);
              setSelectedMember(member || null);
            }}
            style={{ flex: 1 }}
          >
            <option value="">Select Customer</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.discount}%)
              </option>
            ))}
          </Form.Select>

          {canAddCustomer && (
            <Button
              variant="outline-primary"
              onClick={() => setShowModal(true)}
            >
              + Add New
            </Button>
          )}
        </div>
      </Form.Group>

      {/* Add Customer Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setNewCustomer({ name: '', discount: '' });
        setErrors({ name: false, discount: false });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Customer Name</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="Enter customer name"
              isInvalid={errors.name}
            />
            {errors.name && <Form.Control.Feedback type="invalid">Please enter a name</Form.Control.Feedback>}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Discount Percentage</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="100"
              value={newCustomer.discount}
              onChange={(e) => setNewCustomer({ ...newCustomer, discount: e.target.value })}
              placeholder="Enter discount (0-100)"
              isInvalid={errors.discount}
            />
            {errors.discount && <Form.Control.Feedback type="invalid">Please enter a valid discount (0-100)</Form.Control.Feedback>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowModal(false);
            setNewCustomer({ name: '', discount: '' });
            setErrors({ name: false, discount: false });
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCustomer}>
            Add Customer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MemberSelect;
