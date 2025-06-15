import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

import langReducer from "./slices/langgSlice";

import crudReducer from "./slices/crudSlice";
import languageReducer from "./slices/languageSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    lang: langReducer,

    crud: crudReducer,
    language: languageReducer,
  },
});

export default store;
