const User= require('@models/userModel');
const RefreshToken= require('@models/refreshTokenModel');
const jwtUtil= require('@utils/jwt');
const crypto= require('crypto');


const getRefreshTokenExpiry=()=>{
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
        expiresAt: getRefreshTokenExpiry(),
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
  if(!user || !(await user.verifyPassword(password))) {
    throw new Error('Invalid email or password');
  }
  return {user,
    ...(await issueTokens(user, reqMeta))
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

const logOutUser=async(refreshToken)=>{
  const stored=await RefreshToken.findOne({ token: refreshToken });
  if(stored){
    stored.blacklisted=true;
    await stored.save();
  }

}

const requestPasswordReset=async(email)=>{
  const user= await User.findOne({ email });
  if(!user){
    throw new Error('User not found');
  }
  const token=crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken=token;
  user.resetPasswordExpires=Date.now() + 900000;
  await user.save();
  return token;
}

const resetPassword=async(token, newPassword)=>{
  const user=await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if(!user){
    throw new Error('Invalid or expired password reset token');
  }
  user.password=newPassword;
  user.resetPasswordToken='';
  user.resetPasswordExpires=undefined;
  await user.save();
  return user;
}

const getUserProfile=async(userId)=>{
  const user = await User.findById(userId);
  if(!user){
    throw new Error('User not found');
  }
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logOutUser,
  requestPasswordReset,
  resetPassword,
  getUserProfile
};




