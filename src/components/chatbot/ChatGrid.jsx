import { div } from "framer-motion/client";
import React from "react";
import Chatbot from "../Chatbot";
// import UserList from "../ChatLists";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../../features/chats/dataSlice";
import { v4 as uuidv4 } from "uuid";

function ChatGrid() {
  return (
    <div className="flex">
      {/* Sidebar Toggle Button */}
      <button
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
        type="button"
        className="inline-flex items-center p-3 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden 
               hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 
               dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 transition"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-7 h-7 text-gray-700 dark:text-gray-300"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
          ></path>
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        id="default-sidebar"
        className="fixed top-0 left-0 z-40 w-72 sm:w-80 h-screen bg-gray-900 text-white 
               shadow-lg transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div
          className="h-full px-6 py-10 overflow-y-auto bg-gray-900 dark:bg-gray-800 
                    border-r border-gray-700"
        >
          {/* New Chat Button */}
          <div className="mb-5">
            <button
              type="button"
              className="w-full p-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white 
                     rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 
                     transition duration-300 ease-in-out"
            >
              + New Chat
            </button>
          </div>

          {/* Chat Headings List */}
          <div className="space-y-2">
            {/* {chatHeadings.map((heading, index) => (
              <button
                key={index}
                type="button"
                className="w-full p-3 rounded-lg bg-gray-800 text-gray-200 
                       hover:bg-gray-700 hover:text-white transition duration-200"
              >
                {heading}
              </button>
            ))} */}
            <UserList />
          </div>
        </div>
      </aside>

      {/* Chatbot Section */}
      <div className="sm:ml-80 flex-1 min-h-screen bg-gray-100 border-l border-gray-300">
        <Chatbot id={uuidv4()} />
      </div>
    </div>
  );
}

export default ChatGrid;

const UserList = () => {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.data);
  console.log(items);

  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);

  if (status === "loading") return <p>Loading...</p>;
  if (status === "failed") return <p>Error: {error}</p>;

  return (
    <ul>
      {items.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            className="w-full px-5 py-2 rounded-md bg-amber-700 cursor-pointer my-1"
          >
            {user.message.text}
          </button>
        </li>
      ))}
    </ul>
  );
};
