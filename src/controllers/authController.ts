import { compare } from "bcryptjs";
import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import { getConnection } from "typeorm";
import { Auth } from "../entity/Auth";
import { User } from "../entity/User";
import { RoleType } from "../types";
import AppError from "../utils/AppError";
import { createAndSendToken } from "../utils/auth";
import catchAsync from "../utils/catchAsync";

export const register = catchAsync(async (req, res, next) => {
	const { first_name, last_name, email, password } = req.body;

	let user = User.create({ first_name, last_name, email, role: "INDIVIDUAL" });
	const auth = Auth.create({ password });

	// validate user
	const userErrors = await validate(user);
	// validate auth
	const authErrors = await validate(auth);
	if (userErrors.length > 0 || authErrors.length)
		return next(
			new AppError("Validation Error", 400, [...userErrors, ...authErrors])
		);

	const existingUser = await getConnection()
		.getRepository(User)
		.createQueryBuilder("user")
		.where("user.email = :email", { email })
		.getOne();

	if (existingUser) return next(new AppError("Email already exists.", 409));

	user = await user.save();

	auth.user = user;

	await auth.save();
	createAndSendToken(user, 200, res);
});

export const login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password)
		return next(new AppError("Email and password is required.", 400));

	const existingUser = await getConnection()
		.getRepository(User)
		.createQueryBuilder("user")
		.leftJoinAndSelect("user.auth", "auth")
		.where("user.email = :email", { email })
		.getOne();

	if (existingUser && existingUser.auth.password === null)
		return next(new AppError("Email is associated with social login.", 403));

	if (!existingUser || !(await compare(password, existingUser.auth.password)))
		return next(new AppError("Incorrect email or password", 401));

	createAndSendToken(existingUser, 200, res);
});

export const logout = catchAsync(async (_, res) => {
	res.clearCookie("jwt").sendStatus(200);
});

export const isLoggedIn = catchAsync(async (req, res, next) => {
	const token = req.cookies.jwt;
	console.log(token);

	if (!token) return next(new AppError("User not logged in.", 401));

	const parsed = jwt.verify(token, process.env.JWT_SECRET) as { id: number };

	const user = await User.findOne(parsed.id);
	if (!user)
		return next(new AppError("User with this token doesn't exist.", 401));

	res.status(200).json({
		status: "success",
		data: { user },
	});
});

export const protect = (roles?: RoleType[]) =>
	catchAsync(async (req, _, next) => {
		const token = req.cookies.jwt;

		if (!token)
			return next(
				new AppError("You are not logged in. Please login to get access.", 401)
			);

		const parsed = jwt.verify(token, process.env.JWT_SECRET) as { id: number };

		const user = await User.findOne(parsed.id);

		if (!user)
			return next(
				new AppError("User related to this session does not exist", 401)
			);

		if (roles && !roles.includes(user.role as RoleType))
			return next(
				new AppError("You don't have permission to access this resource", 401)
			);

		req.user = user;
		next();
	});
