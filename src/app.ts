import cookieParser from "cookie-parser";
import { config } from "dotenv";
config();
import express, { json } from "express";
import morgan from "morgan";
import globalErrorhandler from "./controllers/errorController";
import userRouter from "./routes/userRoutes";

const app = express();

const { LATENCY = "0" } = process.env;

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(json());
app.use((_, __, next) => {
	setTimeout(() => {
		next();
	}, parseInt(LATENCY));
});

app.use(cookieParser());

app.use("/v1/user", userRouter);

app.get("/", (req, res) => {
	res.status(200).json({
		status: "success",
	});
});

app.use(globalErrorhandler);

export default app;
