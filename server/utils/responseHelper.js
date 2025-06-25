const formatUserResponse=(user)=>{
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    };
}

module.exports={
    formatUserResponse
}