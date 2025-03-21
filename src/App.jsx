import { useEffect } from "react";
import "./App.css";
import axios from "axios";
import Chatbot from "./components/Chatbot";
import ChatGrid from "./components/chatbot/ChatGrid";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  // useEffect(() => {
  //   fetchData("What is your role in this world");
  // }, []);

  useEffect(() => {
    navigate(`/chat/${uuidv4()}`);
  }, []);
  return (
    <>
      <ChatGrid />
    </>
  );
}

export default App;
