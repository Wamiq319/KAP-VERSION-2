import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaUndo, FaSearch, FaPlus } from "react-icons/fa";
import { MdOutlineLockReset } from "react-icons/md";

import {
  fetchEntities,
  createEntity,
  deleteEntity,
  updateEntityPassword,
} from "../../redux/slices/crudSlice";

import {
  DataTable,
  Button,
  ConfirmationModal,
  Modal,
  Loader,
  ToastNotification,
  UserForm,
  PasswordUpdateForm,
  Dropdown,
} from "../../components";

const UserPage = ({
  buttonText = "Add User",
  buttonClassName = "bg-slate-600 hover:bg-slate-700 text-white ",
  tableHeaderBgColor = "bg-slate-200",
  tableBorderColor = "border-slate-200",
  Mode = "ADMIN", //ADMIN //MANAGER
}) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const words = useSelector((state) => state.lang.words);
  const User = JSON.parse(localStorage.getItem("user"));

  // State management
  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    errorMessage: "",
    isModalOpen: false,
    isLoading: false,
    activeModal: null,
  });

  const [confirmDelete, setConfirmDelete] = useState({
    ids: [],
    isBulk: false,
    name: "",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: "",
    orgType: "",
    organization: "",
    department: "",
  });

  // Table configuration
  const tableHeader = [
    { key: "index", label: words["#"] },
    { key: "name", label: words["Employee Name"] },
    { key: "username", label: words["Username"] },
    { key: "mobile", label: words["Mobile No"] },
    { key: "role", label: words["Role"] },
    { key: "organization", label: words["Organization"] },
    { key: "department", label: words["Department"] },
  ];

  // Data fetching with filters
  const fetchUsers = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      if (Mode === "MANAGER") {
        // Get user from localStorage
        const userStr = localStorage.getItem("user");

        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.department && user.department._id) {
            await dispatch(
              fetchEntities({
                entityType: "users",
                params: { department: user.department._id },
              })
            );
          }
        }
      } else {
        const params = {};
        if (filters.role) params.role = filters.role;
        if (filters.orgType) params.orgType = filters.orgType;
        if (filters.organization) params.organization = filters.organization;
        if (filters.department) params.department = filters.department;
        await dispatch(
          fetchEntities({
            entityType: "users",
            params,
          })
        );
      }
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch organizations when org type changes
  useEffect(() => {
    if (filters.orgType) {
      dispatch(
        fetchEntities({
          entityType: "organizations",
          params: {
            type: filters.orgType,
            fields: "name _id",
          },
        })
      );
    }
  }, [filters.orgType, dispatch]);

  // Fetch departments when organization changes
  useEffect(() => {
    if (filters.organization) {
      dispatch(
        fetchEntities({
          entityType: "departments",
          params: {
            organization: filters.organization,
            minimal: true,
          },
        })
      );
    }
  }, [filters.organization, dispatch]);

  const tableData = entities.users?.map((item, index) => ({
    index: index + 1,
    id: item._id,
    name: item.name,
    mobile: item.mobile,
    username: item.username,
    password: item.password,
    role:
      item.role === "KAP_EMPLOYEE"
        ? "KAP-USER"
        : item.role.includes("MANAGER")
        ? "MANAGER"
        : item.role.includes("EMPLOYEE")
        ? "EMPLOYEE"
        : item.role,
    organization: item.organization?.name || "KAP",
    department: item.department?.name || item.kapRole,
  }));

  // Filter handlers
  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };

      // Reset dependent filters when parent changes
      if (name === "role" && value !== "ORG_EMPLOYEE") {
        newFilters.orgType = "";
        newFilters.organization = "";
        newFilters.department = "";
      } else if (name === "orgType") {
        newFilters.organization = "";
        newFilters.department = "";
      } else if (name === "organization") {
        newFilters.department = "";
      }

      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      role: "",
      orgType: "",
      organization: "",
      department: "",
    });
  };

  const handleSearch = () => {
    fetchUsers();
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
    setSelectedUser(null);
    setUiState((prev) => ({
      ...prev,
      isModalOpen: true,
      activeModal: "create",
      errorMessage: "",
    }));
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setUiState((prev) => ({
      ...prev,
      isModalOpen: true,
      activeModal: "password",
      errorMessage: "",
    }));
  };

  const closeModal = () => {
    setUiState((prev) => ({
      ...prev,
      isModalOpen: false,
      activeModal: null,
      errorMessage: "",
    }));
    setSelectedUser(null);
  };

  // Form handlers
  const handleCreateUser = async (formData) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      // For MANAGER mode, ensure we're not creating KAP employees
      if (Mode === "MANAGER" && formData.role === "KAP_EMPLOYEE") {
        throw new Error(words["Manager cannot create KAP employees"]);
      }

      const response = await dispatch(
        createEntity({
          entityType: "users",
          formData,
        })
      ).unwrap();

      if (response?.success) {
        showToast(response.message || words["Employee created successfully"]);
        closeModal();
        await fetchUsers();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage: response.message || words["Failed to create employee"],
        }));
      }
    } catch (error) {
      setUiState((prev) => ({
        ...prev,
        errorMessage: error.message,
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handlePasswordUpdate = async (formData) => {
    try {
      console.log("Password update form data:", formData); // Debug log
      setUiState((prev) => ({ ...prev, isLoading: true }));
      const response = await dispatch(
        updateEntityPassword({
          entityType: "users",
          id: selectedUser.id,
          newPassword: formData.newPassword,
        })
      ).unwrap();
      console.log("Password update response:", response); // Debug log

      if (response?.success) {
        showToast(response.message || words["Password updated successfully"]);
        closeModal();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage: response.message || words["Failed to update password"],
        }));
      }
      await fetchUsers();
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
      showToast(words["No employees selected"], "warning");
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
          dispatch(deleteEntity({ entityType: "users", id }))
        )
      );

      const message = confirmDelete.isBulk
        ? `${words["Deleted"]} ${confirmDelete.ids.length} ${words["employees"]}`
        : words["Deleted Successfully"];

      showToast(message);
      await fetchUsers();
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
  const roleOptions = [
    { value: "", label: words["All Roles"] },
    { value: "KAP_EMPLOYEE", label: words["KAP Employee"] },
    { value: "GOV_MANAGER", label: words["GOV Manager"] },
    { value: "OP_MANAGER", label: words["COMPANY Manager"] },
    { value: "GOV_EMPLOYEE", label: words["GOV Employee"] },
    { value: "OP_EMPLOYEE", label: words["COMPANY Employee"] },
  ];

  const orgTypeOptions = [
    { value: "", label: words["All Types"] },
    { value: "GOVERNMENT", label: words["Government"] },
    { value: "COMPANY", label: words["Company"] },
  ];

  const organizationOptions = [
    { value: "", label: words["All Organizations"] },
    ...(entities.organizations?.map((org) => ({
      value: org._id,
      label: org.name,
    })) || []),
  ];

  const departmentOptions = [
    { value: "", label: words["All Departments"] },
    ...(entities.departments?.map((dept) => ({
      value: dept._id,
      label: dept.name,
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
            ? `${words["Delete"]} ${confirmDelete.ids.length} ${words["selected employees?"]}`
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

      {Mode === "MANAGER" && (
        <div className="flex justify-center gap-2 mb-4">
          <Button
            text={words[buttonText] || buttonText}
            onClick={openCreateModal}
            icon={<FaPlus className="h-3 w-3" />}
            className={`${buttonClassName}`}
            size="large"
          />
        </div>
      )}

      {Mode === "ADMIN" && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center gap-2 mb-4">
            <Button
              text={words["Reset Filters"]}
              onClick={resetFilters}
              icon={<FaUndo className="h-3 w-3" />}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              size="small"
            />
            <div className="flex gap-2">
              <Button
                text={words["Search"]}
                onClick={handleSearch}
                icon={<FaSearch className="h-3 w-3" />}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="small"
                isLoading={uiState.isLoading}
              />
              <Button
                text={words[buttonText] || buttonText}
                onClick={openCreateModal}
                icon={<FaPlus className="h-3 w-3" />}
                className={`${buttonClassName}`}
                size="small"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Dropdown
              label={words["Role"]}
              options={roleOptions}
              selectedValue={filters.role}
              onChange={(value) => handleFilterChange("role", value)}
            />

            <Dropdown
              label={words["Organization Type"]}
              options={orgTypeOptions}
              selectedValue={filters.orgType}
              onChange={(value) => handleFilterChange("orgType", value)}
              disabled={filters.role !== "ORG_EMPLOYEE"}
            />

            <Dropdown
              label={words["Organization"]}
              options={organizationOptions}
              selectedValue={filters.organization}
              onChange={(value) => handleFilterChange("organization", value)}
              disabled={!filters.orgType}
            />

            <Dropdown
              label={words["Department"]}
              options={departmentOptions}
              selectedValue={filters.department}
              onChange={(value) => handleFilterChange("department", value)}
              disabled={!filters.organization}
            />
          </div>
        </div>
      )}

      {/* Main Modal */}
      {uiState.isModalOpen && (
        <Modal
          isOpen={uiState.isModalOpen}
          onClose={closeModal}
          title={
            uiState.activeModal === "password"
              ? words["Reset Password"]
              : words[buttonText] || buttonText
          }
        >
          {uiState.activeModal === "password" ? (
            <PasswordUpdateForm
              oldPassword={selectedUser.password}
              onSubmit={handlePasswordUpdate}
              onCancel={closeModal}
              isLoading={uiState.isLoading}
              errorMessage={uiState.errorMessage}
              words={words}
            />
          ) : (
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={closeModal}
              isLoading={uiState.isLoading}
              errorMessage={uiState.errorMessage}
              words={words}
              Mode={Mode}
            />
          )}
        </Modal>
      )}

      {/* Data Table */}
      {uiState.isLoading ? (
        <div className="flex border-blue-400 justify-center align-middle">
          <Loader size={5} opacity={100} />
        </div>
      ) : (
        <DataTable
          heading={words["Users"]}
          tableHeader={tableHeader}
          tableData={tableData}
          headerBgColor={tableHeaderBgColor}
          borderColor={tableBorderColor}
          bulkActions={[
            {
              text: words["Remove Selected"],
              icon: <FaTrash />,
              className: "bg-red-500 hover:bg-red-600 text-white",
              onClick: handleBulkDelete,
            },
          ]}
          buttons={[
            {
              text: words["Remove"],
              icon: <FaTrash className="text-white" />,
              className: "bg-red-500 hover:bg-red-600 text-white",
              onClick: handleDelete,
            },
            {
              text: words["Reset Password"],
              icon: <MdOutlineLockReset className="text-white" />,
              className: "bg-blue-500 hover:bg-blue-600 text-white",
              onClick: (user) => openPasswordModal(user),
            },
          ]}
        />
      )}
    </div>
  );
};

export default UserPage;
