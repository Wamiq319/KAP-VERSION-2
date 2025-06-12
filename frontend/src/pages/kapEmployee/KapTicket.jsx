import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEntities,
  addEntity,
  fetchNames,
} from "../../redux/slices/adminCrudSlice";
import {
  DataTable,
  Button,
  InputField,
  ToastNotification,
  Modal,
  Loader,
  Dropdown,
  FileInput,
  DatePicker,
} from "../../components";

const ManageKapTicketPage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const user = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const [requestors, setRequestors] = useState([]);
  const [operators, setOperators] = useState([]);
  const locations = ["NCT", "AMSTEL", "PDC"];

  const [formData, setFormData] = useState({
    ticketBuilder: user.name,
    requestType: "",
    location: locations[0],
    operator: "",
    requestor: "",
    expectedCompletionDate: "",
    attachment: null,
  });

  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    errorMessage: "",
    isModalOpen: false,
    isLoading: false,
  });

  const tableHeaders = [
    { key: "index", label: words["#"] },
    { key: "requestType", label: words["Ticket Number"] },
    { key: "ticketNumber", label: words["Request Type"] },
    { key: "location", label: words["Location"] },
    { key: "operator", label: words["Operator"] },
    { key: "requestor", label: words["Requestor"] },
    { key: "orderDate", label: words["Order Creation"] },
    { key: "expectedCompletionDate", label: words["Expected Completion"] },
    { key: "attachment", label: words["Attachment"] },
  ];

  const companyOptions = operators?.map((operator) => ({
    value: operator.id,
    label: operator.companyName,
  }));

  const sectorOptions = requestors?.map((requestor) => ({
    value: requestor.id,
    label: requestor.sectorName,
  }));

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const requestorResponse = await dispatch(
        fetchNames({ endpoint: "gov/sector-names" })
      );
      setRequestors(requestorResponse.payload?.names || []);

      const operatorResponse = await dispatch(
        fetchNames({ endpoint: "op/company-names" })
      );
      setOperators(operatorResponse.payload?.names || []);
      console.log(user);
      await dispatch(
        fetchEntities({
          endpoint: "tkt/tickets",
          params: {
            userRole: "kap_employee",
            userId: user.company?.id ?? null,
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const tableData = entities?.map((item, index) => ({
    index: index + 1,
    id: item._id,
    requestType: item.requestType,
    ticketNumber: item.ticketNumber,
    location: item.location,
    operator: item.operator ?? "N/A",
    requestor: item.requestor ?? "N/A",
    expectedCompletionDate: item.expectedCompletionDate
      ? new Date(item.expectedCompletionDate).toLocaleDateString()
      : "N/A",
    orderDate: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "",
    attachment: item.attachment ? "File Attached" : "No Attachment",
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      attachment: e.target.files?.[0] || null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.requestType ||
      !formData.requestor ||
      !formData.operator ||
      !formData.location
    ) {
      setUiState((prev) => ({
        ...prev,
        errorMessage: "Please complete all required fields",
      }));
      return;
    }

    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      console.log(formData);

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined)
          formDataToSend.append(key, value);
      });

      const response = await dispatch(
        addEntity({ endpoint: "tkt/create", formData: formDataToSend })
      ).unwrap();

      if (response.success) {
        showToast(response.message, "success");
      } else {
        showToast(response.message, "error");
      }
    } catch (error) {
      showToast(error.message || "Failed to create ticket", "error");
    } finally {
      setUiState((prev) => ({
        ...prev,
        isLoading: false,
        isModalOpen: false,
      }));
      resetForm();
      fetchData();
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

  const resetForm = () => {
    setFormData({
      requestType: "",
      ticketNumber: "",
      location: locations[0],
      operator: "",
      requestor: "",
      orderDate: "",
      attachment: null,
    });
    setUiState((prev) => ({ ...prev, errorMessage: "" }));
  };

  const closeModal = () => {
    resetForm();
    setUiState((prev) => ({ ...prev, isModalOpen: false }));
  };

  return (
    <div className="p-4">
      {uiState.showToast && (
        <ToastNotification
          message={uiState.toastMessage}
          type={uiState.toastType}
          onClose={() => setUiState((prev) => ({ ...prev, showToast: false }))}
        />
      )}

      <div className="flex justify-center mb-6">
        <Button
          text={words["Create Ticket"]}
          onClick={() => setUiState((prev) => ({ ...prev, isModalOpen: true }))}
          className="bg-blue-600 hover:bg-blue-700 text-lg font-semibold py-3 shadow"
        />
      </div>

      <Modal
        isOpen={uiState.isModalOpen}
        onClose={closeModal}
        title={words["Create Ticket"]}
      >
        <form
          onSubmit={handleSubmit}
          className="md:grid md:grid-cols-2 flex flex-wrap gap-4 max-h-[35rem] overflow-y-auto"
        >
          <InputField
            label={words["Request Type"]}
            name="requestType"
            placeholder={words["Enter request type"]}
            value={formData.requestType}
            onChange={handleChange}
            required
          />

          <Dropdown
            label={words["Location"]}
            options={locations.map((loc) => ({ value: loc, label: loc }))}
            selectedValue={formData.location}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, location: value }))
            }
          />

          <Dropdown
            label={words["Operator"]}
            options={companyOptions}
            selectedValue={formData.operator}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, operator: value }))
            }
          />

          <Dropdown
            label={words["Requestor"]}
            options={sectorOptions}
            selectedValue={formData.requestor}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, requestor: value }))
            }
          />

          {/* <DatePicker
            label="Expected Completion"
            name="expectedCompletionDate"
            value={formData.expectedCompletionDate}
            onChange={handleChange}
            required
          /> */}

          <FileInput
            required={false}
            label={words["Attachments(optional)"]}
            name="attachment" // Fixed name to match formData
            onChange={handleFileChange} // Fixed to use handleFileChange
          />

          {uiState.errorMessage && (
            <p className="text-red-500 text-sm col-span-2">
              {uiState.errorMessage}
            </p>
          )}

          <div className="col-span-2 flex justify-end gap-2 mt-4">
            <Button
              text={words["Cancel"]}
              onClick={closeModal}
              type="button"
              className="bg-gray-500 hover:bg-gray-700"
            />
            <Button
              text={
                uiState.isLoading ? words["Submitting..."] : words["Submit"]
              }
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={uiState.isLoading}
            />
          </div>
        </form>
      </Modal>

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
        />
      )}
    </div>
  );
};

export default ManageKapTicketPage;
