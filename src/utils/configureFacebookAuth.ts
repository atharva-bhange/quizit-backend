import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { getConnection } from "typeorm";
import { Auth } from "../entity/Auth";
import { User } from "../entity/User";

const { PORT = 4000 } = process.env;

let callbackUrl = "/v1/auth/facebook/callback";

if (process.env.NODE_ENV === "development")
	callbackUrl = `http://localhost:${PORT}${callbackUrl}`;

const configureFacebookAuth = () => {
	passport.use(
		new FacebookStrategy(
			{
				clientID: process.env.FACEBOOK_APP_ID,
				clientSecret: process.env.FACEBOOK_APP_SECRET,
				callbackURL: callbackUrl,
				profileFields: ["id", "emails", "name"],
			},
			async (accessToken, refreshToken, profile, cb) => {
				const { emails, name, id } = profile;
				const { value } = emails[0];

				let user = await getConnection()
					.getRepository(User)
					.createQueryBuilder("user")
					.leftJoinAndSelect("user.auth", "auth")
					.where("user.email = :email", { email: value })
					.getOne();

				if (!user) {
					// creating new user
					user = await User.create({
						email: value,
						first_name: name.givenName,
						last_name: name.familyName,
						role: "INDIVIDUAL",
					}).save();
					await Auth.create({ facebook_id: id, user }).save();
				} else if (!user.auth.facebook_id) {
					// merging google accounting with email
					user.auth.facebook_id = id;
					await user.auth.save();
				}

				cb(null, user);
			}
		)
	);
};

export default configureFacebookAuth;
