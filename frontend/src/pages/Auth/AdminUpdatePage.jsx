import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateAdmin, updatePassword } from "../../redux/slices/authSlice";
import { Button, InputField } from "../../components";
import { logo } from "../../assets";
import { updateEntityPassword } from "../../redux/slices/crudSlice";

const AdminUpdatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const data = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const [formData, setFormData] = useState({
    username: data?.username || "",
    newPassword: "",
  });
  console.log(data);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      (formData.oldPassword || formData.newPassword) &&
      (!formData.oldPassword || !formData.newPassword)
    ) {
      setError(words["Please fill both password fields"]);
      return;
    }

    try {
      const response = await dispatch(
        updateEntityPassword({
          entityType: "users",
          id: data._id,
          newPassword: formData.newPassword,
        })
      ).unwrap();

      if (response?.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("data");
        window.location.reload();
        navigate("/login");
      } else {
        setError(words["Failed to update profile"]);
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(words["Failed to update profile"]);
    }
  };

  const handleSkip = (e) => {
    e.preventDefault();
    if (data?.role) {
      const roleRoutes = {
        ADMIN: "/admin-home",
        GOV_MANAGER: "/govsector-manager-home",
        OP_MANAGER: "/op_manager-home",
        KAP_EMPLOYEE: "/kap-employee-home",
        OP_EMPLOYEE: "/op-employee-home",
        GOV_EMPLOYEE: "/gov-employee-home",
      };
      navigate(roleRoutes[data.role] || "/login");
    }
  };

  return (
    <div className="flex items-center align-middle h-full justify-center mt-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt={words["Company Logo"]}
            className="h-20 w-20 rounded-full"
          />
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
          {words["Update Information"]}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label={words["Username"]}
            name="username"
            placeholder={words["Enter new username"]}
            value={formData.username}
            onChange={handleChange}
            className="mb-4"
            required
          />

          <InputField
            label={words["Current Password"]}
            name="oldPassword"
            type="password"
            placeholder={words["Enter current password"]}
            value={formData.oldPassword}
            onChange={handleChange}
            className="mb-4"
          />

          <InputField
            label={words["New Password"]}
            name="newPassword"
            type="password"
            placeholder={words["Enter new password"]}
            value={formData.newPassword}
            onChange={handleChange}
            className="mb-4"
          />

          <div className="flex justify-between">
            <Button
              text={words["Skip"]}
              onClick={handleSkip}
              className="w-1/2 bg-gray-500 hover:bg-gray-700 mr-2"
              type="button"
            />
            <Button
              text={words["Update"]}
              type="submit"
              className="w-1/2 bg-green-600 hover:bg-green-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUpdatePage;
