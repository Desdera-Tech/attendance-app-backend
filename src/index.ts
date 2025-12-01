import "dotenv/config";
import express from "express";
import http from "http";
import compression from "compression";
import cors from "cors";
import { ENV } from "./config/env.ts";
import routes from "./routes/index.ts";
import { swaggerDocs } from "./swagger/swagger.ts";
import authMiddleware from "./middleware/auth.middleware.ts";

const app = express();

app.use(compression());

app.use(cors());
app.use(express.json());

app.use(authMiddleware);

app.use("/api", routes);

swaggerDocs(app);

const server = http.createServer(app);

server.listen(ENV.PORT, () => {
  console.log(`Server is running on http://localhost:${ENV.PORT}`);
});
