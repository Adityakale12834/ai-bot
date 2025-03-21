import { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "./Navbar";
import { useSelector, useDispatch } from "react-redux";
import {
  getDataById,
  handleChatMessage,
  saveData,
} from "../features/chats/dataSlice";
import { useParams } from "react-router-dom";

const TypewriterText = ({ text, speed = 1000 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText(""); // Reset when new message arrives
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text[indexRef.current]);
        indexRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span dangerouslySetInnerHTML={{ __html: displayedText }} />;
};

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: { sender: "bot", text: "Hello! How can I assist you today?" } },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const theme = useSelector((state) => state.theme.theme);
  const dataItems = useSelector((state) => state.selectedItem);
  // const { items, status, error } = useSelector((state) => state.data);

  // console.log("This is getDtata", dataItems);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const dispatch = useDispatch();
  const chatId = useParams();
  const [data, setData] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const API_KEY = "AIzaSyAd9II4eaF4nvEpPrTilCJyyWhuFH8w2QU"; // Replace with your actual API key
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: { sender: "user", text: input } };
    setMessages((prev) => [...prev, userMessage]);
    console.log(userMessage);
    dispatch(
      handleChatMessage({ chatId, message: { sender: "user", text: input } })
    );
    setInput("");

    try {
      const response = await axios.post(
        API_URL,
        { contents: [{ parts: [{ text: input }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const botResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process that.";
      setMessages((prev) => [
        ...prev,
        { text: { sender: "bot", text: formatChatGPTResponse(botResponse) } },
      ]);
      const msg = { sender: "bot", text: formatChatGPTResponse(botResponse) };
      dispatch(handleChatMessage({ chatId, message: msg }));
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
      setMessages((prev) => [
        ...prev,
        { text: { sender: "bot", text: "Oops! Something went wrong." } },
      ]);
    }
  };

  function formatChatGPTResponse(rawText) {
    if (!rawText) return ""; // Prevent undefined output

    const escapeHtml = (str) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    rawText = escapeHtml(rawText);

    // Format code blocks
    rawText = rawText.replace(
      /```([\s\S]*?)```/g,
      `<pre class="bg-gray-900 text-white p-4 rounded-md overflow-x-auto">
        <code class="whitespace-pre">$1</code>
      </pre>`
    );

    // Inline code
    rawText = rawText.replace(
      /`([^`]+)`/g,
      `<code class="bg-gray-200 text-gray-800 px-1 py-0.5 rounded">$1</code>`
    );

    // Bold
    rawText = rawText.replace(
      /\*\*(.*?)\*\*/g,
      `<strong class="font-bold">$1</strong>`
    );

    // Italic
    rawText = rawText.replace(/\*(.*?)\*/g, `<em class="italic">$1</em>`);

    // Headings (H1-H6)
    rawText = rawText.replace(
      /^(#{1,6})\s*(.+)$/gm,
      (match, hashes, content) => {
        const level = hashes.length;
        const sizes = [
          "text-4xl",
          "text-3xl",
          "text-2xl",
          "text-xl",
          "text-lg",
          "text-base",
        ];
        return `<h${level} class="${
          sizes[level - 1]
        } font-bold my-2">${content}</h${level}>`;
      }
    );

    // Unordered list
    rawText = rawText.replace(
      /(?:^|\n)([-*])\s+(.+)/g,
      `<li class="ml-6 list-disc">$2</li>`
    );
    rawText = rawText.replace(
      /(<li class="ml-6 list-disc">[\s\S]*?<\/li>)/g,
      `<ul class="list-outside pl-4 space-y-1">$1</ul>`
    );

    // Ordered list
    rawText = rawText.replace(
      /(?:^|\n)(\d+\.)\s+(.+)/g,
      `<li class="ml-6 list-decimal">$2</li>`
    );
    rawText = rawText.replace(
      /(<li class="ml-6 list-decimal">[\s\S]*?<\/li>)/g,
      `<ol class="list-outside pl-4 space-y-1">$1</ol>`
    );

    // Paragraphs (Ensure proper wrapping)
    rawText = rawText
      .split(/\n{2,}/) // Split by multiple newlines
      .map((para) => `<p class="mb-2">${para.trim()}</p>`)
      .join("\n");

    return rawText;
  }

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    setMessages([]); // Clear previous messages before fetching new data
    handleFetchData(chatId.id);
  }, [dispatch, chatId.id]);
  // console.log(data);

  const handleFetchData = async (docId) => {
    try {
      const data = await dispatch(getDataById(docId)).unwrap();
      console.log("Fetched data:", data);
      if (data === false) {
        console.log("No data found");
      } else {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching data:", error); // ✅ Will log "Document not found" if missing
    }
  };

  return (
    <div className={`flex flex-col h-screen shadow-lg`}>
      <div className={`flex items-center`}>
        <Navbar />
      </div>
      <div
        className={` flex-1 p-4 overflow-y-auto space-y-4 ${
          theme === "dark" ? "bg-slate-900" : "bg-gray-100"
        }`}
      >
        {messages.map((msg, index) => {
          const isLatestBotMessage =
            msg.text.sender === "bot" && index === messages.length - 1;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex text-white ${
                msg.text.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg text-black ${
                  theme === "light"
                    ? msg.text.sender === "user"
                      ? "bg-fuchsia-700 text-white"
                      : "bg-gray-400"
                    : msg.text.sender === "bot"
                    ? "bg-fuchsia-700 text-white"
                    : "bg-gray-400"
                }`}
              >
                {msg.text.sender === "bot" && isLatestBotMessage ? (
                  <TypewriterText text={msg.text.text} speed={20} />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: msg.text.text }} />
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-2 flex items-center bg-gray-700 border-gray-50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 h-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900  px-3"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={startListening}
          className="ml-2 p-2 rounded-lg text-white"
        >
          {isListening ? (
            <MicOff size={24} className="text-red-500" />
          ) : (
            <Mic size={24} />
          )}
        </button>
        <button
          onClick={sendMessage}
          className="ml-2 p-2 bg-slate-900 text-white rounded-lg"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
