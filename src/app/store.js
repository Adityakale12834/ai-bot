// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../features/themeSlice";
import dateReducer from "../features/chats/dataSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    data: dateReducer,
  },
});
