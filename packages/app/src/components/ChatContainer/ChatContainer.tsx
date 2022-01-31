import React, {
  useState,
  useEffect,
  KeyboardEvent,
  useRef,
} from "react";
import SocketService from "../../services/SocketService";
import { MESSAGE_CREATED } from "../../constants/events";
import { getAllMessages, saveMessage } from "../../services/MessageService";
import styled from "styled-components";
import { Message, MessagePayload } from "../../types";
import { getRandomColor } from "../../utils/colorGenerator";
import Messages from "../Messages/Messages";
import UsernameInput from "../Inputs/UsernameInput";
import MessageBoxInput from "../Inputs/MessageBoxInput";

const socket = new SocketService();

const ChatContainer = styled.div`
  margin: 15px;
  border: 1px solid #e0e0e0;
  height: calc(100vh - 36px);
  background-color: #ffffff;
`;

const usernameColorMap = new Map();

const assignColorToUser =(username: string) => {
  if (!usernameColorMap.get(username)) {
    usernameColorMap.set(username, getRandomColor());
  }
};

const Chat = () => {
  const messageContainer = useRef<HTMLDivElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([] as Message[]);
  const [username, setUsername] = useState("");
  const [messagePayload, setMessagePayload] = useState(
    null as MessagePayload | null
  );
  const [messageBoxValue, setMessageBoxValue] = useState("");

  const scrollDown = () => {
    if (messageContainer?.current) {
      messageContainer.current.scrollTop =
        messageContainer?.current?.scrollHeight;
    }
  };

  useEffect(() => {
    getAllMessages().then((data: Message[]) => {
      data.forEach(({ username }) => assignColorToUser(username));
      setMessages(data);
      scrollDown();
    });

    socket.on(MESSAGE_CREATED, (message: Message) => {
      setMessages((m) => [...m, message]);
      scrollDown();
    });

    return () => {
      socket.off(MESSAGE_CREATED);
    };
  }, []);

  useEffect(() => {
    if (messagePayload) {
      saveMessage(messagePayload);
      setMessagePayload(null);
    }
  }, [messagePayload]);

  function handleUsernameKeyupEvent(event: KeyboardEvent<HTMLInputElement>) {
    setUsername(event.currentTarget.value);
  }

  function handleSend() {
    setMessagePayload({
      ...messagePayload,
      message: messageBoxValue,
      username,
    });
  }

  function handleMessageKeyupEvent(event: KeyboardEvent<HTMLInputElement>) {
    if (event.code === "Enter") {
      setMessagePayload({
        ...messagePayload,
        message: event.currentTarget.value,
        username,
      });
      event.currentTarget.value = "";
      setMessageBoxValue("");
    }
    setMessageBoxValue(event.currentTarget.value);
  }

  return (
    <ChatContainer ref={chatContainer}>
      <Messages
        messages={messages}
        messageContainer={messageContainer}
        usernameColorMap={usernameColorMap}
      />
      <UsernameInput handleKeyupEvent={handleUsernameKeyupEvent} />
      <MessageBoxInput
        handleKeyupEvent={handleMessageKeyupEvent}
        handleSend={handleSend}
      />
    </ChatContainer>
  );
};

export default Chat;
