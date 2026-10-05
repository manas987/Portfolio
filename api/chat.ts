import { handleChat } from "../src/server/chat";

export const config = { runtime: "edge" };

export default function handler(request: Request) {
  return handleChat(request);
}
