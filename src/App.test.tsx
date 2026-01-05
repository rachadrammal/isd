import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import App from "./App";

describe("App component", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(true).toBe(true);
  });
});
