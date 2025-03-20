import { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "./Navbar";
import { useSelector, useDispatch } from "react-redux";
import { saveData } from "../features/chats/dataSlice";

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
    { sender: "bot", text: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const theme = useSelector((state) => state.theme.theme);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const API_KEY = "AIzaSyAd9II4eaF4nvEpPrTilCJyyWhuFH8w2QU"; // Replace with your actual API key
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    dispatch(saveData(userMessage));
    setMessages((prev) => [...prev, userMessage]);
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
        { sender: "bot", text: formatChatGPTResponse(botResponse) },
      ]);
      dispatch(
        saveData({ sender: "bot", text: formatChatGPTResponse(botResponse) })
      );
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Oops! Something went wrong." },
      ]);
    }
  };

  function formatChatGPTResponse(rawText) {
    const escapeHtml = (str) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "");

    rawText = escapeHtml(rawText);

    // Format code blocks
    rawText = rawText.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-gray-900 text-white p-4 rounded-md overflow-x-auto"><code class="whitespace-pre">$1</code></pre>'
    );

    // Inline code
    rawText = rawText.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-200 text-gray-800 px-1 py-0.5 rounded">$1</code>'
    );

    // Bold
    rawText = rawText.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );

    // Italic
    rawText = rawText.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Headings
    rawText = rawText.replace(/(#{1,6})\s*(.*)/g, (match, hashes, content) => {
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
    });

    // Unordered list
    rawText = rawText.replace(
      /(?:\n|^)([-*])\s+(.+)/g,
      '<li class="ml-6 list-disc">$2</li>'
    );
    rawText = rawText.replace(
      /(<li class="ml-6 list-disc">[\s\S]*?<\/li>)/g,
      '<ul class="list-outside pl-4 space-y-1">$1</ul>'
    );

    // Ordered list
    rawText = rawText.replace(
      /(?:\n|^)(\d+\.)\s+(.+)/g,
      '<li class="ml-6 list-decimal">$2</li>'
    );
    rawText = rawText.replace(
      /(<li class="ml-6 list-decimal">[\s\S]*?<\/li>)/g,
      '<ol class="list-outside pl-4 space-y-1">$1</ol>'
    );

    // Paragraphs
    rawText = rawText.replace(/\n{2,}/g, '</p><p class="mb-2">');
    rawText = `<p class="mb-2">${rawText}</p>`;

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

  return (
    <div className={`flex flex-col h-screen shadow-lg`}>
      <div className={`flex items-center`}>
        <Navbar />
      </div>
      <div className="bg-slate-900 flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isLatestBotMessage =
            msg.sender === "bot" && index === messages.length - 1;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex text-white ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg text-black ${
                  msg.sender === "user" ? "bg-fuchsia-900" : "bg-gray-200"
                }`}
              >
                {msg.sender === "bot" && isLatestBotMessage ? (
                  <TypewriterText text={msg.text} speed={20} />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-2 flex items-center bg-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 h-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900 bg-slate-700 text-white px-3"
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
