const axios=require('axios');

const sendResetPasswordEmail= async(email,resetPasswordToken)=>{
    let resetPasswordUrl;
    if (process.env.NODE_ENV === 'production') {
        resetPasswordUrl = `${process.env.RESET_PASSWORD_URL_PRODUCTION}?token=${resetPasswordToken}&email=${encodeURIComponent(email)}`;
    } else if (process.env.NODE_ENV === 'testing') {
        resetPasswordUrl = `${process.env.RESET_PASSWORD_URL_TESTING}?token=${resetPasswordToken}&email=${encodeURIComponent(email)}`;
    } else {
        resetPasswordUrl = `${process.env.RESET_PASSWORD_URL_DEVELOPMENT}?token=${resetPasswordToken}&email=${encodeURIComponent(email)}`;
    }

    const mailData = {
        from: { email: process.env.MAILERSEND_FROM, name: "jobHunter" },
        to: [{ email }],
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 480px; margin: auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="font-size: 16px; color: #555;">We received a request to reset your password. Click the button below to proceed. This link will expire in 15 minutes.</p>
                <a href="${resetPasswordUrl}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                <p style="font-size: 14px; color: #888;">If you did not request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} YourApp. All rights reserved.</p>
            </div>
        `
    };
    await axios.post('https://api.mailersend.com/v1/email', mailData, {
        headers: {
            Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`
        }
    });
}

module.exports = {
    sendResetPasswordEmail                                                                                                                                              
};
