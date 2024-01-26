import Head from "next/head";
import { Message } from "components/Message";
import { ChatSidebar } from "components/ChatSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { streamReader } from "openai-edge-stream";
import {v4 as uuid} from 'uuid';
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default function ChatPage({ chatId, title, messages }) {
  console.log("log the props: ", chatId, title, messages);
  const [incomingMessage, setIncomingMessage ] = useState("");
  const [messageText, setMessageText] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if(!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setNewChatMessages( prev => {
      const newChatMessages = [...prev, {
        _id:uuid(),
        role: "user",
        content: messageText,
      },
    ];
    return newChatMessages;
    })
    setMessageText("");
    // const response = await fetch(`/api/chat/createNewChat`, {
    //   method: "POST",
    //   headers: {
    //     'content-type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     message: messageText,
    //   }),
    // });
    // const json = await response.json();

    //console.log("NEW CHAT:", json);
    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({message: messageText}),
    });

    const data = response.body;
    if(!data) {
      return;
    }

    const reader = data.getReader();
    await streamReader(reader, (message) => {
      console.log("Log message: ", message);
      if(message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage(s => `${s}${message.content}`)
      }
    });
    setGeneratingResponse(false);
  };

  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
    <div className ="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId}/>

        <div className="bg-gray-700 flex flex-col overflow-hidden">
          <div className="flex-1 text-white overflow-scroll">
            {newChatMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}
            {!!incomingMessage && (
              <Message role={"assistant"} content={incomingMessage} />
            )}
            </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={generatingResponse ? "" : "Send a message..."}
                placeholder="Send a message..."
                className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500" />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
          </div>
    </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  if(chatId) {
    const {user} = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("ChatRrg");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: new ObjectId(chatId)
    });

  return {
    props: {
      chatId,
      title: chat.title,
      messages: chat.messages.map(message => ({
        ...message,
        _id: uuid(),
      }))
    }
  }
  }
  return {
   props: {},
  }
}
