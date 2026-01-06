import "dotenv/config";
import express from "express";
import http from "http";
import compression from "compression";
import cors from "cors";
import { ENV } from "./config/env.ts";
import routes from "./routes/index.ts";
import { swaggerDocs } from "./swagger/swagger.ts";
import { errorMiddleware } from "./core/middleware/error.middleware.ts";
import { optionalAuth } from "./core/middleware/optionalAuth.ts";

const app = express();

app.use(compression());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(optionalAuth);

app.use("/api", routes);

app.use(errorMiddleware);

swaggerDocs(app);

const server = http.createServer(app);

server.listen(ENV.PORT, () => {
  console.log(`Server is running on http://localhost:${ENV.PORT}`);
});
