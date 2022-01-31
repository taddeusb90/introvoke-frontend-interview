import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders learn react link", () => {
  render(<App />);
  const headerElement = screen.getByText(
    /Enter your username.../i
  );
  expect(headerElement).toBeInTheDocument();
});
