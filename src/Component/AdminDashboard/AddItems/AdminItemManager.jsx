import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTable, FaTh, FaEye, FaArrowLeft, FaPlus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from '../../../utils/axiosInstance';

const SAddCategories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [categoryPrinter, setCategoryPrinter] = useState('');
  const [subcategoryPrinter, setSubcategoryPrinter] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categoryStack, setCategoryStack] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [loading, setLoading] = useState(false);
  const [itemTypes, setItemTypes] = useState([
    { item_name: "", price: "" }
  ]);

  const pageSize = 5;

  // Get current parent from stack
  const currentParent = categoryStack.length > 0 ? categoryStack[categoryStack.length - 1] : null;

  // Determine current view level
  const currentLevel = categoryStack.length === 0 ? 'categories' :
    categoryStack.length === 1 ? 'subcategories' : 'items';

  // Fetch all data on mount
  useEffect(() => {
    fetchCategories();
    fetchPrinters();
  }, []);

  // Filter data based on search term and current level
  useEffect(() => {
    if (currentLevel === 'categories') {
      const filtered = categories.filter(cat =>
        cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else if (currentLevel === 'subcategories' && selectedCategory) {
      const filtered = subcategories.filter(sub =>
        sub.subcategory_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        sub.category_id === selectedCategory.id
      );
      setFilteredSubcategories(filtered);
    } else if (currentLevel === 'items' && selectedSubcategory) {
      const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        item.subcategory_id === selectedSubcategory.id
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, categories, subcategories, items, currentLevel, selectedCategory, selectedSubcategory]);

  // API Functions
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/categories`);
      setCategories(response.data.data);
      console.log("Fetched Categories:", response.data);
    } catch (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrinters = async () => {
    try {
      const response = await axiosInstance.get(`/printers`);
      setPrinters(response.data.data.printers || response.data.data);
      console.log("Fetched Printers:", response.data);
    } catch (error) {
      toast.error("Failed to fetch printers");
      console.error(error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/subcategories?category_id=${categoryId}`);
      setSubcategories(response.data.data);
      console.log("Fetched Subcategories:", response.data);
    } catch (error) {
      toast.error("Failed to fetch subcategories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/items/${id}`);
      setItems(response.data.data);
      console.log("Fetched Items:", response.data);
    } catch (error) {
      toast.error("Failed to fetch items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const response = await axiosInstance.post(`/categories`, categoryData);

      if (response.status === 200 || response.status === 201) {
        const newCategory = response.data;
        setCategories(prev => [...prev, newCategory]);
        toast.success("Category added successfully!");
        fetchCategories();
        return newCategory;
      } else {
        throw new Error('Failed to add category');
      }
    } catch (error) {
      toast.error("Failed to add category");
      console.error(error);
      throw error;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, categoryData);

      if (response.status === 200) {
        const updatedCategory = response.data;
        setCategories(prev => prev.map(cat =>
          cat.id === id ? updatedCategory : cat
        ));
        toast.success("Category updated successfully!");
        fetchCategories();
      } else {
        throw new Error('Failed to update category');
      }
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);

      if (response.status === 200) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        toast.success("Category deleted successfully!");
        fetchCategories();
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    }
  };

  const addSubcategory = async (subcategoryData) => {
    try {
      const response = await axiosInstance.post(`/subcategories`, subcategoryData);

      if (response.status === 200 || response.status === 201) {
        const newSubcategory = response.data;
        setSubcategories(prev => [...prev, newSubcategory]);
        toast.success("Subcategory added successfully!");
        fetchSubcategories(subcategoryData.category_id);
        return newSubcategory;
      } else {
        throw new Error('Failed to add subcategory');
      }
    } catch (error) {
      toast.error("Failed to add subcategory");
      console.error(error);
      throw error;
    }
  };

  const updateSubcategory = async (id, subcategoryData) => {
    try {
      const response = await axiosInstance.put(`/subcategories/${id}`, subcategoryData);

      if (response.status === 200) {
        const updatedSubcategory = response.data;
        setSubcategories(prev => prev.map(sub =>
          sub.id === id ? updatedSubcategory : sub
        ));
        toast.success("Subcategory updated successfully!");
        fetchSubcategories(subcategoryData.category_id);
      } else {
        throw new Error('Failed to update subcategory');
      }
    } catch (error) {
      toast.error("Failed to update subcategory");
      console.error(error);
    }
  };

  const deleteSubcategory = async (id) => {
    try {
      const response = await axiosInstance.delete(`/subcategories/${id}`);

      if (response.status === 200) {
        setSubcategories(prev => prev.filter(sub => sub.id !== id));
        toast.success("Subcategory deleted successfully!");
        fetchSubcategories(selectedCategory.id);
      } else {
        throw new Error('Failed to delete subcategory');
      }
    } catch (error) {
      toast.error("Failed to delete subcategory");
      console.error(error);
    }
  };

  const addItem = async (itemData) => {
    try {
      const response = await axiosInstance.post(`/items`, itemData);

      if (response.status === 200 || response.status === 201) {
        toast.success("Item added successfully!");
        fetchItems(itemData.subcategory_id);
        return response.data;
      } else {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
      console.error(error);
      throw error;
    }
  };

  const updateItem = async (id, itemData) => {
    try {
      const response = await axiosInstance.put(`/items/${id}`, itemData);

      if (response.status === 200) {
        const updatedItem = response.data;
        setItems(prev => prev.map(item =>
          item.id === id ? updatedItem : item
        ));
        toast.success("Item updated successfully!");
        fetchItems(itemData.subcategory_id);
      } else {
        throw new Error('Failed to update item');
      }
    } catch (error) {
      toast.error("Failed to update item");
      console.error(error);
    }
  };

  const deleteItem = async (id) => {
    try {
      const response = await axiosInstance.delete(`/items/${id}`);

      if (response.status === 200) {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success("Item deleted successfully!");
        fetchItems(selectedSubcategory.id);
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      toast.error("Failed to delete item");
      console.error(error);
    }
  };

  // UI Helper Functions
  const resetForm = () => {
    setCategoryName('');
    setSubcategoryName('');
    setItemName('');
    setSelectedPrinter('');
    setCategoryPrinter('');
    setSubcategoryPrinter('');
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditingItem(null);
    setItemTypes([{ item_name: "", price: "" }]);
  };

  const handleAddOrUpdateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      toast.error("Please enter category name");
      return;
    }

    try {
      const categoryData = {
        category_name: categoryName,
        printer_id: categoryPrinter ? parseInt(categoryPrinter) : null
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        fetchCategories();
      } else {
        await addCategory(categoryData);
        fetchCategories();
      }
      setShowCategoryModal(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the API functions
    }
  };

  const handleAddOrUpdateSubcategory = async (e) => {
    e.preventDefault();
    if (!subcategoryName || !selectedCategory) {
      toast.error("Please enter subcategory name");
      return;
    }

    try {
      // Use the printer from the category if not explicitly set for subcategory
      const printerId = subcategoryPrinter || selectedCategory.printer_id;

      const subcategoryData = {
        subcategory_name: subcategoryName,
        category_id: selectedCategory.id,
        printer_id: printerId ? parseInt(printerId) : null
      };

      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, subcategoryData);
        fetchSubcategories(selectedCategory.id);
      } else {
        await addSubcategory(subcategoryData);
        fetchSubcategories(selectedCategory.id);
      }
      setShowSubcategoryModal(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the API functions
    }
  };

  const handleAddRow = () => {
    setItemTypes([...itemTypes, { item_name: "", price: "" }]);
  };

  const handleRemoveRow = (index) => {
    const newTypes = [...itemTypes];
    newTypes.splice(index, 1);
    setItemTypes(newTypes);
  };

  const handleChangeRow = (index, field, value) => {
    const newTypes = [...itemTypes];
    newTypes[index][field] = value;
    setItemTypes(newTypes);
  };

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();

    // Basic validations
    if (!selectedSubcategory || !selectedCategory) {
      toast.error("Please fill all required fields");
      return;
    }

    // Determine printer - use item's printer if set, otherwise use subcategory's, then category's
    let printerId = selectedPrinter;
    if (!printerId && selectedSubcategory.printer_id) {
      printerId = selectedSubcategory.printer_id;
    } else if (!printerId && selectedCategory.printer_id) {
      printerId = selectedCategory.printer_id;
    }

    if (!printerId) {
      toast.error("Please select a printer");
      return;
    }

    // Empty rows filter karna
    const filteredItems = itemTypes.filter(
      (item) => item.item_name.trim() !== "" && item.price !== ""
    );

    if (filteredItems.length === 0) {
      toast.error("Please add at least one item with price");
      return;
    }

    try {
      if (editingItem) {
        // 🔄 Edit case
        await updateItem(editingItem.id, {
          printer_id: parseInt(printerId),
          subcategory_id: selectedSubcategory.id,
          category_id: selectedCategory.id,
          items: filteredItems.map((item) => ({
            item_name: item.item_name,
            price: parseFloat(item.price)
          }))
        });
        fetchItems(selectedSubcategory.id);
      } else {
        // ➕ Add case
        await addItem({
          printer_id: parseInt(printerId),
          subcategory_id: selectedSubcategory.id,
          category_id: selectedCategory.id,
          items: filteredItems.map((item) => ({
            item_name: item.item_name,
            price: parseFloat(item.price)
          }))
        });
        fetchItems(selectedSubcategory.id);
      }

      setShowItemModal(false);
      resetForm();
    } catch (error) {
      // Error handling already in API functions
      console.error("Error in add/update item", error);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setCategoryPrinter(category.printer_id || '');
    setShowCategoryModal(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryName(subcategory.subcategory_name);
    setSubcategoryPrinter(subcategory.printer_id || '');
    setShowSubcategoryModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setSelectedPrinter(item.printer_id || '');
    setShowItemModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    await deleteCategory(id);
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
    await deleteSubcategory(id);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await deleteItem(id);
  };

  const handleViewSubcategories = async (category) => {
    setSelectedCategory(category);
    setCategoryStack([...categoryStack, category]);
    await fetchSubcategories(category.id);
  };

  const handleViewItems = async (subcategory) => {
    setSelectedSubcategory(subcategory);
    setCategoryStack([...categoryStack, subcategory]);
    await fetchItems(subcategory.id);
  };

  const handleGoBack = () => {
    if (categoryStack.length > 0) {
      const newStack = [...categoryStack];
      newStack.pop();
      setCategoryStack(newStack);

      if (newStack.length === 0) {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
      } else if (newStack.length === 1) {
        setSelectedSubcategory(null);
      }
    }
  };

  const getBreadcrumbPath = () => {
    if (categoryStack.length === 0) return "Categories";
    return ["Categories", ...categoryStack.map(item => item.category_name || item.subcategory_name || item.item_name)].join(" > ");
  };

  const getAddButtonText = () => {
    if (currentLevel === 'categories') return "Add Category";
    if (currentLevel === 'subcategories') return "Add Subcategory";
    return "Add Item";
  };

  const handleAddClick = () => {
    if (currentLevel === 'categories') {
      setShowCategoryModal(true);
    } else if (currentLevel === 'subcategories') {
      setShowSubcategoryModal(true);
    } else {
      setShowItemModal(true);
    }
    resetForm();
  };

  // Get printer name by ID
  const getPrinterName = (printerId) => {
    if (!printerId) return "No Printer";
    const printer = printers.find(p => p.id === printerId);
    return printer ? printer.name || printer.printer_name : 'Unknown Printer';
  };

  // Pagination calculations
  const getCurrentData = () => {
    if (currentLevel === 'categories') return filteredCategories;
    if (currentLevel === 'subcategories') return filteredSubcategories;
    return filteredItems;
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.length / pageSize);
  const paginatedData = currentData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-3">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">{getBreadcrumbPath()}</h3>
        <div className="d-flex align-items-center">
          {/* Search box */}
          <div className="me-2">
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${currentLevel}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Back button (only if inside subcategory or item) */}
          {categoryStack.length > 0 && (
            <button className="btn btn-secondary me-2 d-flex align-items-center" onClick={handleGoBack}>
              <FaArrowLeft className="me-1" />
              <span>Back</span>
            </button>
          )}

          {/* View mode buttons (only for categories and subcategories) */}
          {(currentLevel === 'categories' || currentLevel === 'subcategories') && (
            <>
              <button
                className={`btn ${viewMode === "table" ? "btn-warning" : "btn-outline-warning"} me-2`}
                onClick={() => setViewMode("table")}
              >
                <FaTable />
              </button>
              <button
                className={`btn ${viewMode === "kanban" ? "btn-warning" : "btn-outline-warning"} me-2`}
                onClick={() => setViewMode("kanban")}
              >
                <FaTh />
              </button>
            </>
          )}

          {/* Add button */}
          <button
            className="btn btn-warning d-flex align-items-center"
            onClick={handleAddClick}
          >
            <FaPlus className="me-2" />
            <span>{getAddButtonText()}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : viewMode === "table" || currentLevel === 'items' ? (
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle text-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Printer</th>
                    {currentLevel === 'items' && <th>Price</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={currentLevel === 'items' ? "5" : "4"} className="text-center text-muted py-4">
                        {`No ${currentLevel} Found`}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr
                        key={item.id}
                        onClick={(e) => {
                          if (!e.target.closest("button, .no-row-click")) {
                            if (currentLevel === 'categories') {
                              handleViewSubcategories(item);
                            } else if (currentLevel === 'subcategories') {
                              handleViewItems(item);
                            }
                          }
                        }}
                        style={{ cursor: currentLevel !== 'items' ? "pointer" : "default" }}
                      >
                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                        <td>
                          {currentLevel === 'categories' && item.category_name}
                          {currentLevel === 'subcategories' && item.subcategory_name}
                          {currentLevel === 'items' && item.item_name}
                        </td>
                        <td>
                          {currentLevel === 'categories' && getPrinterName(item.printer_id)}
                          {currentLevel === 'subcategories' && getPrinterName(item.printer_id)}
                          {currentLevel === 'items' && getPrinterName(item.printer_id)}
                        </td>
                        {currentLevel === 'items' && <td>{item.price}</td>}
                        <td className="no-row-click">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentLevel === 'categories') handleEditCategory(item);
                                else if (currentLevel === 'subcategories') handleEditSubcategory(item);
                                else handleEditItem(item);
                              }}
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentLevel === 'categories') handleDeleteCategory(item.id);
                                else if (currentLevel === 'subcategories') handleDeleteSubcategory(item.id);
                                else handleDeleteItem(item.id);
                              }}
                            >
                              <FaTrash size={14} />
                            </button>
                            {currentLevel !== 'items' && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentLevel === 'categories') {
                                    setSelectedCategory(item);
                                    setShowSubcategoryModal(true);
                                  } else if (currentLevel === 'subcategories') {
                                    setSelectedSubcategory(item);
                                    setShowItemModal(true);
                                  }
                                }}
                              >
                                <FaPlus size={14} />
                              </button>
                            )}
                            {currentLevel !== 'items' && (
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentLevel === 'categories') handleViewSubcategories(item);
                                  else if (currentLevel === 'subcategories') handleViewItems(item);
                                }}
                              >
                                <FaEye size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3 small text-muted">
              <div>
                Showing {currentData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, currentData.length)} of {currentData.length} results
              </div>
              <div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View for Categories and Subcategories */
        <div className="row">
          {currentData.map((item) => (
            <div key={item.id} className="col-md-3 mb-3">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">{item.category_name || item.subcategory_name}</h6>
                  <small className="text-muted">{getPrinterName(item.printer_id)}</small>
                </div>
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mt-2">
                    <button
                      className="btn btn-sm btn-outline-warning me-2"
                      onClick={() => {
                        if (currentLevel === 'categories') handleEditCategory(item);
                        else handleEditSubcategory(item);
                      }}
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger me-2"
                      onClick={() => {
                        if (currentLevel === 'categories') handleDeleteCategory(item.id);
                        else handleDeleteSubcategory(item.id);
                      }}
                    >
                      <FaTrash size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success me-2"
                      onClick={() => {
                        if (currentLevel === 'categories') {
                          setSelectedCategory(item);
                          setShowSubcategoryModal(true);
                        } else {
                          setSelectedSubcategory(item);
                          setShowItemModal(true);
                        }
                      }}
                    >
                      <FaPlus size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => {
                        if (currentLevel === 'categories') handleViewSubcategories(item);
                        else handleViewItems(item);
                      }}
                    >
                      <FaEye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <>
          <div className="modal show fade d-block">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleAddOrUpdateCategory}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingCategory ? "Edit Category" : "Add Category"}</h5>
                    <button type="button" className="btn-close" onClick={() => { setShowCategoryModal(false); resetForm(); }}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Category Name*</label>
                      <input type="text" className="form-control" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Printer</label>
                      <select
                        className="form-select"
                        value={categoryPrinter}
                        onChange={(e) => setCategoryPrinter(e.target.value)}
                      >
                        <option value="">Select Printer</option>
                        {Array.isArray(printers) &&
                          printers.map((printer) => (
                            <option key={printer.id} value={printer.id}>
                              {printer.name || printer.printer_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); resetForm(); }}>Cancel</button>
                    <button type="submit" className="btn btn-warning">{editingCategory ? "Update" : "Add"} Category</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <>
          <div className="modal show fade d-block">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleAddOrUpdateSubcategory}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</h5>
                    <button type="button" className="btn-close" onClick={() => { setShowSubcategoryModal(false); resetForm(); }}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Subcategory Name*</label>
                      <input type="text" className="form-control" value={subcategoryName} onChange={(e) => setSubcategoryName(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Printer</label>
                      <select
                        className="form-select"
                        value={subcategoryPrinter}
                        onChange={(e) => setSubcategoryPrinter(e.target.value)}
                      >
                        <option value="">Use Category Printer</option>
                        {Array.isArray(printers) &&
                          printers.map((printer) => (
                            <option key={printer.id} value={printer.id}>
                              {printer.name || printer.printer_name}
                            </option>
                          ))}
                      </select>
                      <small className="form-text text-muted">
                        Current Category Printer: {selectedCategory ? getPrinterName(selectedCategory.printer_id) : "Not set"}
                      </small>
                    </div>
                    {selectedCategory && (
                      <div className="alert alert-info">This will be a subcategory of <strong>{selectedCategory.category_name}</strong></div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowSubcategoryModal(false); resetForm(); }}>Cancel</button>
                    <button type="submit" className="btn btn-warning">{editingSubcategory ? "Update" : "Add"} Subcategory</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <>
          <div className="modal show fade d-block">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleAddOrUpdateItem}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingItem ? "Edit Item" : "Add Item"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowItemModal(false);
                        resetForm();
                      }}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Printer Select */}
                    <div className="mb-3">
                      <label className="form-label">Printer</label>
                      <select
                        className="form-select"
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                      >
                        <option value="">Use Parent Printer</option>
                        {Array.isArray(printers) &&
                          printers.map((printer) => (
                            <option key={printer.id} value={printer.id}>
                              {printer.name || printer.printer_name}
                            </option>
                          ))}
                      </select>
                      <small className="form-text text-muted">
                        Current Subcategory Printer: {selectedSubcategory ? getPrinterName(selectedSubcategory.printer_id) : "Not set"}<br />
                        Current Category Printer: {selectedCategory ? getPrinterName(selectedCategory.printer_id) : "Not set"}
                      </small>
                    </div>

                    {/* Subcategory Info */}
                    {selectedSubcategory && (
                      <div className="alert alert-info">
                        This will be an item in{" "}
                        <strong>{selectedSubcategory.subcategory_name}</strong>
                      </div>
                    )}

                    {/* Item Types & Prices */}
                    <div className="border rounded p-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>Item Types and Prices</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={handleAddRow}
                        >
                          + Add
                        </button>
                      </div>

                      {itemTypes.map((row, index) => (
                        <div
                          key={index}
                          className="d-flex gap-2 mb-2 align-items-center"
                        >
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Item name"
                            value={row.item_name}
                            onChange={(e) =>
                              handleChangeRow(index, "item_name", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Price ($)"
                            value={row.price}
                            onChange={(e) =>
                              handleChangeRow(index, "price", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleRemoveRow(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowItemModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-warning">
                      {editingItem ? "Update" : "Add"} Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default SAddCategories;