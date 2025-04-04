import winston from 'winston';
import LokiTransport from "winston-loki";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new LokiTransport({
      host: "http://localhost:3100",
      json: true,
      labels: { app: "winston-logs" },
      format: winston.format.json(),
    }),
  ],
});

export {
    logger
};
