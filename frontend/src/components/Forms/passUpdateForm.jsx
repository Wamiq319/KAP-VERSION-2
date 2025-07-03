import React from "react";
import { InputField, Button } from "./../index";

const PasswordUpdateForm = ({
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
  oldPassword,
}) => {
  const [passwordData, setPasswordData] = React.useState({
    oldPassword: oldPassword || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let errors = {};
    const requiredFields = ["oldPassword", "newPassword", "confirmPassword"];

    requiredFields.forEach((field) => {
      if (!passwordData[field]) {
        errors[field] = words["This field is required"];
      }
    });

    if (
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      errors.confirmPassword = words["Passwords don't match"];
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      errors.newPassword = words["Password must be at least 8 characters"];
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <InputField
        label={words["Current Password"]}
        name="oldPassword"
        type="password"
        placeholder={words["Enter current password"]}
        value={passwordData.oldPassword}
        onChange={handleChange}
        required
        error={formErrors.oldPassword}
      />
      <InputField
        label={words["New Password"]}
        name="newPassword"
        type="password"
        placeholder={words["Enter new password (min 8 characters)"]}
        value={passwordData.newPassword}
        onChange={handleChange}
        required
        error={formErrors.newPassword}
      />
      <InputField
        label={words["Confirm Password"]}
        name="confirmPassword"
        type="password"
        placeholder={words["Confirm new password"]}
        value={passwordData.confirmPassword}
        onChange={handleChange}
        required
        error={formErrors.confirmPassword}
      />

      {(errorMessage || Object.keys(formErrors).length > 0) && (
        <p className="text-red-500 text-sm">
          {errorMessage || Object.values(formErrors).find((e) => e) || ""}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          text={words["Cancel"]}
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white"
        />
        <Button
          type="submit"
          text={isLoading ? words["Updating..."] : words["Update"]}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isLoading}
        />
      </div>
    </form>
  );
};

export default PasswordUpdateForm;
