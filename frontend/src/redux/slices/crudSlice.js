import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Helper functions
const handleApiResponse = async (response) => {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "An error occurred");
  }
  return result;
};

const buildQueryString = (params) => {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");
};

const makeEntityRequest = async (url, method, data = null) => {
  const config = {
    method,
    credentials: "include",
  };

  if (data) {
    if (data instanceof FormData) {
      // For file uploads (like organization creation with image)
      config.body = data;
    } else {
      // For JSON data
      config.headers = { "Content-Type": "application/json" };
      config.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, config);
  return handleApiResponse(response);
};

// Generic CRUD Thunks
export const fetchEntities = createAsyncThunk(
  "entityManage/fetchEntities",
  async ({ entityType, params = {} }, { rejectWithValue }) => {
    try {
      const queryString = buildQueryString(params);
      const url = `${API_URL}/api/${entityType}${
        queryString ? `?${queryString}` : ""
      }`;
      const { data, success, message } = await makeEntityRequest(url, "GET");
      return { entityType, data, success, message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createEntity = createAsyncThunk(
  "entityManage/createEntity",
  async ({ entityType, formData }, { rejectWithValue }) => {
    try {
      const url = `${API_URL}/api/${entityType}`;
      const { data, success, message } = await makeEntityRequest(
        url,
        "POST",
        formData
      );
      return { entityType, data, success, message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateEntity = createAsyncThunk(
  "entityManage/updateEntity",
  async ({ entityType, id, formData }, { rejectWithValue }) => {
    try {
      const url = `${API_URL}/api/${entityType}/${id}`;
      const { data, success, message } = await makeEntityRequest(
        url,
        "PATCH",
        formData
      );
      return { entityType, id, data, success, message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEntity = createAsyncThunk(
  "entityManage/deleteEntity",
  async ({ entityType, id }, { rejectWithValue }) => {
    try {
      const url = `${API_URL}/api/${entityType}/${id}`;
      const { data, success, message } = await makeEntityRequest(url, "DELETE");
      return { entityType, id, data, success, message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateEntityPassword = createAsyncThunk(
  "crud/updateEntityPassword",
  async ({ entityType, id, newPassword }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/api/${entityType}/${id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword }),
          credentials: "include",
        }
      );
      const { data, message, success } = await handleApiResponse(response);
      return { data, message, success };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update password");
    }
  }
);

// Slice
const entityManageSlice = createSlice({
  name: "entityManage",
  initialState: {
    entities: {
      users: [],
      organizations: [],
      departments: [],
    },
    status: "idle",
    error: null,
    lastAction: null,
  },
  reducers: {
    clearEntities: (state) => {
      state.entities = {
        users: [],
        organizations: [],
        departments: [],
      };
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // First, add all your specific cases
      .addCase(fetchEntities.fulfilled, (state, action) => {
        const { entityType, data } = action.payload;
        state.entities[entityType] = data || [];
        state.status = "succeeded";
        state.lastAction = "fetch";
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        const { entityType, data } = action.payload;
        if (data) {
          state.entities[entityType].push(data);
        }
        state.status = "succeeded";
        state.lastAction = "create";
      })
      .addCase(updateEntity.fulfilled, (state, action) => {
        const { entityType, id, data } = action.payload;
        if (data) {
          state.entities[entityType] = state.entities[entityType].map(
            (entity) => (entity.id === id ? { ...entity, ...data } : entity)
          );
        }
        state.status = "succeeded";
        state.lastAction = "update";
      })
      .addCase(deleteEntity.fulfilled, (state, action) => {
        const { entityType, id } = action.payload;
        state.entities[entityType] = state.entities[entityType].filter(
          (entity) => entity.id !== id
        );
        state.status = "succeeded";
        state.lastAction = "delete";
      })
      .addCase(updateEntityPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.lastAction = "updatePassword";
      })

      // Then, add your matchers
      .addMatcher(
        (action) =>
          action.type.startsWith("entityManage/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("entityManage/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        }
      );
  },
});

export const { clearEntities } = entityManageSlice.actions;
export default entityManageSlice.reducer;
