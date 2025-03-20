import { useEffect } from "react";
import "./App.css";
import axios from "axios";
import Chatbot from "./components/Chatbot";
import ChatGrid from "./components/chatbot/ChatGrid";

function App() {
  const API_KEY = "AIzaSyAd9II4eaF4nvEpPrTilCJyyWhuFH8w2QU"; // Replace with your key
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const fetchData = async (userMessage) => {
    try {
      const response = await axios.post(
        API_URL,
        {
          contents: [{ parts: [{ text: userMessage }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("AI Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
    }
  };

  // useEffect(() => {
  //   fetchData("What is your role in this world");
  // }, []);
  return (
    <>
      <ChatGrid />
    </>
  );
}

export default App;
