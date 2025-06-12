import { useNavigate } from "react-router-dom";
import React from "react";
import { Button } from "../../components";
import { useSelector } from "react-redux";

const GovSectorManagerHomePage = () => {
  const navigate = useNavigate();
  const { data } = useSelector((state) => state.auth);
   const words = useSelector((state) => state.lang.words);

  const handleNavigation = (path) => {
    navigate(path);
  };
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-4 ">
      {/* Control Panel Box */}
      <div className="bg-gray-300 p-6 rounded-lg shadow-lg  max-w-md md:max-w-lg lg:max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex justify-center  bg-white rounded-full shadow-lg">
            <img
              src={data?.sector?.logo}
              alt="Company Logo"
              className="h-32 w-32 rounded-full"
            />
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-gray-800">
              {data?.sector?.name || "Company"}
            </h4>
            {data?.role && (
              <p className="text-sm text-gray-500 mt-1">
                {words["Government Manager Dashboard"]}
              </p>
            )}
          </div>
        </div>

        <Button
          text={words["Manage Employees"]}
          onClick={() => handleNavigation("/add-gov-employee")}
          className="w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold py-3 shadow"
        />

        <Button
          text={words["Manage Tickets"]}
          onClick={() => handleNavigation("/manage-gov-tickets")}
          className="w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow"
        />
      </div>
    </div>
  );
};

export default GovSectorManagerHomePage;
