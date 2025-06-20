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

        You can log in here: http://18.209.91.97:1114
        
        Please change your password after logging in.
        
        Thank you,
        `
    }),

    sendVideoDeletedBySuperAdmin: (adminName, videoTitle, videoUrl) => ({
        subject: 'Your Safety Video Has Been Deleted by Super Admin',
        body: `
        Hi ${adminName},

        This is to inform you that a safety video uploaded by you has been deleted by a Super Admin.

        Details of the deleted video:

        Title: ${videoTitle}
        URL: ${videoUrl}

        If you believe this action was taken by mistake, please reach out to the administrator team.

        Thank you,
        Safety Compliance System
        `
    })

}

export {
    emailTamplates
}