import "dotenv/config";
import express from "express";
import http from "http";
import compression from "compression";
import cors from "cors";
import { ENV } from "./config/env.ts";
import { clerkMiddleware } from "@clerk/express";
import routes from "./routes/index.ts";
import { swaggerDocs } from "./swagger/swagger.ts";

const app = express();

app.use(cors());

app.use(clerkMiddleware());

app.use(compression());
app.use(express.json());

app.use("/api", routes);

swaggerDocs(app);

const server = http.createServer(app);

server.listen(ENV.PORT, () => {
  console.log(`Server is running on http://localhost:${ENV.PORT}`);
});
