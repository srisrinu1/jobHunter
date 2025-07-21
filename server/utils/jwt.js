const jwt=require('jsonwebtoken');

const environment = process.env.NODE_ENV || 'development';
const isProd = environment === 'production';

// Get environment-specific JWT secrets
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

const getRefreshTokenSecret = () => {
    switch(environment) {
        case 'production':
            return process.env.REFRESH_TOKEN_SECRET_PRODUCTION;
        case 'testing':
            return process.env.REFRESH_TOKEN_SECRET_TESTING;
        case 'development':
        default:
            return process.env.REFRESH_TOKEN_SECRET_DEVELOPMENT;
    }
};

const accessTokenOptions={
    expiresIn:process.env.JWT_EXPIRES_IN || '15m',
    issuer:process.env.JWT_ISSUER,
     ...(isProd && { audience: process.env.JWT_AUDIENCE }),
    algorithm:'HS256'
}

const refreshTokenOptions={
    expiresIn:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer:process.env.JWT_ISSUER,
    ...(isProd && { audience: process.env.JWT_AUDIENCE }),
    algorithm:'HS256'
}

const generateAccessToken=(user)=>{
   if(!user || !user._id){
     throw new Error('User object is required to generate access token');
   }
   const jwtSecret = getJwtSecret();
   if(!jwtSecret){
     throw new Error(`JWT_SECRET_${environment.toUpperCase()} environment variable is not set`);
   }
   const payload={
     sub:user._id,
     role:user.role || 'user',
     email:user.email
   };
   return jwt.sign(payload, jwtSecret, accessTokenOptions);
}

const generateRefreshToken=(user)=>{
   if(!user || !user._id){
     throw new Error('User object is required to generate refresh token');
   }
   const refreshSecret = getRefreshTokenSecret();
   if(!refreshSecret){
     throw new Error(`REFRESH_TOKEN_SECRET_${environment.toUpperCase()} environment variable is not set`);
   }
   const payload={
     sub:user._id,
   };
   return jwt.sign(payload, refreshSecret, refreshTokenOptions);
}

const verifyToken=(token,isRefreshToken=false)=>{
    const secret = isRefreshToken ? getRefreshTokenSecret() : getJwtSecret();
   if(!secret){
     throw new Error(`${isRefreshToken ? 'REFRESH_TOKEN_SECRET' : 'JWT_SECRET'}_${environment.toUpperCase()} environment variable is not set`);
   }
   try{
    return jwt.verify(token, secret, {
     issuer: isRefreshToken ? refreshTokenOptions.issuer : accessTokenOptions.issuer,
      audience: isRefreshToken ? refreshTokenOptions.audience : accessTokenOptions.audience,
      algorithms: ['HS256']
    });
   }catch(error){
     console.error('JWT Verification Error:', error.message);
    throw error;
   }
}

module.exports={
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    };