import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../app/firebase";

export const fetchData = createAsyncThunk(
  "data/fetchData",
  async (_, thunkAPI) => {
    try {
      const querySnapshot = await getDocs(collection(db, "chats"));
      console.log(
        "Fetched data:",
        querySnapshot.docs.map((doc) => doc.data())
      );
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Firestore fetch error:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const saveData = createAsyncThunk(
  "data/saveData",
  async (message, thunkAPI) => {
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        message, // Save message text
        timestamp: new Date().toISOString(), // Optional timestamp
      });
      return { id: docRef.id, message };
    } catch (error) {
      console.error("Firestore save error:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      .addCase(saveData.pending, (state) => {
        state.status = "saving"; // Add a "saving" status
      })
      .addCase(saveData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.push(action.payload); // Update state with new message
      })
      .addCase(saveData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default dataSlice.reducer;
