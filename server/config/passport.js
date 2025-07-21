const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');
const { User } = require('@models');
const cookieExtractor = req => req?.cookies?.accessToken || null;

const jwtFromRequest=req=>cookieExtractor(req)||ExtractJwt.fromAuthHeaderAsBearerToken()(req);

const environment = process.env.NODE_ENV || 'development';
const isProd = environment === 'production';

// Get environment-specific JWT secret
const getJwtSecret = () => {
    switch(environment) {
        case 'production':
            return process.env.JWT_SECRET_PRODUCTION;
        case 'testing':
            return process.env.JWT_SECRET_TESTING;
        case 'development':
        default:
            return process.env.JWT_SECRET_DEVELOPMENT;
    }
};

const jwtOptions={
  jwtFromRequest,
  secretOrKey: getJwtSecret(),
  algorithms: ['HS256'],
}

if(isProd){
  jwtOptions.issuer=process.env.JWT_ISSUER;
  jwtOptions.audience=process.env.JWT_AUDIENCE;
}

passport.use('local',new LocalStrategy({
  usernameField: 'email',
  session: false
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));




passport.use('jwt', new JwtStrategy(jwtOptions, 
  async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

module.exports = passport;
