import React from "react";
import styled from "styled-components";

const UsernameContainer = styled.div`
  border-top: 1px solid #e0e0e0;
  display: flex;
  > input {
    width: 100%;
    height: 35px;
    padding: 5px;
    border: none;
    flex-grow: 1;
  }
`;

const UsernameInput = ({
  handleKeyupEvent,
}: {
  handleKeyupEvent: React.KeyboardEventHandler<HTMLInputElement>;
}) => (
  <UsernameContainer>
    <input onKeyUp={handleKeyupEvent} placeholder="Enter your username..." />
  </UsernameContainer>
);

export default UsernameInput;
