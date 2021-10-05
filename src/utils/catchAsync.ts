import { NextFunction, Request, Response } from "express";

type RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<void>;

const catchAsync =
	(func: RequestHandler) =>
	(req: Request, res: Response, next: NextFunction) => {
		func(req, res, next).catch((err) => {
			next(err);
		});
	};

export default catchAsync;
