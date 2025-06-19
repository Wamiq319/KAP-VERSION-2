import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../redux/slices/authSlice";
import { Button, InputField } from "../../components";
import { logo } from "../../assets";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const words = useSelector((state) => state.lang.words);
  const { success } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError(words["Username cannot be empty"]);
      return;
    }
    if (!formData.password.trim()) {
      setError(words["Password cannot be empty"]);
      return;
    }

    try {
      const response = await dispatch(loginUser(formData));

      if (response.payload && !response.payload.success) {
        setError(response.payload.message || response.payload);
      } else {
        navigate("/admin-update");
      }
    } catch (err) {
      setError(words["Something went wrong. Please try again."]);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 px-4 mt-5">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt={words["Company Logo"]}
            className="h-40 w-40 rounded-full"
          />
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          {words["Login to Your Account"]}
        </h2>

        {error && <p className="text-red-500 text-center my-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label={words["Username"]}
            name="username"
            placeholder={words["Enter your username"]}
            value={formData.username}
            onChange={handleChange}
            className="mb-4"
          />
          <InputField
            label={words["Password"]}
            name="password"
            placeholder={words["Enter your password"]}
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="mb-4"
          />

          <Button
            text={words["Login"]}
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold py-2 rounded-md"
          />
        </form>

        <div className="text-center mt-4">
          <a
            href="/forgot-password"
            className="text-blue-500 hover:underline text-sm"
          >
            {words["Forgot Password?"]}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
