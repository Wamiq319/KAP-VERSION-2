import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaPlus, FaEye } from "react-icons/fa";
import {
  fetchEntities,
  deleteEntity,
  createEntity,
} from "../../redux/slices/crudSlice";
import {
  DataTable,
  Button,
  ToastNotification,
  Modal,
  Loader,
  ConfirmationModal,
  TicketForm,
} from "../../components";
import { useNavigate } from "react-router-dom";

const TicketPage = ({ mode }) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const user = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);
  const navigate = useNavigate();
  console.log(user);

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

  const tableHeaders = [
    { key: "index", label: words["#"] },
    { key: "ticketNumber", label: words["Ticket Number"] },
    { key: "request", label: words["Request Type"] },
    { key: "operator", label: words["Operator"] },
    { key: "requestor", label: words["Requestor"] },
    { key: "reqDepartment", label: "RequestorDept" },
    { key: "optDepartment", label: "OperatorDept" },
  ];

  switch (mode) {
    case "KAP_EMPLOYEE":
      tableHeaders.push(
        { key: "operator", label: words["Operator"] },
        { key: "requestor", label: words["Requestor"] }
      );
      break;
    case "OP_MANAGER ":
    case "OP_EMPLOYEE":
      tableHeaders.push({ key: "requestor", label: words["Requestor"] });
      break;
    case "GOV MANAGER":
    case "GOV_EMPLOYEE":
      tableHeaders.push({ key: "operator", label: words["Operator"] });

      break;
  }

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      let queryParams = {
        role: mode,
      };

      switch (mode) {
        case "KAP_EMPLOYEE":
          queryParams = {
            ...queryParams,
            userId: user._id,
          };
          break;

        case "OP_MANAGER":
          queryParams = {
            ...queryParams,
            // organizationId: user.organization._id,
            userId: user._id,
            departmentId: user.department._id,
            // operatorId: user.organizationId,
          };
          break;

        case "OP_EMPLOYEE":
          queryParams = {
            ...queryParams,
            organizationId: user.organizationId,
            departmentId: user.departmentId,
            assigneeId: user._id,
            operatorId: user.organizationId,
          };
          break;

        case "GOV_MANAGER":
          queryParams = {
            ...queryParams,
            // organizationId: user.organization._id,
            userId: user._id,
            departmentId: user.department._id,
            // operatorId: user.organizationId,
          };
          break;

        case "GOV_EMPLOYEE":
          queryParams = {
            ...queryParams,
            organizationId: user.organizationId,
            departmentId: user.departmentId,
            assigneeId: user._id,
            requestorId: user.organizationId,
          };
          break;

        default:
          queryParams = {
            ...queryParams,
            organizationId: user.organizationId,
            departmentId: user.departmentId,
          };
      }

      // Fetch tickets
      const ticketResponse = await dispatch(
        fetchEntities({
          entityType: "tickets",
          params: queryParams,
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, mode]);

  const tableData =
    entities?.tickets?.map((item, index) => ({
      index: index + 1,
      id: item._id,
      ticketNumber: item.ticketNumber,
      request: item.request,
      operator: item.operator.orgName ?? "N/A",
      requestor: item.requestor.orgName ?? "N/A",
      reqDepartment: item.requestor.departmentName,
      optDepartment: item.operator.departmentName,
    })) || [];

  const handleSubmit = async (formData) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true, errorMessage: "" }));

      const response = await dispatch(
        createEntity({
          entityType: "tickets",
          formData: formData,
        })
      ).unwrap();

      if (response.success) {
        showToast(words["Ticket created successfully"], "success");
        closeModal();
        await fetchData();
      } else {
        setUiState((prev) => ({
          ...prev,
          errorMessage: response.message || words["Failed to create ticket"],
        }));
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setUiState((prev) => ({
        ...prev,
        errorMessage: error.message || words["Failed to create ticket"],
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const showToast = (message, type) => {
    setUiState((prev) => ({
      ...prev,
      toastMessage: message,
      toastType: type,
      showToast: true,
    }));
  };

  const closeModal = () => {
    setUiState((prev) => ({
      ...prev,
      isModalOpen: false,
      activeModal: null,
      errorMessage: "",
    }));
  };

  const openCreateModal = () => {
    setUiState((prev) => ({
      ...prev,
      isModalOpen: true,
      activeModal: "create",
      errorMessage: "",
    }));
  };

  const handleFollowUp = (ticket) => {
    const roleUrls = {
      KAP_EMPLOYEE: `/manage-kap-tickets/view/${ticket.id}`,
      GOV_EMPLOYEE: `/manage-gov-employee-tickets/view/${ticket.id}`,
      GOV_MANAGER: `/manage-gov-tickets/view/${ticket.id}`,
      OP_MANAGER: `/manage-op-tickets/view/${ticket.id}`,
      OP_EMPLOYEE: `/manage-op-employee-tickets/view/${ticket.id}`,
    };
    navigate(roleUrls[mode] || `/tickets/${ticket.id}`);
  };

  const handleDelete = (ticket) => {
    if (mode !== "KAP_EMPLOYEE") return;
    setConfirmDelete({
      ids: [ticket.id],
      isBulk: false,
      name: ticket.ticketNumber,
    });
  };

  const handleBulkDelete = (selectedIds) => {
    if (mode !== "KAP_EMPLOYEE") return;
    if (selectedIds.length === 0) {
      showToast(words["No tickets selected"], "warning");
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
          dispatch(deleteEntity({ entityType: "tickets", id }))
        )
      );

      const message = confirmDelete.isBulk
        ? `${words["Deleted"]} ${confirmDelete.ids.length} ${words["tickets"]}`
        : words["Deleted Successfully"];

      showToast(message);
      await fetchData();
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

  // Generate buttons based on role
  const getTableButtons = () => {
    const buttons = [
      {
        text: words["Follow Up"],
        icon: <FaEye className="text-white" />,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
        onClick: handleFollowUp,
      },
    ];

    if (mode === "KAP_EMPLOYEE") {
      buttons.push({
        text: words["Remove"],
        icon: <FaTrash className="text-white" />,
        className: "bg-red-500 hover:bg-red-600 text-white",
        onClick: handleDelete,
      });
    }

    return buttons;
  };

  // Generate bulk actions based on role
  const getBulkActions = () => {
    if (mode !== "KAP_EMPLOYEE") return [];
    return [
      {
        text: words["Remove Selected"],
        icon: <FaTrash />,
        className: "bg-red-500 hover:bg-red-600 text-white",
        onClick: handleBulkDelete,
      },
    ];
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
            ? `${words["Delete"]} ${confirmDelete.ids.length} ${words["selected tickets?"]}`
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

      <div className="w-full justify-center align-center">
        {mode === "KAP_EMPLOYEE" && (
          <Button
            text={words["Create Ticket"]}
            onClick={openCreateModal}
            icon={<FaPlus className="h-3 w-3" />}
            className="bg-blue-600 hover:bg-blue-700 text-white p-"
            size="small"
          />
        )}
      </div>

      {/* Create Ticket Modal */}
      {uiState.isModalOpen && (
        <Modal
          isOpen={uiState.isModalOpen}
          onClose={closeModal}
          title={words["Create Ticket"]}
        >
          <TicketForm
            onSubmit={handleSubmit}
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
          <Loader size={8} opacity={90} />
        </div>
      ) : (
        <DataTable
          heading={words["Tickets"]}
          tableHeader={tableHeaders}
          tableData={tableData}
          headerBgColor="bg-gray-200"
          rowHoverEffect={true}
          bulkActions={getBulkActions()}
          buttons={getTableButtons()}
          showProgressBar={true}
        />
      )}
    </div>
  );
};

export default TicketPage;
