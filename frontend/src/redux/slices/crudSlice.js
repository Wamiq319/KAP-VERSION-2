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
  async (
    { entityType, params = {}, id, isSingleEntity },
    { rejectWithValue }
  ) => {
    try {
      let url;
      if (isSingleEntity && id) {
        // For single entity fetch (like a single ticket)
        url = `${API_URL}/api/${entityType}/${id}`;
      } else {
        // For multiple entities fetch
        const queryString = buildQueryString(params);
        url = `${API_URL}/api/${entityType}${
          queryString ? `?${queryString}` : ""
        }`;
      }

      console.log("Fetching from URL:", url);
      const { data, success, message } = await makeEntityRequest(url, "GET");
      console.log("API Response:", { data, success, message });

      return { entityType, data, success, message, isSingleEntity };
    } catch (error) {
      console.error("Error in fetchEntities:", error);
      return rejectWithValue({
        message: error.message || "Failed to fetch entities",
      });
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
      return rejectWithValue({
        message: error.message || "Failed to create entity",
      });
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
      return rejectWithValue({
        message: error.message || "Failed to update entity",
      });
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
      return rejectWithValue({
        message: error.message || "Failed to delete entity",
      });
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
      return rejectWithValue({
        message: error.message || "Failed to update password",
      });
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
      tickets: [],
    },
    currentTicket: null,
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
        tickets: [],
      };
      state.currentTicket = null;
      state.status = "idle";
      state.error = null;
    },
    clearUsers: (state) => {
      state.entities.users = [];
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEntities.fulfilled, (state, action) => {
        const { entityType, data, isSingleEntity } = action.payload;
        if (!state.entities[entityType]) {
          state.entities[entityType] = [];
        }

        if (isSingleEntity && entityType === "tickets") {
          // Store the single ticket in currentTicket
          state.currentTicket = data;
          // Also update the tickets array if needed
          const existingIndex = state.entities.tickets.findIndex(
            (ticket) => ticket._id === data._id
          );
          if (existingIndex >= 0) {
            state.entities.tickets[existingIndex] = data;
          } else {
            state.entities.tickets.push(data);
          }
        } else {
          // For multiple entities, store as array
          state.entities[entityType] = data || [];
        }

        state.status = "succeeded";
        state.lastAction = "fetch";
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        const { entityType, data, success } = action.payload;

        // Only update state if success is true and data is not null
        if (success && data) {
          if (!state.entities[entityType]) {
            state.entities[entityType] = [];
          }

          // If data is an array (like when backend returns all users), replace the entire array
          if (Array.isArray(data)) {
            state.entities[entityType] = data;
          } else {
            // If data is a single object, add it to the array
            state.entities[entityType].push(data);
          }
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

export const { clearEntities, clearUsers, setCurrentTicket } =
  entityManageSlice.actions;
export default entityManageSlice.reducer;
