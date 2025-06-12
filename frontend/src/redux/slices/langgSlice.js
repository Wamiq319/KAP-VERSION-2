import { createSlice } from "@reduxjs/toolkit";
import { ar } from "../../lang/ar";
import { eng } from "../../lang/eng";

// Initial state with default language as English
const initialState = {
  lang: "en", // Changed from eng to "en" for consistency
  words: eng,
};

// Create a slice for managing language
const langSlice = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.lang = action.payload;

      // Change the language words based on the selected language
      if (action.payload === "en") {
        // Changed from "eng" to "en" changes
        state.words = eng;
      } else if (action.payload === "ar") {
        state.words = ar;
      }
    },
  },
});

// Export the action and the reducer
export const { setLanguage } = langSlice.actions;
export default langSlice.reducer;
