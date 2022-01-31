import React, { useCallback } from "react";
import styled from "styled-components";
import { Message as MessageType } from "../../types";
import Message from '../Message/Message';
import { getRandomColor } from "../../utils/colorGenerator";

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: calc(100vh - 130px);
`;

const Messages = ({
  messages,
  usernameColorMap,
  messageContainer,
}: {
  messages: MessageType[];
  usernameColorMap: Map<string, string>;
  messageContainer: React.RefObject<HTMLDivElement>;
}) => {
  
  const getColorForUser = useCallback((username: string) => {
      let color = usernameColorMap.get(username);
      if (!color) {
        color = getRandomColor();
        usernameColorMap.set(username, color);
      }
      return color;

  }, [usernameColorMap]);

  return (
    <MessagesContainer ref={messageContainer}>
      {messages.map((message, index) => message && (
        <Message message={message} key={index} userColor={getColorForUser(message.username)} />
      ))}
    </MessagesContainer>
  );
};

export default Messages;
