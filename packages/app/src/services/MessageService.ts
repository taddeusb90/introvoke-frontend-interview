import axios from "axios";

export const getAllMessages = () =>
  axios
    .get(`${process.env.REACT_APP_API_ENDPOINT}/messages`)
    .then(({data}) => data)
    .catch((error) => console.error(error));

export const getOneMessage = (id: string) =>
  axios
    .get(`${process.env.REACT_APP_API_ENDPOINT}/messages/${id}`)
    .catch((error) => console.error(error));

export const editMessage = (id: string, data: unknown) =>
  axios
    .patch(`${process.env.REACT_APP_API_ENDPOINT}/messages/${id}`, data)
    .catch((error) => console.error(error));

export const saveMessage = (data: unknown) =>
  axios
    .post(`${process.env.REACT_APP_API_ENDPOINT}/messages`, data)
    .catch((error) => console.error(error));

export const removeMessage = (route: string, id: string) =>
  axios
    .delete(`${process.env.REACT_APP_API_ENDPOINT}/messages/${id}`)
    .catch((error) => console.error(error));
