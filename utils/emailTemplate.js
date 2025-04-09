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
}

export {
    emailTamplates
}