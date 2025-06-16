import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaSearch, FaPlus } from "react-icons/fa";
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
  AddOrgForm,
  PasswordUpdateForm,
} from "../../components";

const OrganizationPage = ({
  buttonText = "Add Organization",
  buttonClassName = "bg-slate-600 hover:bg-slate-700 text-white ",
  tableHeaderBgColor = "bg-slate-200",
  tableBorderColor = "border-slate-200",
}) => {
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
    activeModal: null,
  });

  const [confirmDelete, setConfirmDelete] = useState({
    ids: [],
    isBulk: false,
    name: "",
  });

  const [selectedOrg, setSelectedOrg] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    adminName: "",
    username: "",
    mobile: "",
    password: "",
    type: "GOVERNMENT",
  });

  // Table configuration
  const tableHeader = [
    { key: "index", label: words["#"] },
    { key: "image", label: words["Logo"] },
    { key: "name", label: words["Name"] },
    { key: "type", label: words["Type"] },
    { key: "adminName", label: words["Admin Name"] },
    { key: "username", label: words["Username"] },
    { key: "mobile", label: words["Mobile No"] },
  ];

  // Data fetching
  const fetchOrganizations = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      await dispatch(fetchEntities({ entityType: "organizations" }));
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const tableData = entities.organizations?.map((item, index) => ({
    index: index + 1,
    id: item._id,
    image: item.logo?.url || item.logoUrl,
    name: item.name,
    type: item.type === "GOVERNMENT" ? words["Government"] : words["Company"],
    adminName: item.adminName || "N/A",
    username: item.username,
    mobile: item.mobile,
    password: item.password,
  }));

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
    setSelectedOrg(null);
    setUiState((prev) => ({
      ...prev,
      isModalOpen: true,
      activeModal: "create",
      errorMessage: "",
    }));
  };

  const openPasswordModal = (org) => {
    console.log("Selected Organization:", org);
    setSelectedOrg(org);
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
    setSelectedOrg(null);
  };

  const handleCreateOrg = async (formData) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const response = await dispatch(
        createEntity({
          entityType: "organizations",
          formData,
        })
      ).unwrap();

      if (response?.success) {
        showToast(words[response.message]);
        closeModal();
        await fetchOrganizations();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage: response.message,
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
      showToast(words["No organizations selected"], "warning");
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
          dispatch(deleteEntity({ entityType: "organizations", id }))
        )
      );

      const message = confirmDelete.isBulk
        ? `${words["Deleted"]} ${confirmDelete.ids.length} ${words["organizations"]}`
        : words["Deleted Successfully"];

      showToast(message);
      await fetchOrganizations();
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

  // Add this new handler for password updates
  const handlePasswordUpdate = async (passwordData) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      // If there's an error in the form data
      if (passwordData.error) {
        setUiState((prev) => ({
          ...prev,
          errorMessage: passwordData.error,
        }));
        return;
      }

      const response = await dispatch(
        updateEntityPassword({
          entityType: "organizations",
          id: selectedOrg.id,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();

      if (response?.success) {
        showToast(response.message || "Password updated successfully");
        closeModal();
        await fetchOrganizations();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage: response?.message || "Failed to update password",
        }));
      }
    } catch (error) {
      console.error("Password update error:", error);
      setUiState((prev) => ({
        ...prev,
        errorMessage: error.message || "Server error occurred",
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

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
            ? `${words["Delete"]} ${confirmDelete.ids.length} ${words["selected organizations?"]}`
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

      <div className="flex justify-center gap-2 mb-4">
        <Button
          text={words[buttonText] || buttonText}
          onClick={openCreateModal}
          icon={<FaPlus className="h-3 w-3" />}
          className={`${buttonClassName}`}
          size="large"
        />
      </div>

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
              oldPassword={selectedOrg?.password}
              onSubmit={handlePasswordUpdate}
              onCancel={closeModal}
              isLoading={uiState.isLoading}
              errorMessage={uiState.errorMessage}
              words={words}
            />
          ) : (
            <AddOrgForm
              onSubmit={handleCreateOrg}
              onCancel={closeModal}
              isLoading={uiState.isLoading}
              errorMessage={uiState.errorMessage}
              words={words}
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
          heading={words["Organizations"]}
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
              onClick: (org) => openPasswordModal(org),
            },
          ]}
        />
      )}
    </div>
  );
};

export default OrganizationPage;
