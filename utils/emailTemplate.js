const emailTamplates = {
    otpVerification: (name, otp) => ({
        subject: 'Verify Your Account with OTP',
        body: `
        Hi ${name},
        
        Your One-Time Password (OTP) is: ${otp}
        
        Please use this code to verify your account. The OTP will expire in 10 minutes.
        
        Thank you,
        `
    }),
    sendAdminCurd: (name, email, password) => ({
        subject: 'You Have Been Added as an Admin',
        body: `
        Hi ${name},
        
        You have been added as an admin. Below are your login credentials:
        
        Email: ${email}
        Password: ${password}

        You can log in here: ${'http://18.209.91.97:1114'}
        
        Please change your password after logging in.
        
        Thank you,
        `
    }),
}

export {
    emailTamplates
}