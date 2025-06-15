import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaUndo, FaSearch, FaPlus, FaEye } from "react-icons/fa";
import { fetchEntities, deleteEntity } from "../../redux/slices/crudSlice";
import {
  DataTable,
  Button,
  InputField,
  ToastNotification,
  Modal,
  Loader,
  Dropdown,
  ConfirmationModal,
  TicketForm,
} from "../../components";

const TicketPage = ({ mode }) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const user = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const [requestors, setRequestors] = useState([]);
  const [operators, setOperators] = useState([]);

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

  const [filters, setFilters] = useState({
    operator: "",
    requestor: "",
    status: "",
  });

  // Role-specific configurations
  const roleConfig = {
    KAP_EMPLOYEE: {
      headerBgColor: "bg-gray-200",
      canCreate: true,
      canDelete: true,
      canBulkDelete: true,
      showCreateButton: true,
      tableHeaders: [
        { key: "index", label: words["#"] },
        { key: "ticketNumber", label: words["Ticket Number"] },
        { key: "requestType", label: words["Request Type"] },
        { key: "operator", label: words["Operator"] },
        { key: "requestor", label: words["Requestor"] },
        { key: "startDate", label: words["Start Date"] },
        { key: "status", label: words["Status"] },
        { key: "actions", label: words["Actions"] },
      ],
    },
    GOV_MANAGER: {
      headerBgColor: "bg-green-200",
      canCreate: false,
      canDelete: false,
      canBulkDelete: false,
      showCreateButton: false,
      tableHeaders: [
        { key: "index", label: words["#"] },
        { key: "ticketNumber", label: words["Ticket Number"] },
        { key: "requestType", label: words["Request Type"] },
        { key: "operator", label: words["Operator"] },
        { key: "startDate", label: words["Start Date"] },
        { key: "status", label: words["Status"] },
        { key: "actions", label: words["Actions"] },
      ],
    },
    OP_MANAGER: {
      headerBgColor: "bg-blue-200",
      canCreate: false,
      canDelete: false,
      canBulkDelete: false,
      showCreateButton: false,
      tableHeaders: [
        { key: "index", label: words["#"] },
        { key: "ticketNumber", label: words["Ticket Number"] },
        { key: "requestType", label: words["Request Type"] },
        { key: "requestor", label: words["Requestor"] },
        { key: "startDate", label: words["Start Date"] },
        { key: "status", label: words["Status"] },
        { key: "actions", label: words["Actions"] },
      ],
    },
    GOV_EMPLOYEE: {
      headerBgColor: "bg-green-200",
      canCreate: false,
      canDelete: false,
      canBulkDelete: false,
      showCreateButton: false,
      tableHeaders: [
        { key: "index", label: words["#"] },
        { key: "ticketNumber", label: words["Ticket Number"] },
        { key: "requestType", label: words["Request Type"] },
        { key: "operator", label: words["Operator"] },
        { key: "startDate", label: words["Start Date"] },
        { key: "status", label: words["Status"] },
        { key: "actions", label: words["Actions"] },
      ],
    },
    OP_EMPLOYEE: {
      headerBgColor: "bg-blue-200",
      canCreate: false,
      canDelete: false,
      canBulkDelete: false,
      showCreateButton: false,
      tableHeaders: [
        { key: "index", label: words["#"] },
        { key: "ticketNumber", label: words["Ticket Number"] },
        { key: "requestType", label: words["Request Type"] },
        { key: "requestor", label: words["Requestor"] },
        { key: "startDate", label: words["Start Date"] },
        { key: "status", label: words["Status"] },
        { key: "actions", label: words["Actions"] },
      ],
    },
  };

  const config = roleConfig[mode];

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      // Fetch GOVERNMENT organizations for requestors
      const requestorResponse = await dispatch(
        fetchEntities({
          entityType: "organizations",
          params: {
            type: "GOVERNMENT",
            fields: "name _id",
            minimal: true,
          },
        })
      );
      setRequestors(requestorResponse.payload?.data || []);

      // Fetch COMPANY organizations for operators
      const operatorResponse = await dispatch(
        fetchEntities({
          entityType: "organizations",
          params: {
            type: "COMPANY",
            fields: "name _id",
            minimal: true,
          },
        })
      );
      setOperators(operatorResponse.payload?.data || []);

      // Fetch tickets
      await dispatch(
        fetchEntities({
          entityType: "tickets",
          params: {
            userRole: mode.toLowerCase(),
            userId: user.company?.id ?? null,
            ...filters,
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, filters, mode]);

  const tableData =
    entities?.data?.tickets?.map((item, index) => ({
      index: index + 1,
      id: item._id,
      ticketNumber: item.ticketNumber,
      requestType: item.requestType,
      operator: item.operator?.name ?? "N/A",
      requestor: item.requestor?.name ?? "N/A",
      startDate: item.startDate
        ? new Date(item.startDate).toLocaleDateString()
        : "N/A",
      status: item.status || "Pending",
    })) || [];

  const handleSubmit = async (formData) => {
    // This function is no longer needed as the logic is moved to TicketForm
    console.log("Form submitted with data:", formData);
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
    console.log("Ticket Details:", ticket);
    // TODO: Implement navigation to ticket details page
  };

  const handleDelete = (ticket) => {
    if (!config.canDelete) return;
    setConfirmDelete({
      ids: [ticket.id],
      isBulk: false,
      name: ticket.ticketNumber,
    });
  };

  const handleBulkDelete = (selectedIds) => {
    if (!config.canBulkDelete) return;
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

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      operator: "",
      requestor: "",
      status: "",
    });
  };

  const handleSearch = () => {
    fetchData();
  };

  // Filter options
  const operatorOptions = [
    { value: "", label: words["All Operators"] || "All Operators" },
    ...(entities.organizations
      ?.filter((org) => org.type === "COMPANY")
      .map((org) => ({
        value: org._id,
        label: org.name,
      })) || []),
  ];

  const requestorOptions = [
    { value: "", label: words["All Requestors"] || "All Requestors" },
    ...(entities.organizations
      ?.filter((org) => org.type === "GOVERNMENT")
      .map((org) => ({
        value: org._id,
        label: org.name,
      })) || []),
  ];

  const statusOptions = [
    { value: "", label: words["All Status"] || "All Status" },
    { value: "PENDING", label: words["Pending"] || "Pending" },
    { value: "IN_PROGRESS", label: words["In Progress"] || "In Progress" },
    { value: "COMPLETED", label: words["Completed"] || "Completed" },
    { value: "CANCELLED", label: words["Cancelled"] || "Cancelled" },
  ];

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

    if (config.canDelete) {
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
    if (!config.canBulkDelete) return [];
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
            {config.showCreateButton && (
              <Button
                text={words["Create Ticket"]}
                onClick={openCreateModal}
                icon={<FaPlus className="h-3 w-3" />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="small"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Dropdown
            label={words["Operator"]}
            options={operatorOptions}
            selectedValue={filters.operator}
            onChange={(value) => handleFilterChange("operator", value)}
          />

          <Dropdown
            label={words["Requestor"]}
            options={requestorOptions}
            selectedValue={filters.requestor}
            onChange={(value) => handleFilterChange("requestor", value)}
          />

          <Dropdown
            label={words["Status"]}
            options={statusOptions}
            selectedValue={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
          />
        </div>
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
          tableHeader={config.tableHeaders}
          tableData={tableData}
          headerBgColor={config.headerBgColor}
          rowHoverEffect={true}
          bulkActions={getBulkActions()}
          buttons={getTableButtons()}
        />
      )}
    </div>
  );
};

export default TicketPage;
