import cookieParser from "cookie-parser";
import { config } from "dotenv";
config();
import express, { json } from "express";
import morgan from "morgan";
import globalErrorhandler from "./controllers/errorController";
import userRouter from "./routes/userRoutes";
import googleAuthRoutes from "./routes/googleAuthRoutes";
import facebookAuthRoutes from "./routes/facebookAuthRoutes";
import configureGoogleAuth from "./utils/configureGoogleAuth";
import configureFacebookAuth from "./utils/configureFacebookAuth";
import passport from "passport";

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

app.use(passport.initialize());

configureGoogleAuth();

configureFacebookAuth();

app.use("/v1/user", userRouter);

app.use("/v1/auth/google", googleAuthRoutes);

app.use("/v1/auth/facebook", facebookAuthRoutes);

app.get("/", (req, res) => {
	res.status(200).json({
		status: "success",
	});
});

app.use(globalErrorhandler);

export default app;
