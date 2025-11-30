import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import express from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Attendance App API",
      version: "1.0.0",
    },
  },
  apis: ["./src/swagger/*.yaml"], // where your YAML lives
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app: express.Express) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
