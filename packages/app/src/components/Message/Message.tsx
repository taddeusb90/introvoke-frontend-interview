import React from "react";
import styled from "styled-components";
import { Message as MessageType } from "../../types";
import { formatFromNow } from "../../utils/timeFormatter";

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: left;
  align-items: baseline;
  margin-bottom: 10px;
  .username {
    font-weight: bold;
    display: inline;
    margin: 5px 10px;
  }
  .time {
    display: inline;
    font-size: 13px;
  }
  .message-body {
    margin: 5px 10px;
    justify-content: left;
  }
`;

const Message = ({
  message,
  userColor,
}: {
  message: MessageType;
  userColor: string;
}) => {
  return (
    <MessageContainer>
      <div>
        <div className="username" style={{ color: userColor }}>
          {message?.username}
        </div>
        <div className="time">{formatFromNow(message?.createdTime)}</div>
      </div>
      <div className="message-body">{message?.message}</div>
    </MessageContainer>
  );
};

export default Message;
