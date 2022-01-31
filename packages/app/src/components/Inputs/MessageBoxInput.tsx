import React, {useRef} from "react";
import SendIcon from "@mui/icons-material/Send";
import styled from "styled-components";

const MessageBoxInputContainer = styled.div`
  position: relative;
  border-top: 1px solid #e0e0e0;
  display: flex;
  > input {
    height: 35px;
    padding: 5px;
    border: none;
    flex-grow: 1;
  }
  > button {
    position: absolute;
    top: 0;
    right: 0;
    height: 48px;
    border: none;
    background: none;
  }
`;

const MessageBoxInput = ({
  handleKeyupEvent,
  handleSend,
}: {
  handleKeyupEvent: React.KeyboardEventHandler<HTMLInputElement>;
  handleSend: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  const messageInput = useRef(null as HTMLInputElement | null);

    return (
  <MessageBoxInputContainer>
    <input
      ref={messageInput}
      placeholder="Type your message"
      onKeyUp={handleKeyupEvent}
    />
    <button onClick={(e) => {
        handleSend(e);
        if (messageInput?.current) messageInput.current.value = '';
        }}>
      <SendIcon color="info" />
    </button>
  </MessageBoxInputContainer>
)
};

export default MessageBoxInput;
