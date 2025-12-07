import serverless from "serverless-http";
import app from "../app.js";  // <-- your main Express app

export const handler = serverless(app);
