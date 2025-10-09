const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../../Models/User/UserModel');
const passport = require('passport');
const NodeCache = require('node-cache');
const otpGenerator = require('otp-generator');
const Coupon = require('../../../Models/User/WalkinCoupen');
const nodemailer = require('nodemailer');

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like Outlook, Yahoo, etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email password or app password
    },
     tls: {
        rejectUnauthorized: false // This will disable certificate validation
    }
});

// Function to send OTP via email
const sendOtpEmail = async (email, otp, userName = 'User') => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; text-align: center;">OTP Verification</h2>
                    <p>Hello ${userName},</p>
                    <p>Your OTP verification code is:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #333; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Your App Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

// sending otp for registration
exports.register = async (req, res) => {
    const { name, phone, password, email, isWalkIn } = req.body;

    try {
        // Check if user exists by phone or email
        const existingUserByPhone = await User.findOne({ phone });
        if (existingUserByPhone) {
            return res.status(400).json({ msg: 'Phone number already exists' });
        }

        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ msg: 'Email already exists' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email format' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { 
            digits: true, 
            upperCaseAlphabets: false, 
            lowerCaseAlphabets: false,
            specialChars: false 
        });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store data in cache with email as key
        cache.set(email, { 
            name, 
            phone, 
            email, 
            password: hashedPassword, 
            otp, 
            isWalkIn 
        });

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp, name);
        
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email. Try again later.' });
        }

        console.log(`OTP ${otp} sent to email: ${email}`);

        return res.status(200).json({ 
            message: 'OTP sent successfully to your email',
            email: email // Return email for client reference
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// verify otp and register a user
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Retrieve stored data from cache using email
        const cachedData = cache.get(email);
        if (!cachedData) {
            return res.status(400).json({ message: 'OTP invalid or expired' });
        }

        // Verify the OTP
        if (cachedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Save the user to MongoDB
        const newUser = new User({
            name: cachedData.name,
            phone: cachedData.phone,
            email: cachedData.email,
            password: cachedData.password
        });
        
        const savedUser = await newUser.save();
        console.log('User saved:', savedUser);

        let newCoupon = null;
        if (cachedData.isWalkIn) {
            const couponCode = `WALK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
            newCoupon = new Coupon({
                code: couponCode,
                userId: savedUser._id,
            });
            await newCoupon.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: savedUser._id, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Delete the temporary data from cache
        cache.del(email);

        return res.status(201).json({
            message: 'User registered successfully',
            user: { 
                name: savedUser.name, 
                phone: savedUser.phone, 
                email: savedUser.email,
                userId: savedUser._id 
            },
            coupon: newCoupon ? newCoupon.code : null,
            token,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Resend OTP function
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if there's existing cached data for this email
        const cachedData = cache.get(email);
        
        if (!cachedData) {
            return res.status(400).json({ message: 'No pending registration found for this email' });
        }

        // Generate new OTP
        const newOtp = otpGenerator.generate(6, { 
            digits: true, 
            upperCaseAlphabets: false, 
            lowerCaseAlphabets: false,
            specialChars: false 
        });

        // Update cache with new OTP
        cache.set(email, {
            ...cachedData,
            otp: newOtp
        });

        // Send new OTP via email
        const emailSent = await sendOtpEmail(email, newOtp, cachedData.name);
        
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to resend OTP email. Try again later.' });
        }

        console.log(`New OTP ${newOtp} sent to email: ${email}`);

        return res.status(200).json({ 
            message: 'OTP resent successfully to your email',
            email: email
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// otp for forget password
exports.sendForgotPasswordOTP = async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { 
            digits: true, 
            upperCaseAlphabets: false, 
            lowerCaseAlphabets: false,
            specialChars: false 
        });

        // Store OTP in cache for password reset
        cache.set(`reset_${email}`, { 
            email: email,
            otp: otp 
        });

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp, user.name);
        
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
        }

        console.log(`Password reset OTP ${otp} sent to email: ${email}`);

        return res.status(200).json({ 
            message: 'OTP sent successfully to your email for password reset',
            email: email
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// verify otp for password reset
exports.verifyForgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const cachedData = cache.get(`reset_${email}`);
        
        if (!cachedData) {
            return res.status(400).json({ message: 'OTP invalid or expired' });
        }

        if (cachedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Generate temporary token for password reset
        const tempToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '5m' } 
        );
        
        // Remove OTP from cache after successful verification
        cache.del(`reset_${email}`);
        
        return res.status(200).json({ 
            message: 'OTP verified successfully. Use the token to reset password.', 
            tempToken 
        });       
         
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// reset password after verification
exports.resetPassword = async (req, res) => {
    const { tempToken, newPassword } = req.body;

    try {
        // Verify temporary token
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const email = decoded.email;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.updateOne({ email }, { password: hashedPassword });

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please try again.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Login a user (unchanged, but you might want to allow email login too)
exports.login = async (req, res) => {
    const { phone, password, email } = req.body;

    try {
        // Allow login with either phone or email
        let user;
        if (phone) {
            user = await User.findOne({ phone });
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ message: 'Phone or email is required' });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const coupon = await Coupon.findOne({ userId: user._id });

        res.status(200).json({
            message: 'User logged in successfully',
            userId: user._id,
            phone: user.phone,
            email: user.email,
            token: token,
            coupon
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.googleLoginCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
            // return res.status(500).json({ message: 'Authentication failed', error: err.message });
            return res.redirect('https://pokystore.in/login-user?error=Authentication%20Failed');

        }
        try {
            // Check if a user with this email exists
            const existingUser = await User.findOne({ email: user.email });
            if (existingUser) {
                user = existingUser; // Link to existing user
            } else {
                // Create a new user if not found
                user = await User.create({
                    name: user.name,
                    email: user.email,
                    googleId: user.id,
                });
            }
            // Generate JWT token
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            // res.status(200).json({
            //     message: 'Google login successful',
            //     token,
            //     user: {
            //         name: user.name,
            //         userId:user._id,
            //         email: user.email,
            //         role: user.role,
            //     },
            // });
            res.redirect(`https://pokystore.in/?Token=${token}&role=${user.role}&userId=${user._id}&name=${encodeURIComponent(user.name)}`);

        } catch (error) {
            // res.status(500).json({ message: 'Server error', error: error.message });
            console.log(error)
            return res.redirect('https://pokystore.in/login-user/login?error=Server%20Error');

        }
    })(req, res, next);
};
// // Facebook Login Callback
exports.facebookLoginCallback = (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Authentication failed', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // Generate a JWT token for the user
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Send the response with token and user info
        res.status(200).json({
            message: 'Facebook login successful',
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    })(req, res, next);
};


