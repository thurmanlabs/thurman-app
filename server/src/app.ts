import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import http from "http";
import createError from "http-errors";
import expressWinston from "express-winston";
import winston from "winston";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";

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

// Error logger configuration
const errorLoggerOptions: expressWinston.ErrorLoggerOptions = {
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.prettyPrint()
    )
};

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(expressWinston.logger(loggerOptions));

app.use(`${apiPrefix}/auth`, authRouter);
app.use(`${apiPrefix}/user`, userRouter);

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

// Error logging middleware
app.use(expressWinston.errorLogger(errorLoggerOptions));

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.json({
        status: err.status || 500,
        message: err.message,
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
