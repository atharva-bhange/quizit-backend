import { Router } from "express";
import {
	login,
	register,
	logout,
	isLoggedIn,
} from "../controllers/authController";

const userRouter = Router();

userRouter.post("/register", register);

userRouter.post("/login", login);

userRouter.post("/logout", logout);

userRouter.get("/login", isLoggedIn);

export default userRouter;
