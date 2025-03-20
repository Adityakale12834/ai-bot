// src/features/theme/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: "light", // Or 'dark' as default
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
  },
});

export const { toggleTheme } = themeSlice.actions;

export default themeSlice.reducer;
