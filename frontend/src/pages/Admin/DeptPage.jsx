import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaUndo, FaSearch, FaPlus } from "react-icons/fa";
import {
  fetchEntities,
  createEntity,
  deleteEntity,
} from "../../redux/slices/crudSlice";
import {
  DataTable,
  Button,
  ConfirmationModal,
  Modal,
  Loader,
  ToastNotification,
  Dropdown,
  DepartmentForm,
} from "../../components";

const DepartmentPage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const words = useSelector((state) => state.lang.words);

  // State management
  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    errorMessage: "",
    isModalOpen: false,
    isLoading: false,
  });

  const [confirmDelete, setConfirmDelete] = useState({
    ids: [],
    isBulk: false,
    name: "",
  });

  const [filters, setFilters] = useState({
    orgType: "",
    organization: "",
  });

  // Table configuration
  const tableHeader = [
    { key: "index", label: words["#"] || "#" },
    { key: "name", label: words["Department Name"] || "Department Name" },
    { key: "organization", label: words["Organization"] || "Organization" },
    { key: "type", label: words["Type"] || "Type" },
  ];

  // Data fetching with filters
  const fetchDepartments = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const params = {};
      if (filters.orgType) params.orgType = filters.orgType;
      if (filters.organization) params.organization = filters.organization;

      await dispatch(
        fetchEntities({
          entityType: "departments",
          params: {
            ...params,
            populate: "organization",
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch organizations when org type changes
  useEffect(() => {
    if (filters.orgType) {
      dispatch(
        fetchEntities({
          entityType: "organizations",
          params: {
            type: filters.orgType,
            fields: "name _id type",
          },
        })
      );
    } else {
      // Fetch all organizations if no type is selected
      dispatch(
        fetchEntities({
          entityType: "organizations",
          params: {
            fields: "name _id type",
          },
        })
      );
    }
  }, [filters.orgType, dispatch]);

  // Prepare table data
  const tableData = entities.departments?.map((dept, index) => ({
    index: index + 1,
    id: dept._id,
    name: dept.name,
    organization: dept.organization?.name || "N/A",
    type: dept.organization?.type
      ? words[dept.organization.type] || dept.organization.type
      : "N/A",
  }));

  // Filter handlers
  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };

      // Reset dependent filters when parent changes
      if (name === "orgType") {
        newFilters.organization = "";
      }

      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      orgType: "",
      organization: "",
    });
  };

  const handleSearch = () => {
    fetchDepartments();
  };

  // Toast notification helper
  const showToast = (message, type = "success") => {
    setUiState((prev) => ({
      ...prev,
      showToast: true,
      toastMessage: message,
      toastType: type,
    }));
  };

  // Modal handlers
  const openCreateModal = () => {
    setUiState((prev) => ({
      ...prev,
      isModalOpen: true,
      errorMessage: "",
    }));
  };

  const closeModal = () => {
    setUiState((prev) => ({
      ...prev,
      isModalOpen: false,
      errorMessage: "",
    }));
  };

  // Form submission handler
  const handleCreateDepartment = async (formData) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const response = await dispatch(
        createEntity({
          entityType: "departments",
          formData: {
            name: formData.name,
            organization: formData.organization,
          },
        })
      ).unwrap();

      if (response?.success) {
        showToast(response.message || words["Department created successfully"]);
        closeModal();
        await fetchDepartments();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage:
            response.message || words["Failed to create department"],
        }));
      }
    } catch (error) {
      setUiState((prev) => ({
        ...prev,
        errorMessage: error.message || words["Server error"],
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Delete handlers
  const handleDelete = (entity) => {
    setConfirmDelete({
      ids: [entity.id],
      isBulk: false,
      name: entity.name,
    });
  };

  const handleBulkDelete = (selectedIds) => {
    if (selectedIds.length === 0) {
      showToast(words["No departments selected"], "warning");
      return;
    }
    setConfirmDelete({
      ids: selectedIds,
      isBulk: true,
      name: "",
    });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete.ids.length) return;

    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      await Promise.all(
        confirmDelete.ids.map((id) =>
          dispatch(deleteEntity({ entityType: "departments", id }))
        )
      );

      const message = confirmDelete.isBulk
        ? `${words["Deleted"]} ${confirmDelete.ids.length} ${words["departments"]}`
        : words["Deleted Successfully"];

      showToast(message);
      await fetchDepartments();
    } catch (error) {
      showToast(
        confirmDelete.isBulk
          ? words["Bulk delete failed"]
          : words["Delete failed"],
        "error"
      );
    } finally {
      setConfirmDelete({ ids: [], isBulk: false, name: "" });
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filter options
  const orgTypeOptions = [
    { value: "", label: words["All Types"] || "All Types" },
    { value: "GOVERNMENT", label: words["Government"] || "Government" },
    { value: "COMPANY", label: words["Company"] || "Company" },
  ];

  const organizationOptions = [
    { value: "", label: words["All Organizations"] || "All Organizations" },
    ...(entities.organizations
      ?.filter((org) => !filters.orgType || org.type === filters.orgType)
      ?.map((org) => ({
        value: org._id,
        label: org.name,
      })) || []),
  ];

  return (
    <div className="p-4">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.ids.length > 0}
        onClose={() => setConfirmDelete({ ids: [], isBulk: false, name: "" })}
        onConfirm={confirmDeleteAction}
        title={
          confirmDelete.isBulk
            ? words["Confirm Bulk Delete"]
            : words["Confirm Delete"]
        }
        message={
          confirmDelete.isBulk
            ? `${words["Delete"]} ${confirmDelete.ids.length} ${words["selected departments?"]}`
            : `${words["Delete"]} ${confirmDelete.name}?`
        }
      />

      {/* Toast Notification */}
      {uiState.showToast && (
        <ToastNotification
          message={uiState.toastMessage}
          type={uiState.toastType}
          onClose={() => setUiState((prev) => ({ ...prev, showToast: false }))}
        />
      )}

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center gap-2 mb-4">
          <Button
            text={words["Reset Filters"] || "Reset Filters"}
            onClick={resetFilters}
            icon={<FaUndo className="h-3 w-3" />}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            size="small"
          />
          <div className="flex gap-2">
            <Button
              text={words["Search"] || "Search"}
              onClick={handleSearch}
              icon={<FaSearch className="h-3 w-3" />}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="small"
              isLoading={uiState.isLoading}
            />
            <Button
              text={words["Add Department"] || "Add Department"}
              onClick={openCreateModal}
              icon={<FaPlus className="h-3 w-3" />}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="small"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Dropdown
            label={words["Organization Type"] || "Organization Type"}
            options={orgTypeOptions}
            selectedValue={filters.orgType}
            onChange={(value) => handleFilterChange("orgType", value)}
          />

          <Dropdown
            label={words["Organization"] || "Organization"}
            options={organizationOptions}
            selectedValue={filters.organization}
            onChange={(value) => handleFilterChange("organization", value)}
          />
        </div>
      </div>

      {/* Create Department Modal */}
      {uiState.isModalOpen && (
        <Modal
          isOpen={uiState.isModalOpen}
          onClose={closeModal}
          title={words["Add Department"] || "Add Department"}
        >
          <DepartmentForm
            onSubmit={handleCreateDepartment}
            onCancel={closeModal}
            isLoading={uiState.isLoading}
            errorMessage={uiState.errorMessage}
            words={words}
          />
        </Modal>
      )}

      {/* Data Table */}
      {uiState.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size={5} opacity={100} />
        </div>
      ) : (
        <DataTable
          heading={words["Departments"] || "Departments"}
          tableHeader={tableHeader}
          tableData={tableData}
          headerBgColor="bg-slate-200"
          borderColor="border-slate-200"
          bulkActions={[
            {
              text: words["Remove Selected"] || "Remove Selected",
              icon: <FaTrash />,
              className: "bg-red-500 hover:bg-red-600 text-white",
              onClick: handleBulkDelete,
            },
          ]}
          buttons={[
            {
              text: words["Remove"] || "Remove",
              icon: <FaTrash className="text-white" />,
              className: "bg-red-500 hover:bg-red-600 text-white",
              onClick: handleDelete,
            },
          ]}
        />
      )}
    </div>
  );
};

export default DepartmentPage;
