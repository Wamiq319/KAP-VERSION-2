import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// Get user from localStorage
const storedUser = JSON.parse(localStorage.getItem("user")) || null;

// Helper function to fetch data
const handleApiError = async (response) => {
  const errorResponse = await response.json();
  if (!response.ok) {
    throw new Error(errorResponse.message || "An error occurred");
  }
  return errorResponse;
};

// Login User
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      const { data, message, success } = await handleApiError(response);

      if (success) {
        localStorage.setItem("user", JSON.stringify(data));
      }
      return { success, message, data };
    } catch (error) {
      return rejectWithValue(error.message); // Now correctly passing backend error message
    }
  }
);

// Create User
export const createUser = createAsyncThunk(
  "auth/createUser",
  async ({ data, resource = "user" }, { rejectWithValue }) => {
    try {
      console.log(data);
      const response = await fetch(`${API_URL}/protected/${resource}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const {
        message,
        success,
        data: responseData,
      } = await handleApiError(response);
      return { success, message, data: responseData };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.message || "User creation failed");
    }
  }
);
// Update Admin
export const updateAdmin = createAsyncThunk(
  "auth/updateAdmin",
  async ({ adminId, updatedData }, { rejectWithValue }) => {
    try {
      console.log(adminId, updatedData);

      const response = await fetch(
        `${API_URL}/protected/user/update-admin/${adminId}`,
        {
          method: "Put",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
          credentials: "include",
        }
      );

      const { data, message, success } = await handleApiError(response);
      return { success, message, data };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update admin");
    }
  }
);

// Update Password
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ id, data, resource = "user" }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/protected/${resource}/update-password/${id}`,
        {
          method: "PUT", // Changed from "Put" to "PUT"
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );

      const { message, success } = await handleApiError(response);
      return { success, message };
    } catch (error) {
      return rejectWithValue(error.message || "Password update failed");
    }
  }
);

// Delete User
export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async ({ userId, resource = "user" }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/protected/${resource}/delete/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const { message, success } = await handleApiError(response);

      return { success, message };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.message || "User creation failed");
    }
  }
);
// Logout User
export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("user");
  localStorage.removeItem("data");

  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
});

// Get Users
export const getUsers = createAsyncThunk(
  "auth/getUsers",
  async (params, { rejectWithValue }) => {
    try {
      const {
        queryParams = {}, // Query params for filtering, if any
        endpoint = "",
        resource = "user",
      } = typeof params === "object" ? params : { endpoint: params };
      console.log(params);
      // If there are queryParams, add them to the URL as a query string
      const queryString = new URLSearchParams(queryParams).toString();
      const url = queryString
        ? `${API_URL}/protected/${resource}/${endpoint}?${queryString}`
        : `${API_URL}/protected/${resource}/${endpoint}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const { data, message, success } = await handleApiError(response);
      console.log(message, data);
      return { success, message, data };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    data: storedUser,
    users: [],
    success: false,
    message: "",
  },
  reducers: {
    logout: (state) => {
      state.data = null;
      state.success = false;
      state.message = "";
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.data = action.payload.data;
          state.success = action.payload.success;
          state.message = action.payload.message;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "Login failed";
      })
      // Create User
      .addCase(createUser.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.success = action.payload.success;
          state.message = action.payload.message;
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "User creation failed";
      })

      // Update Admin
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.success = action.payload.success;
        state.message = action.payload.message;
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "Failed to update admin";
      })

      // Update Password
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.success = action.payload.success;
        state.message = action.payload.message;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "Password update failed";
      })

      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.success = action.payload.success;
        state.message = action.payload.message;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "Delete failed";
      })
      //Get Users
      .addCase(getUsers.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.users = action.payload.data; // Add users array to state
          state.success = action.payload.success;
          state.message = action.payload.message;
        }
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.success = false;
        state.message = action.payload || "Failed to fetch users";
      })

      // Handle Logout
      .addCase(logout.fulfilled, (state) => {
        state.data = null;
        state.success = false;
        state.message = "";
      });
  },
});

export const { logout: logoutAction } = authSlice.actions;
export default authSlice.reducer;
