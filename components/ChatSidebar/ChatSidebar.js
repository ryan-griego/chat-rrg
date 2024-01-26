import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faMessage, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export const ChatSidebar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);
  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch(`/api/chat/getChatList`, {
        method: "POST",
      });
      const json = await response.json();
      console.log("CHAT LIST: ", json);
      setChatList(json?.chats || []);
    };
    loadChatList();
  }, [chatId]);

  return (
  <div className="bg-gray-900 text-white flex flex-col overflow-hidden">
      <Link href="/chat" className="side-menu-item bg-emerald-500 hover:bg-emerald-600"><FontAwesomeIcon icon={faPlus}/>New chat</Link>
        <div className="flex-1 overflow-auto bg-gray-950">
          {chatList.map(chat => (
            <Link key={chat._id} href={`/chat/${chat._id}`} className={`side-menu-item ${chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""}`}><FontAwesomeIcon icon={faMessage} />{chat.title}</Link>
          ))}
        </div>


      <Link href="/api/auth/logout" className="side-menu-item">
        <FontAwesomeIcon icon={faRightFromBracket} />Logout
    </Link>

  </div>
  );
};
