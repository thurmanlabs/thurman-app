import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import http from "http";
import expressWinston from "express-winston";
import winston from "winston";
import authRouter from "./routes/auth"; 
import userRouter from "./routes/user";
import loanPoolsRouter from "./routes/loanPools";
import webhooksRouter from "./routes/webhooks";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const { port, apiPrefix } = config;
const app: Express = express();
const server = http.createServer(app);

// Winston logger configuration
const loggerOptions: expressWinston.LoggerOptions = {
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.prettyPrint()
    ),
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
    ignoreRoute: function (req, res) { return false; }
};

// ===== MIDDLEWARE ORDER =====
// 1. CORS and body parsing middleware FIRST
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request logging middleware
app.use(expressWinston.logger(loggerOptions));

// 3. API routes (with proper apiPrefix)
app.use(`${apiPrefix}/auth`, authRouter);
app.use(`${apiPrefix}/user`, userRouter);
app.use(`${apiPrefix}/loan-pools`, loanPoolsRouter);
app.use(`${apiPrefix}/webhooks`, webhooksRouter);

// 4. 404 handler for unmatched routes
app.use(notFound);

// 5. Error handler middleware LAST
app.use(errorHandler);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
