const User= require('@models/userModel');
const RefreshToken= require('@models/refreshTokenModel');
const jwtUtil= require('@utils/jwt');
const crypto= require('crypto');
const userModel = require('../models/userModel');

const getrefreshTokenExpiry=()=>{
    const ms=parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10)||
    7 * 24 * 60 * 60 * 1000; 
    return new Date(Date.now() + ms);
}

const issueTokens=async(user,reqMeta={})=>{
    const accessToken=jwtUtil.generateAccessToken(user);
    const refreshToken=jwtUtil.generateRefreshToken(user);

    await RefreshToken.create({
        user: user._id,
        token: refreshToken,
        expiresAt: getrefreshTokenExpiry(),
        userAgent: reqMeta.userAgent || '',
        ip: reqMeta.ip || ''
    });
    return { accessToken, refreshToken };
}

const registerUser=async(userData)=>{
    const user=new User(userData);
    await user.save();
    return user;
}

const loginUser=async(email, password,reqMeta={})=>{
  const user=await User.findOne({ email }).select('+password');
  if(!user && !(await user.verifyPassword(password))) {
    throw new Error('Invalid email or password');
  }
  return {user,
    ...await issueTokens(user, reqMeta)
};

}

const refreshTokens=async(refreshToken,reqMeta={})=>{
   let payload;
   try{
    payload=jwtUtil.verifyToken(refreshToken, true);
   }catch(error){
    throw new Error('Invalid or expired refresh token');
   }

   const stored=await RefreshToken.findOne({
    token: refreshToken,
   });
   if(!stored || stored.blacklisted || stored.expiresAt < new Date()){
    throw new Error('Refresh token invalidated or expired');
   }
   stored.blacklisted=true;
   await stored.save();
   const user=await User.findById(payload.sub);
    if(!user){
     throw new Error('User no longer exists');

    }
    return await issueTokens(user, reqMeta);
}





