import React, { useState } from "react";
import { useSelector } from "react-redux";

const DataTable = ({
  heading,
  tableHeader,
  tableData,
  buttons,
  rowsPerPage = 5,
  headerBgColor = "bg-green-200",
  borderColor = "border-green-200",
  bulkActions = [],
  showProgressBar = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const words = useSelector((state) => state.lang.words);

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = tableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowSelection = (rowId) => {
    setSelectedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRows((prev) =>
      prev.length === paginatedData.length
        ? []
        : paginatedData.map((row) => row.id)
    );
  };

  const renderCellContent = (row, col) => {
    // Handle image display
    if (col.key === "image") {
      if (!row[col.key]) {
        // Return a simple gray background when no image
        return <div className="h-10 w-10 bg-gray-200 rounded-full"></div>;
      }

      return (
        <div className="relative">
          <img
            src={row[col.key]}
            alt="Logo"
            className="h-10 w-10 object-contain rounded-full"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <div
            className="h-10 w-10 bg-gray-200 rounded-full absolute top-0 left-0"
            style={{ display: "none" }}
          ></div>
        </div>
      );
    }

    // Handle completion percentage with progress bar
    if (col.key === "completionPercentage" && showProgressBar) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5 flex-1">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{
                width: `${row[col.key].percentage}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
          <span className="text-xs w-10 text-right">
            {row[col.key].percentage}%
          </span>
        </div>
      );
    }

    // Default case: return the cell value
    return row[col.key];
  };

  return (
    <div
      className={`rounded-lg shadow-lg border ${borderColor} bg-white p-4 w-full`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 truncate">{heading}</h2>
        {bulkActions.length > 0 && (
          <div className="flex gap-2">
            {bulkActions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(selectedRows)}
                className={`${action.className} flex items-center justify-center p-2 rounded-md shadow relative group`}
                title={action.text}
              >
                {action.icon}
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <table className={`w-full border-collapse border ${borderColor}`}>
          <thead className={`${headerBgColor} font-bold text-green-900`}>
            <tr>
              {bulkActions.length > 0 && (
                <th className={`py-3 px-4 text-start border ${borderColor}`}>
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                </th>
              )}
              {tableHeader.map((header, index) => (
                <th
                  key={index}
                  className={`py-3 px-4 text-start border ${borderColor} font-bold whitespace-nowrap`}
                >
                  {header.label}
                </th>
              ))}
              {buttons?.length > 0 && (
                <th className={`py-3 px-4 text-left border ${borderColor}`}>
                  {words["Actions"]}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className={`border ${borderColor} even:bg-gray-50 hover:bg-gray-100`}
                >
                  {bulkActions.length > 0 && (
                    <td className={`py-3 px-4 border ${borderColor}`}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleRowSelection(row.id)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                    </td>
                  )}
                  {tableHeader.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-3 px-4 border ${borderColor}`}
                    >
                      {renderCellContent(row, col)}
                    </td>
                  ))}
                  {buttons?.length > 0 && (
                    <td className={`py-3 px-4 border ${borderColor}`}>
                      <div className="flex gap-2 justify-center">
                        {buttons.map((button, btnIndex) => (
                          <button
                            key={btnIndex}
                            onClick={() => button.onClick(row)}
                            className={`${button.className} p-2 rounded-md hover:opacity-80 relative group`}
                            title={button.text}
                          >
                            {typeof button.icon === "function"
                              ? button.icon(row)
                              : button.icon}
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {button.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    tableHeader.length +
                    (bulkActions.length > 0 ? 1 : 0) +
                    (buttons?.length > 0 ? 1 : 0)
                  }
                  className="py-6 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {tableData.length > 0 && (
        <div className="p-3 bg-white flex flex-col sm:flex-row justify-between items-center border-t ${borderColor} gap-2">
          <div className="text-sm text-gray-600">
            {words["Showing"]} {(currentPage - 1) * rowsPerPage + 1}{" "}
            {words["to"]}{" "}
            {Math.min(currentPage * rowsPerPage, tableData.length)}{" "}
            {words["of"]} {tableData.length} {words["entries"]}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md font-medium mx-1 disabled:opacity-50 hover:bg-gray-200"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md font-medium mx-1 disabled:opacity-50 hover:bg-gray-200"
            >
              ‹
            </button>
            <span className="px-3 py-1 bg-green-600 text-white rounded-md font-medium mx-1">
              {currentPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md font-medium mx-1 disabled:opacity-50 hover:bg-gray-200"
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md font-medium mx-1 disabled:opacity-50 hover:bg-gray-200"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
