import React from "react";
import { InputField, Button } from "./../index";

const PasswordUpdateForm = ({
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
}) => {
  const [passwordData, setPasswordData] = React.useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      onSubmit({
        error:
          words["Please complete all fields"] || "Please complete all fields",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      onSubmit({
        error: words["Passwords don't match"] || "Passwords don't match",
      });
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
        label={words["Current Password"] || "Current Password"}
        name="oldPassword"
        type="password"
        placeholder={
          words["Enter current password"] || "Enter current password"
        }
        value={passwordData.oldPassword}
        onChange={handleChange}
        required
      />
      <InputField
        label={words["New Password"] || "New Password"}
        name="newPassword"
        type="password"
        placeholder={
          words["Enter new password (min 8 characters)"] ||
          "Enter new password (min 8 characters)"
        }
        value={passwordData.newPassword}
        onChange={handleChange}
        required
      />
      <InputField
        label={words["Confirm Password"] || "Confirm Password"}
        name="confirmPassword"
        type="password"
        placeholder={words["Confirm new password"] || "Confirm new password"}
        value={passwordData.confirmPassword}
        onChange={handleChange}
        required
      />

      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          text={words["Cancel"] || "Cancel"}
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white"
        />
        <Button
          type="submit"
          text={
            isLoading
              ? words["Updating..."] || "Updating..."
              : words["Update"] || "Update"
          }
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isLoading}
        />
      </div>
    </form>
  );
};

export default PasswordUpdateForm;
