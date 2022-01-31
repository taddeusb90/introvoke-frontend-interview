export type Message = {
  id: string;
  createdTime: number;
  updatedTime: number;
  message: string;
  username: string;
};

export type MessagePayload = {
  message: string;
  username: string;
};
