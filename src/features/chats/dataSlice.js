import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { db } from "../../app/firebase";

// ✅ Fetch all data
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

// ✅ Fetch a specific document by ID
export const getDataById = createAsyncThunk(
  "data/getDataById",
  async (id, thunkAPI) => {
    try {
      // console.log(id.id);
      const docRef = doc(db, "chats", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log(...docSnap.data());
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw false;
      }
    } catch (error) {
      console.error("Firestore fetch by ID error:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ✅ Add a new document
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

export const handleChatMessage = createAsyncThunk(
  "data/handleChatMessage",
  async ({ chatId, message }, thunkAPI) => {
    try {
      const docRef = doc(db, "chats", chatId.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Document exists → Append message
        await updateDoc(docRef, {
          messages: arrayUnion({
            text: message,
            timestamp: new Date().toISOString(),
          }),
        });
        return { chatId, newMessage: message };
      } else {
        // Document does NOT exist → Create new document
        await setDoc(docRef, {
          messages: [
            {
              text: message,
              timestamp: new Date().toISOString(),
            },
          ],
        });
        return { chatId, newMessage: message, isNew: true };
      }
    } catch (error) {
      console.error("Firestore error:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState: { items: [], status: "idle", error: null, selectedItem: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ✅ Fetch All Data Cases
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

      // ✅ Fetch Data by ID Cases
      .addCase(getDataById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getDataById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedItem = action.payload; // Store specific item
      })
      .addCase(getDataById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // ✅ Save Data Cases
      .addCase(saveData.pending, (state) => {
        state.status = "saving";
      })
      .addCase(saveData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(saveData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(handleChatMessage.fulfilled, (state, action) => {
        const chat = state.items.find(
          (chat) => chat.id === action.payload.chatId
        );
        if (chat) {
          // Append message
          chat.messages.push({
            text: action.payload.newMessage,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Add new chat entry
          state.items.push({
            id: action.payload.chatId,
            messages: [
              {
                text: action.payload.newMessage,
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      });
  },
});

export default dataSlice.reducer;
