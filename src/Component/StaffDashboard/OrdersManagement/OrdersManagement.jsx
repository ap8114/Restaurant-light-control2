import React, { useState, useEffect, useMemo } from "react";
import "./OrderManagement.css";
import TableManagement from "./TableManagement";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import axiosInstance from "../../../utils/axiosInstance";

const OrdersManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState("register");
  const [activeFloor, setActiveFloor] = useState("main");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    specialRequests: "",
  });
  const [orderNote, setOrderNote] = useState("");
  const [orderType, setOrderType] = useState("dineIn");
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSides, setSelectedSides] = useState([]);
  const [isSidesModalOpen, setIsSidesModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [splitCount, setSplitCount] = useState(2);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [sessionData, setSessionData] = useState("");
  const [showCombinedBillModal, setShowCombinedBillModal] = useState(false);
  const [combinedBillData, setCombinedBillData] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false); // New state for sending order loading

  const navigate = useNavigate();
  const location = useLocation();

  // Handle session data from navigation state
  useEffect(() => {
    if (location.state?.session && location.state?.fromSession) {
      const session = location.state.session;
      setSessionData(session.id);

      // Set table information
      setSelectedTable({
        id: session.table_id,
        table_number: session.table_number,
        table_name: session.table_name,
        table_type: session.table_type,
        status: session.status,
        hourly_rate: parseFloat(session.hourly_rate),
      });

      // Set customer information
      setCustomerInfo({
        name: session.customer_name || "",
        phone: session.customer_phone || "",
        specialRequests: "",
      });

      // Set order type to dine-in
      setOrderType("dineIn");

      // Switch to register tab
      setActiveTab("register");
    }
  }, [location.state]);

  // Save with expiry (24 hours = 86400000 ms)
  useEffect(() => {
    localStorage.setItem(
      "customername",
      JSON.stringify({
        value: customerInfo.name,
        expiry: Date.now() + 86400000, // 24 hours from now
      })
    );
  }, [customerInfo.name]);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("customername");
    if (savedCustomer) {
      const parsed = JSON.parse(savedCustomer);
      if (Date.now() < parsed.expiry) {
        setSelectedCustomer(parsed.value);
      } else {
        localStorage.removeItem("customername"); // delete after 24 hours
      }
    }
  }, []);

  // total order
  const [customerOrderSummary, setCustomerOrderSummary] = useState({
    totalOrders: 0,
    totalAmount: 0,
  });

  const calculateCustomerOrderSummary = () => {
    if (!selectedCustomer || !orders.length) {
      setCustomerOrderSummary({ totalOrders: 0, totalAmount: 0 });
      return;
    }

    const customerOrders = orders.filter(
      (order) => order.customer_name === selectedCustomer
    );

    const totalAmount = customerOrders.reduce(
      (sum, order) => sum + parseFloat(order.total_amount || 0),
      0
    );

    setCustomerOrderSummary({
      totalOrders: customerOrders.length,
      totalAmount: totalAmount,
    });
  };

  useEffect(() => {
    calculateCustomerOrderSummary();
  }, [selectedCustomer, orders]);

  // filter orders by selectedCustomer
  const filteredOrders = selectedCustomer
    ? orders.filter((order) => order?.customer_name === selectedCustomer)
    : [];

  // Helper functions - moved up to be available before combinedTotals
  const calculateSubtotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  const calculateTax = () => {
    if (!businessSettings || !businessSettings.tax) return 0;
    const taxRate = parseFloat(businessSettings.tax);
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // NEW: memo selectors for the selected table
  const selectedTableUnpaidOrders = useMemo(() => {
    if (!selectedTable || !orders?.length) return [];
    return orders.filter(
      (o) =>
        String(o.table_id) === String(selectedTable.id) && o.status !== "paid"
    );
  }, [orders, selectedTable]);

  const previousTotals = useMemo(() => {
    const subtotal = selectedTableUnpaidOrders.reduce(
      (sum, o) => sum + parseFloat(o.subtotal || 0),
      0
    );
    const tax = selectedTableUnpaidOrders.reduce(
      (sum, o) => sum + parseFloat(o.tax_amount || 0),
      0
    );
    const total = selectedTableUnpaidOrders.reduce(
      (sum, o) => sum + parseFloat(o.total_amount || 0),
      0
    );
    return { subtotal, tax, total };
  }, [selectedTableUnpaidOrders]);

  // current cart (on the left) uses your existing calculateSubtotal/Tax/Total
  const combinedTotals = useMemo(
    () => ({
      subtotal: previousTotals.subtotal + calculateSubtotal(),
      tax: previousTotals.tax + calculateTax(),
      total: previousTotals.total + calculateTotal(),
    }),
    [previousTotals, orderItems, businessSettings]
  );

  // Fetch business settings to get tax information
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await axiosInstance.get("/business_settings");
        const data = response.data.data;
        setBusinessSettings(data);
      } catch (error) {
        console.error("Error fetching business settings:", error);
        setBusinessSettings({
          tax: "5",
          receipt_footer: "Thank you for your visit!",
          system_mode: "online",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchBusinessSettings();
  }, []);

  // Helper function to check if table selection is required
  const requireTableForDineIn = (action = "proceed") => {
    if (orderType === "dineIn" && !selectedTable) {
      alert(`Please select a table for Dine In order to ${action}`);
      setActiveTab("tables");
      return true;
    }
    return false;
  };

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchSubcategories = async () => {
      try {
        const res = await axiosInstance.get(
          `/subcategories?category_id=${selectedCategory}`
        );
        if (res.data.success) {
          setSubcategories(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };
    fetchSubcategories();
  }, [selectedCategory]);

  // Fetch items when subcategory is clicked
  const handleSubcategoryClick = async (sub) => {
    try {
      const res = await axiosInstance.get(`/items/${sub.id}`);
      if (res.data.success) {
        setItems(res.data.data);
        setSelectedSubcategory(sub.subcategory_name);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    if (!sessionData) return;
    try {
      setLoading(true);
      const sessionId = String(sessionData); // Ensure it's a string
      const res = await axiosInstance.get(`/orders/session/${sessionId}`);
      console.log("Orders API Response:", res.data);

      if (res.data.success) {
        setOrders(res.data.data.orders || []);
        setTotalPages(res.data.data.orders.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (sessionData) {
      fetchOrders();
    }
  }, [sessionData]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await axiosInstance.get("/users?page=1&limit=10&role=user");
        if (res.data.data.users) {
          setCustomers(res.data.data.users);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const addToOrder = (product) => {
    if (requireTableForDineIn("add items")) {
      return;
    }
    if (product.sides && product.sides.length > 0) {
      setSelectedProduct(product);
      setSelectedSides([]);
      setIsSidesModalOpen(true);
    } else {
      const existingItem = orderItems.find((item) => item.id === product.id);
      if (existingItem) {
        setOrderItems(
          orderItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setOrderItems([...orderItems, { ...product, quantity: 1 }]);
      }
    }
  };

  const handleSideToggle = (side) => {
    setSelectedSides((prevSides) => {
      const sideExists = prevSides.find((s) => s.id === side.id);
      if (sideExists) {
        return prevSides.filter((s) => s.id !== side.id);
      } else {
        return [...prevSides, side];
      }
    });
  };

  const handleAddWithSides = () => {
    const existingItem = orderItems.find(
      (item) =>
        item.id === selectedProduct.id &&
        JSON.stringify(item.sides) === JSON.stringify(selectedSides)
    );
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === selectedProduct.id &&
          JSON.stringify(item.sides) === JSON.stringify(selectedSides)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          ...selectedProduct,
          quantity: 1,
          sides: selectedSides,
          price:
            selectedProduct.price +
            selectedSides.reduce((sum, side) => sum + side.price, 0),
        },
      ]);
    }
    setIsSidesModalOpen(false);
    setSelectedProduct(null);
    setSelectedSides([]);
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setActiveTab("register");
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setOrderItems(order.items);
    setSelectedTable({
      table_number: order.table_number,
      table_name: order.table_name,
      table_type: order.table_type || "dining",
      capacity: order.capacity || 4,
      status: order.status || "available",
    });
    setCustomerInfo({
      name: order.customer || "",
      phone: "",
      specialRequests: "",
    });
    setActiveTab("register");
  };

  // Modified handlePayment function to show combined bill modal
  const handlePayment = () => {
    if (orderItems.length === 0) {
      alert("Please add items to the order first");
      return;
    }
    if (requireTableForDineIn("process payment")) {
      return;
    }
    const taxPercentage = businessSettings
      ? parseFloat(businessSettings.tax)
      : 5;

    // Format items properly for the billing page
    const formattedItems = orderItems.map((item) => ({
      id: item.id,
      item_name: item.name,
      item_description: item.description || "",
      quantity: item.quantity,
      unit_price: item.price,
      total_with_tax: item.price * item.quantity * (1 + taxPercentage / 100),
      special_instructions:
        item.sides && item.sides.length > 0
          ? `Sides: ${item.sides.map((side) => side.name).join(", ")}`
          : "",
    }));

    const orderData = {
      id: `temp-${Date.now()}`,
      order_number: `TEMP-${Date.now()}`,
      table_number: selectedTable ? selectedTable.table_number : null,
      table_name: selectedTable ? selectedTable.table_name : null,
      customer_name: customerInfo.name || "Walk-in Customer",
      order_type:
        orderType === "dineIn"
          ? "dine_in"
          : orderType === "takeOut"
          ? "takeaway"
          : "Guest",
      special_instructions: orderNote,
      items: formattedItems, // Use the formatted items
      subtotal: calculateSubtotal().toFixed(2),
      tax_amount: calculateTax().toFixed(2),
      total_amount: calculateTotal().toFixed(2),
      created_at: new Date().toISOString(),
      status: "pending",
      tax_percentage: taxPercentage,
    };

    // Show combined bill modal instead of navigating
    if (selectedTable && selectedTableUnpaidOrders.length > 0) {
      const combinedPayload = buildCombinedBillingPayload(
        selectedTableUnpaidOrders,
        businessSettings
      );
      setCombinedBillData(combinedPayload);
      setShowCombinedBillModal(true);
    } else {
      navigate("/staff/billingguestpayment", { state: { orderData } });
    }
  };

  // Handle table payment from Orders screen
  const handleTablePayment = (tableOrders) => {
    const combinedPayload = buildCombinedBillingPayload(
      tableOrders,
      businessSettings
    );
    setCombinedBillData(combinedPayload);
    setShowCombinedBillModal(true);
  };

  const handleSendOrder = async () => {
    if (requireTableForDineIn("send the order")) {
      return;
    }
    if (orderItems.length === 0) {
      alert("Please add items to the order first");
      return;
    }
    
    // Set loading state to true
    setIsSendingOrder(true);
    
    try {
      // Calculate order totals
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const totalAmount = calculateTotal();
      const taxPercentage = businessSettings
        ? parseFloat(businessSettings.tax)
        : 5;

      // Prepare order items with complete details
      const preparedOrderItems = orderItems.map((item) => {
        // Calculate item total including sides
        const sidesTotal = item.sides
          ? item.sides.reduce((sum, side) => sum + side.price, 0)
          : 0;
        const itemTotalBeforeTax = (item.price + sidesTotal) * item.quantity;
        const itemTax = (itemTotalBeforeTax * taxPercentage) / 100;
        const itemTotalWithTax = itemTotalBeforeTax + itemTax;

        return {
          item_details: {
            ...item, // Include all item properties
            sides: item.sides || [], // Ensure sides is included
          },
          quantity: item.quantity,
          special_instructions:
            item.sides && item.sides.length > 0
              ? `Sides: ${item.sides.map((side) => side.name).join(", ")}`
              : "",
          // Item pricing details
          base_price: item.price,
          sides_total: sidesTotal,
          item_total_before_tax: itemTotalBeforeTax,
          item_tax: itemTax,
          item_total_with_tax: itemTotalWithTax,
        };
      });

      // Determine order type
      let orderTypeValue;
      if (orderType === "dineIn") {
        orderTypeValue = "dine_in";
      } else if (orderType === "takeOut") {
        orderTypeValue = "takeaway";
      } else {
        orderTypeValue = "Guest";
      }

      const orderData = {
        session_id: sessionData || null,
        table_id: selectedTable ? selectedTable.id : null,
        customer_name: customerInfo.name || "Walk-in Customer",
        order_type: orderTypeValue,
        special_instructions: orderNote,
        items: preparedOrderItems, // Send complete item details
        // Order totals
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        tax_percentage: taxPercentage,
      };

      console.log("Prepared Order Data:", orderData);

      const response = await axiosInstance.post("/orders", orderData);
      if (response.data.success) {
        alert("Order sent successfully!");
        setOrderItems([]);
        await fetchOrders(); // refresh the order list so the sent order appears in previousOrders
        // do not clear selectedTable; keep it selected for new orders
      } else {
        alert(
          "Failed to send order: " + (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error sending order:", error);
      alert(
        "Error sending order: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      // Reset loading state to false regardless of success or error
      setIsSendingOrder(false);
    }
  };

  // NEW: When a table has no unpaid orders left, clear UI for that table
  useEffect(() => {
    if (!selectedTable) return;
    const hasUnpaid = orders.some(
      (o) =>
        String(o.table_id) === String(selectedTable.id) && o.status !== "paid"
    );
    if (!hasUnpaid) {
      // clear previous + current because payment finished for the table
      setOrderItems([]);
      setOrderNote("");
      setSelectedCustomer(null);
      // You can keep or clear selectedTable. Most POS systems clear it:
      // setSelectedTable(null);
    }
  }, [orders, selectedTable]);

  const handleAction = (actionType) => {
    setIsActionsModalOpen(false);
    switch (actionType) {
      case "customerNote":
        setIsNoteModalOpen(true);
        break;
      case "bill":
        if (orderItems.length === 0) {
          alert("Please add items to the order first");
          return;
        }
        if (requireTableForDineIn("generate bill")) {
          return;
        }
        handlePayment();
        break;
      case "guests":
        setIsCustomerModalOpen(true);
        break;
      case "split":
        if (orderItems.length === 0) {
          alert("Please add items to the order first");
          return;
        }
        setIsSplitModalOpen(true);
        break;
      case "transferMerge":
        if (orderItems.length === 0) {
          alert("Please add items to the order first");
          return;
        }
        if (requireTableForDineIn("transfer/merge order")) {
          return;
        }
        alert("Transfer/Merge functionality would be implemented here");
        break;
      case "transferCourse":
        if (orderItems.length === 0) {
          alert("Please add items to the order first");
          return;
        }
        alert("Transfer course functionality would be implemented here");
        break;
      case "pricelist":
        setActiveTab("register");
        setSelectedCategory(null);
        setSearchTerm("");
        break;
      case "refund":
        if (orderItems.length === 0) {
          alert("No items to refund");
          return;
        }
        if (window.confirm("Are you sure you want to refund this order?")) {
          alert("Refund processed successfully");
          setOrderItems([]);
        }
        break;
      case "tax":
        const taxPercentage = businessSettings
          ? parseFloat(businessSettings.tax)
          : 5;
        alert(`Tax Amount: $${calculateTax().toFixed(2)} (${taxPercentage}%)`);
        break;
      case "cancelOrder":
        if (orderItems.length === 0) {
          alert("No active order to cancel");
          return;
        }
        if (window.confirm("Are you sure you want to cancel this order?")) {
          setOrderItems([]);
          setSelectedTable(null);
          setCustomerInfo({ name: "", phone: "", specialRequests: "" });
          setOrderNote("");
        }
        break;
      case "printReceipt":
        if (orderItems.length === 0) {
          alert("No items to print receipt for");
          return;
        }
        setIsReceiptModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleSplitOrder = () => {
    if (splitCount <= 0) {
      alert("Please enter a valid number of splits");
      return;
    }
    const amountPerPerson = calculateTotal() / splitCount;
    alert(`Split amount per person: $${amountPerPerson.toFixed(2)}`);
    setIsSplitModalOpen(false);
  };

  const handleClearOrder = () => {
    if (
      window.confirm(
        "Are you sure you want to clear everything? This will reset customer details, items, table selection, and notes."
      )
    ) {
      setOrderItems([]);
      setSelectedTable(null);
      setCustomerInfo({
        name: "",
        phone: "",
        specialRequests: "",
      });
      setOrderNote("");
      setSelectedCustomer(null);
      setSelectedOrder(null);
      setSessionData(null);
    }
  };

  // Build combined billing payload
  const buildCombinedBillingPayload = (tableOrders, businessSettings) => {
    const taxPercentage = Number(businessSettings?.tax ?? 5);

    // table-level info (पहले order से)
    const first = tableOrders[0] || {};
    const tableInfo =
      first.table_name && first.table_number
        ? `${first.table_name} (${first.table_number})`
        : "N/A";
    const customerInfo = first.customer_name || "N/A";

    // सभी orders के items flatten + normalize
    const allItems = tableOrders.flatMap((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return items.map((item, idx) => {
        const d = item.item_details || {};
        const unitPrice = Number(d.price ?? item.unit_price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        const sidesTotal = Number(item.sides_total ?? 0);
        const itemTax = Number(item.item_tax ?? 0);

        return {
          // पहचान के लिए order context
          order_id: order.id,
          order_number: order.order_number,
          line_id: `${order.id}-${idx + 1}`, // unique line id

          id: d.id ?? item.id,
          item_name:
            d.item_name ?? item.item_name ?? `Item #${d.id ?? item.id ?? "NA"}`,
          item_description: d.description ?? item.item_description ?? "",
          quantity,
          unit_price: unitPrice,
          sides_total: sidesTotal,
          item_tax: itemTax,
          special_instructions: item.special_instructions ?? "",

          // convenience fields
          total_without_tax: (unitPrice + sidesTotal) * quantity,
          total_with_tax: (unitPrice + sidesTotal) * quantity + itemTax,
        };
      });
    });

    // Combined totals (अगर order level subtotals हैं, तो भरो; वरना items से निकालो)
    const combinedSubtotal =
      tableOrders.reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0) ||
      allItems.reduce((s, it) => s + Number(it.total_without_tax ?? 0), 0);

    const combinedTax =
      tableOrders.reduce((sum, o) => sum + Number(o.tax_amount ?? 0), 0) ||
      allItems.reduce((s, it) => s + Number(it.item_tax ?? 0), 0);

    const combinedDiscount = tableOrders.reduce(
      (sum, o) => sum + Number(o.discount_amount ?? 0),
      0
    );

    const combinedTotal =
      tableOrders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0) ||
      combinedSubtotal + combinedTax - combinedDiscount;

    // Overall status (example logic)
    const hasPending = tableOrders.some((o) => o.status === "pending");
    const hasCancelled = tableOrders.some((o) => o.status === "cancelled");
    const hasCompleted = tableOrders.some((o) => o.status === "completed");
    let overallStatus = "pending";
    if (hasCancelled) overallStatus = "cancelled";
    else if (hasCompleted && !hasPending) overallStatus = "completed";

    // सबसे recent order (time display आदि के लिए)
    const recentOrder = tableOrders.reduce(
      (latest, o) =>
        new Date(o.created_at) > new Date(latest.created_at) ? o : latest,
      tableOrders[0]
    );

    return {
      type: "COMBINED_TABLE_BILL", // 👈 ताकि BillingPayment समझ सके
      taxPercentage,
      table_id: first.table_id ?? "no-table",
      table_label: tableInfo,
      customer_name: customerInfo,
      orders_count: tableOrders.length,
      items_count: allItems.length,
      orders: tableOrders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        status: o.status,
        subtotal: Number(o.subtotal ?? 0),
        tax_amount: Number(o.tax_amount ?? 0),
        discount_amount: Number(o.discount_amount ?? 0),
        total_amount: Number(o.total_amount ?? 0),
        // raw items भी भेजना हो तो:
        items: Array.isArray(o.items) ? o.items : [],
      })),
      items: allItems, // 🔥 flattened, normalized
      totals: {
        subtotal: Number(combinedSubtotal.toFixed(2)),
        tax: Number(combinedTax.toFixed(2)),
        discount: Number(combinedDiscount.toFixed(2)),
        total: Number(combinedTotal.toFixed(2)),
      },
      overallStatus,
      recentOrderTime: recentOrder?.created_at ?? null,
    };
  };

  useEffect(() => {
    const styles = document.createElement("style");
    styles.innerHTML = `
.table-highlight {
outline: 3px solid #3B82F6 !important;
outline-offset: 4px;
transition: outline-color 0.3s ease;
}
@keyframes pulse {
0% { outline-color: #3B82F6; }
50% { outline-color: #60A5FA; }
100% { outline-color: #3B82F6; }
}
.animate-pulse {
animation: pulse 1s infinite;
}
.selected-row {
background-color: #fff3cd !important;
border-left: 4px solid #ffc107;
}
.table-selectable {
position: relative;
transition: transform 0.2s, box-shadow 0.2s;
}
.table-selectable:hover {
transform: scale(1.05);
box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
.table-selectable.selected {
box-shadow: 0 0 0 3px #3B82F6;
}
.receipt-container {
font-family: 'Courier New', monospace;
padding: 20px;
max-width: 300px;
margin: 0 auto;
background-color: white;
}
.receipt-header {
text-align: center;
margin-bottom: 20px;
border-bottom: 1px dashed #ccc;
padding-bottom: 10px;
}
.receipt-title {
font-size: 18px;
font-weight: bold;
margin-bottom: 5px;
}
.receipt-subtitle {
font-size: 12px;
margin-bottom: 5px;
}
.receipt-section {
margin-bottom: 15px;
}
.receipt-section-title {
font-weight: bold;
margin-bottom: 5px;
font-size: 14px;
}
.receipt-item {
display: flex;
justify-content: space-between;
margin-bottom: 5px;
font-size: 12px;
}
.receipt-total {
display: flex;
justify-content: space-between;
font-weight: bold;
margin-top: 10px;
padding-top: 10px;
border-top: 1px dashed #ccc;
}
.session-indicator {
border-left: 4px solid #0dcaf0;
}
@media print {
body * {
visibility: hidden;
}
.receipt-container, .receipt-container * {
visibility: visible;
}
.receipt-container {
position: absolute;
left: 0;
top: 0;
width: 100%;
}
}
`;
    document.head.appendChild(styles);
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("courseDropdown");
      const button = document.getElementById("courseButton");
      if (
        dropdown &&
        button &&
        !button.contains(event.target) &&
        !dropdown.contains(event.target)
      ) {
        dropdown.classList.add("d-none");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const onJumpToOrders = () => {
    setActiveTab("register");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const taxPercentage = businessSettings ? parseFloat(businessSettings.tax) : 5;

  // Combined Bill Modal Component
  const CombinedBillModal = () => (
    <Modal
      show={showCombinedBillModal}
      onHide={() => setShowCombinedBillModal(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Combined Table Bill</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {combinedBillData && (
          <div className="receipt-container">
            {/* Receipt Header */}
            <div className="receipt-header">
              <div className="receipt-title">RESTAURANT NAME</div>
              <div className="receipt-subtitle">123 Main Street, City</div>
              <div className="receipt-subtitle">Phone: (123) 456-7890</div>
              <div className="receipt-subtitle">
                --------------------------------
              </div>
            </div>

            {/* Table Information */}
            <div className="receipt-section">
              <div className="receipt-section-title">TABLE INFORMATION</div>
              <div className="receipt-item">
                <span>Table:</span>
                <span>{combinedBillData.table_label}</span>
              </div>
              <div className="receipt-item">
                <span>Customer:</span>
                <span>{combinedBillData.customer_name}</span>
              </div>
              <div className="receipt-item">
                <span>Orders Count:</span>
                <span>{combinedBillData.orders_count} orders</span>
              </div>
              <div className="receipt-item">
                <span>Items Count:</span>
                <span>{combinedBillData.items_count} items</span>
              </div>
            </div>

            {/* Orders and Items */}
            <div className="receipt-section">
              <div className="receipt-section-title">ORDERS & ITEMS</div>
              {combinedBillData.orders.map((order, orderIndex) => (
                <div key={order.id} className="mb-3">
                  <div className="fw-bold mb-1">
                    Order #{order.order_number} (
                    {new Date(order.created_at).toLocaleTimeString()})
                  </div>
                  {order.items.map((item, itemIndex) => (
                    <div key={`${order.id}-${itemIndex}`} className="ms-3">
                      <div className="receipt-item">
                        <span>
                          {item.quantity}x{" "}
                          {item.item_details?.item_name || `Item #${item.id}`}
                        </span>
                        <span>
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      {item.sides_total > 0 && (
                        <div className="receipt-item ms-3">
                          <span>+ Sides</span>
                          <span>${item.sides_total.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="receipt-item ms-3 fw-bold">
                    <span>Order Total:</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Combined Totals */}
            <div className="receipt-section">
              <div className="receipt-section-title">COMBINED TOTALS</div>
              <div className="receipt-item">
                <span>Subtotal:</span>
                <span>${combinedBillData.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-item">
                <span>Tax ({combinedBillData.taxPercentage}%):</span>
                <span>${combinedBillData.totals.tax.toFixed(2)}</span>
              </div>
              <div className="receipt-item">
                <span>Discount:</span>
                <span>${combinedBillData.totals.discount.toFixed(2)}</span>
              </div>
              <div className="receipt-total">
                <span>TOTAL:</span>
                <span>${combinedBillData.totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="receipt-header" style={{ marginTop: "20px" }}>
              <div className="receipt-subtitle">
                --------------------------------
              </div>
              <div className="receipt-subtitle">Thank you for your visit!</div>
              <div className="receipt-subtitle">Please come again</div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowCombinedBillModal(false)}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            // Navigate to billing payment page with combined data
            navigate(`/staff/billingpayment/${combinedBillData.orders[0].id}`, {
              state: { orderData: combinedBillData },
            });
            setShowCombinedBillModal(false);
          }}
        >
          Proceed to Payment
        </Button>
        <Button variant="success" onClick={() => window.print()}>
          Print Receipt
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // NEW: Function to determine available order types based on table type
  const getAvailableOrderTypes = () => {
    if (
      selectedTable &&
      ["pool", "playstation", "snooker"].includes(
        selectedTable.table_type?.toLowerCase()
      )
    ) {
      return ["dineIn"]; // Only Dine In option for these table types
    }
    return ["dineIn", "takeOut", "Guest"]; // All options for other table types
  };

  // NEW: Function to check if Pay button should be shown
  const shouldShowPayButton = () => {
    // For pool, playstation, or snooker tables, never show Pay button
    if (
      selectedTable &&
      ["pool", "playstation", "snooker"].includes(
        selectedTable.table_type?.toLowerCase()
      )
    ) {
      return false;
    }

    // For all other tables, show Pay button when orderType is not "dineIn"
    return orderType !== "dineIn";
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="">
        <h1 className="fs-3 fw-bold text-dark mb-0">Order Management</h1>
      </div>

      {/* Top Navigation */}
      <div className="mt-3 mb-3">
        <div className="d-flex overflow-auto">
          {["tables", "register", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${
                activeTab === tab ? "btn-warning" : "btn-light"
              } rounded-pill mx-1 flex-shrink-0`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-hidden">
        {/* Register Screen */}
        {activeTab === "register" && (
          <div className="d-flex flex-column flex-lg-row h-100">
            {/* Left Panel - Order Summary */}
            <div
              className="bg-white border-end d-flex flex-column"
              style={{ width: "100%", maxWidth: "350px" }}
            >
              {/* Customer Section */}
              <div className="p-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h6 mb-0">Current Order</h3>
                  <span className="text-muted small">
                    {selectedTable
                      ? `Table ${selectedTable.table_number}`
                      : "No Table Selected"}
                  </span>
                </div>

                {/* Session Information */}
                {sessionData && (
                  <div className="session-indicator mb-3 p-2 bg-info bg-opacity-10 rounded">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small">Session Information</span>
                      <span className="badge bg-info">Active Session</span>
                    </div>
                    <div className="small">
                      <div className="mb-1">
                        <strong>Session ID:</strong> {sessionData.session_id}
                      </div>
                      <div className="mb-1">
                        <strong>Started:</strong>{" "}
                        {new Date(sessionData.created_at).toLocaleString()}
                      </div>
                      <div>
                        <strong>Current Cost:</strong> ${" "}
                        {sessionData.session_cost}
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Details Section */}
                {selectedTable && (
                  <div className="table-details mb-3 p-2 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small">Table Details</span>
                      <span
                        className={`badge ${
                          selectedTable.status === "available"
                            ? "bg-success"
                            : selectedTable.status === "occupied"
                            ? "bg-danger"
                            : "bg-warning"
                        }`}
                      >
                        {selectedTable.status}
                      </span>
                    </div>
                    <div className="small">
                      <div className="mb-1">
                        <strong>Name:</strong> {selectedTable.table_name}
                      </div>
                      <div className="mb-1">
                        <strong>Type:</strong> {selectedTable.table_type}
                      </div>
                      <div>
                        <strong>Capacity:</strong> {selectedTable.capacity}{" "}
                        people
                      </div>
                      {selectedTable.hourly_rate && (
                        <div className="mt-1">
                          <strong>Rate:</strong> ${selectedTable.hourly_rate}/hr
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Details Section */}
                {customerInfo.name && (
                  <div className="customer-details mb-3 p-2 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small">Customer Details</span>
                      <span className="badge bg-info">
                        {selectedCustomer ? "Registered" : "Walk-in"}
                      </span>
                    </div>
                    <div className="small">
                      <div className="mb-1">
                        <strong>Name:</strong> {customerInfo.name}
                      </div>
                      {customerInfo.phone && (
                        <div className="mb-1">
                          <strong>Phone:</strong> {customerInfo.phone}
                        </div>
                      )}
                      {customerInfo.specialRequests && (
                        <div>
                          <strong>Special Requests:</strong>{" "}
                          {customerInfo.specialRequests}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- NEW: Previous Orders for the selected table (read-only) --- */}
                {selectedTable && (
                  <div className="mb-3 p-2 bg-white border rounded">
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold small">
                        Previous Orders (This Table)
                      </span>
                      <span className="badge bg-secondary">
                        {selectedTableUnpaidOrders.length} open
                      </span>
                    </div>
                    {selectedTableUnpaidOrders.length === 0 ? (
                      <div className="small text-muted mt-2">
                        No previous unpaid orders.
                      </div>
                    ) : (
                      <div
                        className="mt-2"
                        style={{ maxHeight: 220, overflowY: "auto" }}
                      >
                        {selectedTableUnpaidOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="border rounded p-2 mb-2 bg-light"
                          >
                            <div className="d-flex justify-content-between">
                              <div className="fw-semibold small">
                                #{ord.order_number || ord.id}
                              </div>
                              <div className="small text-muted">
                                {new Date(ord.created_at).toLocaleString()}
                              </div>
                            </div>
                            {/* Items (names only, not editable) */}
                            <div className="mt-1">
                              {(ord.items || []).slice(0, 5).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="d-flex justify-content-between small"
                                >
                                  <span className="text-truncate">
                                    {it?.item_details?.item_name ||
                                      `Item #${it?.item_details?.id}`}
                                  </span>
                                  <span className="text-muted">
                                    ×{it?.quantity || 1}
                                  </span>
                                </div>
                              ))}
                              {(ord.items || []).length > 5 && (
                                <div className="small text-muted">+ more…</div>
                              )}
                            </div>
                            <div className="d-flex justify-content-between mt-1 fw-semibold">
                              <span>Total</span>
                              <span>
                                ${parseFloat(ord.total_amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Previous totals */}
                    <div className="border-top pt-2 mt-2">
                      <div className="d-flex justify-content-between small">
                        <span>Prev Subtotal</span>
                        <span>${previousTotals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between small">
                        <span>Prev Tax</span>
                        <span>${previousTotals.tax.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold">Prev Total</span>
                        <span className="fw-bold">
                          ${previousTotals.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="btn btn-light flex-grow-1 text-start btn-sm"
                  >
                    <i className="fa fa-user-plus me-2"></i>Add Customer
                  </button>
                  <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="btn btn-light flex-grow-1 text-start btn-sm"
                  >
                    <i className="fa fa-sticky-note me-2"></i>Note
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {filteredOrders.map((order, index) => (
                  <div
                    key={index}
                    className="border rounded shadow-sm p-3 mb-4 bg-light"
                  >
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold text-primary">
                        Order #{index + 1}
                      </h6>
                      <small className="text-muted">
                        {order?.date || "No Date"}
                      </small>
                    </div>

                    {/* Items */}
                    <div className="mb-3">
                      {order?.items?.map((it, i) => (
                        <div
                          key={i}
                          className="d-flex justify-content-between border-bottom py-2"
                        >
                          <span>{it?.item_details?.item_name}</span>
                          <span className="text-muted">x1</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>Total</span>
                      <span className="text-dark">${order?.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Middle Section: Scrollable Order Items */}
              <div
                className="flex-grow-1"
                style={{
                  minHeight: "310px",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              >
                <div className="p-2">
                  {orderItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold small">
                            {item.item_name}
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderItems(
                                  orderItems.filter(
                                    (orderItem, idx) => idx !== index
                                  )
                                );
                              }}
                              className="btn btn-link text-danger p-0"
                            >
                              <i className="fa fa-times small"></i>
                            </button>
                            <span className="text-muted small">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mt-1">
                          <span className="text-muted small">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-muted small ms-2">
                            {" "}
                            ${parseFloat(item.price || 0).toFixed(2)} each
                          </span>
                        </div>
                        {item.sides && item.sides.length > 0 && (
                          <div className="mt-1">
                            {item.sides.map((side) => (
                              <div
                                key={side.id}
                                className="d-flex justify-content-between small text-muted"
                              >
                                <span>+ {side.name}</span>
                                <span>${side.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Calculator + Totals */}
              <div className="p-2 border-top">
                {/* Calculator Display */}
                <div className="bg-light p-2 rounded mb-2">
                  <div className="text-end fs-4 font-monospace mb-1">
                    ${calculateTotal().toFixed(2)}
                  </div>
                  <div className="text-end small text-muted">
                    Subtotal: ${calculateSubtotal().toFixed(2)} + Tax (
                    {taxPercentage}%): ${calculateTax().toFixed(2)}
                  </div>
                </div>

                {/* --- NEW: Combined Totals (Previous + Current) --- */}
                <div className="bg-white p-2 rounded mt-2 border">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Combined Subtotal</span>
                    <span>${combinedTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Combined Tax</span>
                    <span>${combinedTotals.tax.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Combined Total</span>
                    <span className="fw-bold">
                      ${combinedTotals.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Type & Course */}
                <div className="d-flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      const types = getAvailableOrderTypes(); // Use new function
                      const currentIndex = types.indexOf(orderType);
                      const nextIndex = (currentIndex + 1) % types.length;
                      setOrderType(types[nextIndex]);
                      if (
                        orderType === "dineIn" &&
                        types[nextIndex] !== "dineIn"
                      ) {
                        setSelectedTable(null);
                      }
                    }}
                    className={`btn btn-sm flex-grow-1 ${
                      orderType === "dineIn"
                        ? "btn-warning"
                        : orderType === "takeOut"
                        ? "btn-success"
                        : "btn-purple"
                    }`}
                  >
                    <span>
                      <i
                        className={`fa ${
                          orderType === "dineIn"
                            ? "fa-cutlery"
                            : orderType === "takeOut"
                            ? "fa-shopping-bag"
                            : "fa-motorcycle"
                        } me-2 small`}
                      ></i>
                      {orderType === "dineIn"
                        ? "Dine In"
                        : orderType === "takeOut"
                        ? "Take Out"
                        : "Guest"}
                    </span>
                  </button>

                  {/* Only show Pay button if shouldShowPayButton returns true */}
                  {shouldShowPayButton() && (
                    <button
                      onClick={handlePayment}
                      className="btn btn-success btn-sm flex-grow-1"
                    >
                      <i className="fa fa-credit-card me-1 small"></i>Pay
                    </button>
                  )}

                  <button
                    onClick={() => setIsActionsModalOpen(true)}
                    className="btn btn-light btn-sm"
                  >
                    <i className="fas fa-ellipsis-vertical small"></i>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  {orderType === "dineIn" && (
                    <button
                      onClick={() => {
                        setActiveTab("tables");
                        setSelectedTable(null);
                        setOrderItems([]);
                        setSelectedOrder(null);
                      }}
                      className="btn btn-dark btn-sm flex-grow-1"
                    >
                      New
                    </button>
                  )}
                  <button
                    onClick={handleClearOrder}
                    className="btn btn-danger btn-sm flex-grow-1"
                  >
                    <i className="fa fa-trash me-1 small"></i>Clear
                  </button>
                  <button
                    onClick={handleSendOrder}
                    className="btn btn-warning btn-sm flex-grow-1"
                    disabled={isSendingOrder}
                  >
                    {isSendingOrder ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Processing...</span>
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column">
              {/* Search Bar */}
              <div className="p-2">
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              {/* Category Switcher */}
              <div className="p-3">
                <div className="d-flex gap-2 overflow-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`btn ${
                        selectedCategory === category.id
                          ? "btn-warning"
                          : "btn-light"
                      } flex-shrink-0`}
                    >
                      {category.category_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory Switcher */}
              {subcategories.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="d-flex gap-2 overflow-auto">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategoryClick(sub)}
                        className="btn btn-outline-secondary flex-shrink-0"
                      >
                        {sub.subcategory_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Grid */}
              <div className="flex-grow-1 p-3 overflow-auto">
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToOrder(product)}
                      className="col"
                    >
                      <div className="card h-100 cursor-pointer hover-shadow border-0">
                        <div className="card-body text-center d-flex flex-column justify-content-center">
                          <h5 className="card-title mb-1">{product.name}</h5>
                          <p className="h5 text-warning mb-0">
                            ${product.price.toFixed(2)}
                          </p>
                          <p className="small text-muted mt-1">
                            <i className="fa fa-plus-circle mr-1"></i>
                            Select options
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal for Items */}
              <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title>{selectedSubcategory} Items</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {items.length > 0 ? (
                    <div className="list-group">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <h6 className="mb-1">{item.item_name}</h6>
                            <small className="text-muted">
                              Printer: {item.printer_name}
                            </small>
                          </div>
                          <div>
                            <span className="fw-bold text-warning me-3">
                              ${parseFloat(item.price || 0).toFixed(2)}
                            </span>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                addToOrder(item);
                                setShowModal(false);
                              }}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No items available.</p>
                  )}
                </Modal.Body>
              </Modal>
            </div>
          </div>
        )}

        {/* Tables Screen */}
        {activeTab === "tables" && (
          <div className="h-100">
            <TableManagement
              orders={orders}
              onTableSelect={handleTableSelect}
              onJumpToOrders={onJumpToOrders}
              onSelectTable={handleTableSelect}
            />
          </div>
        )}

        {/* Orders Screen */}
        {activeTab === "orders" && (
          <div className="h-100">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Table</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Subtotal</th>
                        <th>Tax</th>
                        <th>Discount</th>
                        <th>Total</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="12" className="text-center py-5">
                            Loading...
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="text-center py-5">
                            <i className="fa fa-receipt text-muted fs-1 mb-3"></i>
                            <h2 className="h4 card-title mb-2">
                              No Orders Yet
                            </h2>
                            <p className="card-text text-muted">
                              Your orders will appear here once created.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        // Group orders by table_id
                        Object.entries(
                          orders
                            .filter((order) => order.status !== "paid")
                            .reduce((acc, order) => {
                              const tableId = order.table_id || "no-table";
                              if (!acc[tableId]) acc[tableId] = [];
                              acc[tableId].push(order);
                              return acc;
                            }, {})
                        ).map(([tableId, tableOrders]) => {
                          // Calculate combined totals for all orders of this table
                          const combinedSubtotal = tableOrders.reduce(
                            (sum, order) =>
                              sum + parseFloat(order.subtotal || 0),
                            0
                          );
                          const combinedTax = tableOrders.reduce(
                            (sum, order) =>
                              sum + parseFloat(order.tax_amount || 0),
                            0
                          );
                          const combinedDiscount = tableOrders.reduce(
                            (sum, order) =>
                              sum + parseFloat(order.discount_amount || 0),
                            0
                          );
                          const combinedTotal = tableOrders.reduce(
                            (sum, order) =>
                              sum + parseFloat(order.total_amount || 0),
                            0
                          );

                          // Get table info from the first order
                          const firstOrder = tableOrders[0];
                          const tableInfo =
                            firstOrder.table_name && firstOrder.table_number
                              ? `${firstOrder.table_name} (${firstOrder.table_number})`
                              : "N/A";

                          // Get customer info from the first order
                          const customerInfo =
                            firstOrder.customer_name || "N/A";

                          // Count total items across all orders
                          const totalItems = tableOrders.reduce(
                            (sum, order) =>
                              sum + (order.items ? order.items.length : 0),
                            0
                          );

                          // Get the most recent order time
                          const recentOrder = tableOrders.reduce(
                            (latest, order) =>
                              new Date(order.created_at) >
                              new Date(latest.created_at)
                                ? order
                                : latest,
                            tableOrders[0]
                          );

                          // Determine overall status - if any order is not paid, show the most critical status
                          const hasPending = tableOrders.some(
                            (order) => order.status === "pending"
                          );
                          const hasCompleted = tableOrders.some(
                            (order) => order.status === "completed"
                          );
                          const hasCancelled = tableOrders.some(
                            (order) => order.status === "cancelled"
                          );

                          let overallStatus = "pending";
                          if (hasCancelled) {
                            overallStatus = "cancelled";
                          } else if (hasCompleted && !hasPending) {
                            overallStatus = "completed";
                          }

                          return (
                            <tr key={tableId}>
                              <td>#{recentOrder.order_number}</td>
                              <td>{recentOrder.table_id}</td>
                              <td>{customerInfo}</td>
                              <td>
                                <div>
                                  <div className="fw-semibold">
                                    {tableOrders.length} orders, {totalItems}{" "}
                                    items
                                  </div>
                                  <div className="small text-muted">
                                    {tableOrders
                                      .slice(0, 2)
                                      .map((order, idx) => (
                                        <div key={idx}>
                                          Order #{order.order_number}:{" "}
                                          {order.items?.length || 0} items
                                        </div>
                                      ))}
                                    {tableOrders.length > 2 && (
                                      <div>
                                        +{tableOrders.length - 2} more orders
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>${combinedSubtotal.toFixed(2)}</td>
                              <td>${combinedTax.toFixed(2)}</td>
                              <td>${combinedDiscount.toFixed(2)}</td>
                              <td>${combinedTotal.toFixed(2)}</td>
                              <td>
                                {new Date(
                                  recentOrder.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    overallStatus === "completed"
                                      ? "bg-success"
                                      : overallStatus === "pending"
                                      ? "bg-warning text-dark"
                                      : overallStatus === "cancelled"
                                      ? "bg-danger"
                                      : "bg-info"
                                  }`}
                                >
                                  {overallStatus}
                                </span>
                              </td>

                              <td>
                                <button
                                  className="btn btn-success btn-sm flex-grow-1"
                                  onClick={() =>
                                    handleTablePayment(tableOrders)
                                  }
                                >
                                  <i className="fa fa-credit-card me-1 small"></i>
                                  Pay
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Customer Information</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsCustomerModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Customer</label>
                  <select
                    className="form-select"
                    value={selectedCustomer || ""}
                    onChange={(e) => {
                      const customerId = e.target.value;
                      if (customerId) {
                        const customer = customers.find(
                          (c) => c.id === parseInt(customerId)
                        );
                        if (customer) {
                          setSelectedCustomer(customer.name); // ✅ string
                          setCustomerInfo({
                            ...customerInfo,
                            name: customer.name,
                            phone: customer.phone,
                          });
                          localStorage.setItem("customername", customer.name); // ✅ save name
                        }
                      } else {
                        setSelectedCustomer("");
                        setCustomerInfo({
                          ...customerInfo,
                          name: "",
                          phone: "",
                        });
                        localStorage.removeItem("customername");
                      }
                    }}
                  >
                    <option value="">Select Customer</option>
                    {loadingCustomers ? (
                      <option disabled>Loading customers...</option>
                    ) : (
                      customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Special Requests</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={customerInfo.specialRequests}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        specialRequests: e.target.value,
                      })
                    }
                    placeholder="Enter any special requests"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCustomerModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => setIsCustomerModalOpen(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Notes</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsNoteModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Enter cooking preferences, allergies, or special requests..."
                    maxLength={500}
                  ></textarea>
                  <div className="text-end small text-muted mt-1">
                    {orderNote.length}/500 characters
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNoteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => setIsNoteModalOpen(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sides Selection Modal */}
      {isSidesModalOpen && selectedProduct && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">{selectedProduct.name}</h5>
                  <div className="small text-muted">
                    ${selectedProduct.price.toFixed(2)} (+ VAT: 5% DU)
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setIsSidesModalOpen(false);
                    setSelectedProduct(null);
                    setSelectedSides([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">Sides</h6>
                <div className="row row-cols-2 g-3">
                  {selectedProduct?.sides?.map((side) => (
                    <div key={side.id} className="col">
                      <button
                        type="button"
                        onClick={() => handleSideToggle(side)}
                        className={`btn w-100 p-3 ${
                          selectedSides.find((s) => s.id === side.id)
                            ? "btn-outline-warning active"
                            : "btn-outline-secondary"
                        }`}
                      >
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-bold">{side.name}</span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsSidesModalOpen(false);
                    setSelectedProduct(null);
                    setSelectedSides([]);
                  }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleAddWithSides}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Modal */}
      {isSplitModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Split Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsSplitModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Number of Splits</label>
                  <input
                    type="number"
                    className="form-control"
                    value={splitCount}
                    onChange={(e) =>
                      setSplitCount(parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                </div>
                <div className="alert alert-info">
                  Total Amount: ${calculateTotal().toFixed(2)}
                  <br />
                  Amount per person: ${" "}
                  {(calculateTotal() / splitCount).toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSplitModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSplitOrder}
                >
                  Split Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {isActionsModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Actions</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsActionsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row row-cols-3 g-3">
                  {[
                    {
                      icon: "fa-sticky-note",
                      text: "Customer Note",
                      action: "customerNote",
                    },
                    { icon: "fa-file-invoice", text: "Bill", action: "bill" },
                    { icon: "fa-users", text: "Guests", action: "guests" },
                    { icon: "fa-percentage", text: "Split", action: "split" },
                    {
                      icon: "fa-exchange-alt",
                      text: "Transfer / Merge",
                      action: "transferMerge",
                    },
                    {
                      icon: "fa-sync",
                      text: "Transfer course",
                      action: "transferCourse",
                    },
                    { icon: "fa-list", text: "Pricelist", action: "pricelist" },
                    { icon: "fa-undo", text: "Refund", action: "refund" },
                    { icon: "fa-receipt", text: "Tax", action: "tax" },
                    {
                      icon: "fa-print",
                      text: "Print Receipt",
                      action: "printReceipt",
                    },
                  ].map((action, index) => (
                    <div key={index} className="col">
                      <button
                        onClick={() => handleAction(action.action)}
                        className="btn btn-light w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                      >
                        <i
                          className={`fa ${action.icon} fs-4 mb-2 text-muted`}
                        ></i>
                        <span className="small">{action.text}</span>
                      </button>
                    </div>
                  ))}
                  <div className="col-6">
                    <button
                      onClick={() => handleAction("cancelOrder")}
                      className="btn btn-outline-danger w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                    >
                      <i className="fa fa-times-circle fs-4 mb-2"></i>
                      <span className="small">Cancel Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Receipt</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsReceiptModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="receipt-container">
                  {/* Receipt Header */}
                  <div className="receipt-header">
                    <div className="receipt-title">RESTAURANT NAME</div>
                    <div className="receipt-subtitle">
                      123 Main Street, City
                    </div>
                    <div className="receipt-subtitle">
                      Phone: (123) 456-7890
                    </div>
                    <div className="receipt-subtitle">
                      --------------------------------
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="receipt-section">
                    <div className="receipt-section-title">
                      ORDER INFORMATION
                    </div>
                    <div className="receipt-item">
                      <span>Receipt #:</span>
                      <span>
                        {selectedOrder
                          ? selectedOrder.order_number
                          : `TEMP-${Date.now()}`}
                      </span>
                    </div>
                    <div className="receipt-item">
                      <span>Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="receipt-item">
                      <span>Time:</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="receipt-item">
                      <span>Order Type:</span>
                      <span>
                        {orderType === "dineIn"
                          ? "Dine In"
                          : orderType === "takeOut"
                          ? "Take Out"
                          : "Guest"}
                      </span>
                    </div>
                  </div>

                  {/* Table Details */}
                  {selectedTable && (
                    <div className="receipt-section">
                      <div className="receipt-section-title">TABLE DETAILS</div>
                      <div className="receipt-item">
                        <span>Table:</span>
                        <span>
                          {selectedTable.table_name} (
                          {selectedTable.table_number})
                        </span>
                      </div>
                      <div className="receipt-item">
                        <span>Type:</span>
                        <span>{selectedTable.table_type}</span>
                      </div>
                      <div className="receipt-item">
                        <span>Capacity:</span>
                        <span>{selectedTable.capacity} people</span>
                      </div>
                    </div>
                  )}

                  {/* Customer Details */}
                  {customerInfo.name && (
                    <div className="receipt-section">
                      <div className="receipt-section-title">
                        CUSTOMER DETAILS
                      </div>
                      <div className="receipt-item">
                        <span>Name:</span>
                        <span>{customerInfo.name}</span>
                      </div>
                      {customerInfo.phone && (
                        <div className="receipt-item">
                          <span>Phone:</span>
                          <span>{customerInfo.phone}</span>
                        </div>
                      )}
                      {selectedCustomer && (
                        <div className="receipt-item">
                          <span>Type:</span>
                          <span>Registered Customer</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="receipt-section">
                    <div className="receipt-section-title">ORDER ITEMS</div>
                    {orderItems.map((item, index) => (
                      <div key={index}>
                        <div className="receipt-item">
                          <span>
                            {item.item_name} x {item.quantity}
                          </span>
                          <span>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.sides && item.sides.length > 0 && (
                          <div
                            className="receipt-item"
                            style={{ paddingLeft: "10px", fontSize: "10px" }}
                          >
                            <span>
                              + {item.sides.map((s) => s.name).join(", ")}
                            </span>
                            <span>
                              ${" "}
                              {item.sides
                                .reduce((sum, side) => sum + side.price, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="receipt-section">
                    <div className="receipt-item">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="receipt-item">
                      <span>Tax ({taxPercentage}%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="receipt-total">
                      <span>TOTAL:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Note */}
                  {orderNote && (
                    <div className="receipt-section">
                      <div className="receipt-section-title">NOTE</div>
                      <div>{orderNote}</div>
                    </div>
                  )}

                  {/* Receipt Footer */}
                  <div className="receipt-header" style={{ marginTop: "20px" }}>
                    <div className="receipt-subtitle">
                      --------------------------------
                    </div>
                    <div className="receipt-subtitle">
                      Thank you for your visit!
                    </div>
                    <div className="receipt-subtitle">Please come again</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsReceiptModalOpen(false)}
                >
                  Close
                </Button>
                <Button variant="primary" onClick={handlePrintReceipt}>
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Combined Bill Modal */}
      <CombinedBillModal />
    </div>
  );
};

export default OrdersManagement;