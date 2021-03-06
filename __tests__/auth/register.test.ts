import faker from "faker";
import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { Auth } from "../../src/entity/Auth";

const request = supertest(app);

describe("POST /v1/user/register", () => {
	describe("given valid values", () => {
		const input = {
			first_name: faker.name.firstName(),
			last_name: faker.name.lastName(),
			email: faker.internet.email(),
			password: faker.internet.password(10),
		};

		test("should return status 200", async () => {
			const res = await request.post("/v1/user/register").send(input);
			expect(res.statusCode).toBe(200);
		});

		test("should return content type application/json", async () => {
			const res = await request.post("/v1/user/register").send(input);
			expect(res.headers["content-type"]).toEqual(
				expect.stringContaining("json")
			);
		});

		test("should return user data", async () => {
			const res = await request.post("/v1/user/register").send(input);
			expect(res.body.data.user).toBeDefined();
		});

		test("should set cookie", async () => {
			const res = await request.post("/v1/user/register").send(input);
			expect(res.headers["set-cookie"][0]).toEqual(
				expect.stringContaining("jwt")
			);
		});

		test("should store user and auth in database", async () => {
			const res = await request.post("/v1/user/register").send(input);
			const userId = res.body.data.user.id;

			const user = await User.findOne(userId);

			expect(user).toBeDefined();

			const auth = await Auth.findOne({ where: { user } });

			expect(auth).toBeDefined();
		});
	});

	describe("given invalid values", () => {
		const input = {
			first_name: faker.name.firstName(),
			last_name: faker.name.lastName(),
			email: faker.internet.email(),
			password: faker.internet.password(10),
		};

		test("should return status 400 with no first_name", async () => {
			const res = await request
				.post("/v1/user/register")
				.send({ ...input, first_name: undefined });
			expect(res.statusCode).toBe(400);
		});

		test("should return status 400 with no last_name", async () => {
			const res = await request
				.post("/v1/user/register")
				.send({ ...input, last_name: undefined });
			expect(res.statusCode).toBe(400);
		});

		test("should return status 400 with no email_name", async () => {
			const res = await request
				.post("/v1/user/register")
				.send({ ...input, email: undefined });
			expect(res.statusCode).toBe(400);
		});

		test("should return status 400 with no password_name", async () => {
			const res = await request
				.post("/v1/user/register")
				.send({ ...input, password: undefined });

			expect(res.statusCode).toBe(400);
		});

		test("should return status 409 with repeated email", async () => {
			const firstRes = await request.post("/v1/user/register").send(input);

			expect(firstRes.statusCode).toBe(200);

			const secondRes = await request.post("/v1/user/register").send(input);

			expect(secondRes.statusCode).toBe(409);
		});
	});
});
