const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('./models/user');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'tokensecretchangelater'
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findOne({ email: jwt_payload.email });
            if (!user) {
                return done(null, false);
            } else {
                return done(null, user);
            }
        } catch (err) {
            return done(err);
        }
    })
);

module.exports = passport;
