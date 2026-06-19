import { defineAgent } from "eve";
import { google } from "@ai-sdk/google";

export default defineAgent({
  model: google("gemini-2.0-flash"),
  modelContextWindowTokens: 1048576,
});
