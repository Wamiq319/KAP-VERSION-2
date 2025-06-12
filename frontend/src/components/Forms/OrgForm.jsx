import React, { useState } from "react";
import { InputField, ImageInput } from "../../components";

const AddOrgForm = ({
  formData = {},
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
}) => {
  const [logoFile, setLogoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ target: { name, value } });
  };

  const handleLogoChange = (file) => {
    setLogoFile(file);
    onChange({ target: { name: "logo", value: file } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, logo: logoFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label={words["Organization Name"] || "Organization Name"}
          name="name"
          placeholder={
            words["Enter organization name"] || "Enter organization name"
          }
          value={formData.name || ""}
          onChange={handleChange}
          required
        />

        <InputField
          label={words["Admin Name"] || "Admin Name"}
          name="adminName"
          placeholder={words["Enter admin name"] || "Enter admin name"}
          value={formData.adminName || ""}
          onChange={handleChange}
          required
        />

        <InputField
          label={words["Username"] || "Username"}
          name="username"
          placeholder={words["Enter username"] || "Enter username"}
          value={formData.username || ""}
          onChange={handleChange}
          required
        />

        <InputField
          label={words["Mobile Number"] || "Mobile Number"}
          name="mobile"
          placeholder="+9665XXXXXXXX"
          type="tel"
          value={formData.mobile || ""}
          onChange={handleChange}
          required
        />

        <InputField
          label={words["Password"] || "Password"}
          name="password"
          placeholder={words["Set a password"] || "Set a password"}
          type="password"
          value={formData.password || ""}
          onChange={handleChange}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            {words["Organization Type"] || "Organization Type"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="GOVERNMENT"
                checked={formData.type === "GOVERNMENT"}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-green-600"
                required
              />
              <span className="ml-2 text-gray-700">
                {words["Government"] || "Government"}
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="COMPANY"
                checked={formData.type === "COMPANY"}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-gray-700">
                {words["Company"] || "Company"}
              </span>
            </label>
          </div>
        </div>
      </div>

      <ImageInput
        label={words["Organization Logo"] || "Organization Logo"}
        onChange={handleLogoChange}
        className="mt-4"
      />

      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
        >
          {words["Cancel"] || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading
            ? words["Saving..."] || "Saving..."
            : words["Save"] || "Save"}
        </button>
      </div>
    </form>
  );
};

export default AddOrgForm;
