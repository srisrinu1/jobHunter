const jwt=require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

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
   if(!process.env.JWT_SECRET){
     throw new Error('JWT_SECRET environment variable is not set');
   }
   const payload={
     sub:user._id,
     role:user.role || 'user',
     email:user.email
   };
   return jwt.sign(payload, process.env.JWT_SECRET, accessTokenOptions);
}

const generateRefreshToken=(user)=>{
   if(!user || !user._id){
     throw new Error('User object is required to generate refresh token');
   }
   if(!process.env.REFRESH_TOKEN_SECRET){
     throw new Error('REFRESH_TOKEN_SECRET environment variable is not set');
   }
   const payload={
     sub:user._id,
   };
   return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, refreshTokenOptions);
}

const verifyToken=(token,isRefreshToken=false)=>{
    const secret=isRefreshToken ? process.env.REFRESH_TOKEN_SECRET : process.env.JWT_SECRET;
   if(!secret){
     throw new Error('JWT verification secret is required');
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