const UserModel = require("../models/user.model");
const Otp = require("../models/otp.model");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// ========== COOKIE CONFIGURATION ============
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: maxAge,
  path: "/",
  // domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
});

// ========== TOKEN GENERATION ============
const generateAccessToken = (user) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "24h" });

const generateRefreshToken = (user) =>
  jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

// ========== EMAIL CONFIGURATION ============
const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email credentials not configured");
  }

  const config = {
    host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: parseInt(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  };

  console.log("Creating transporter with config:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    passLength: config.auth.pass?.length,
  });

  return nodemailer.createTransport(config);
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("=== SEND OTP REQUEST ===");
    console.log("Email:", email);
    console.log("Environment Check:", {
      MAIL_HOST: process.env.MAIL_HOST,
      MAIL_PORT: process.env.MAIL_PORT,
      MAIL_USER: process.env.MAIL_USER ? "✓ SET" : "✗ MISSING",
      MAIL_PASS: process.env.MAIL_PASS ? "✓ SET" : "✗ MISSING",
    });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const isRegistrationFlow =
      req.path.includes("/send-otp") && !req.path.includes("forgot-password");
    const isForgotPasswordFlow = req.path.includes("forgot-password");

    const userExists = await UserModel.findOne({ email });

    if (isRegistrationFlow && userExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead.",
      });
    }

    if (isForgotPasswordFlow && !userExists) {
      return res.status(400).json({
        success: false,
        message: "Email not registered. Please sign up first.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt: otpExpiresAt });

    console.log(`Generated OTP for ${email}: ${otp}`);

    let transporter;
    try {
      transporter = createTransporter();
      console.log("Transporter created successfully");
    } catch (transporterError) {
      console.error("Failed to create transporter:", transporterError);
      return res.status(500).json({
        success: false,
        message: "Email service not configured properly",
      });
    }

    // Test the connection
    try {
      await transporter.verify();
      console.log("✓ Email server connection verified");
    } catch (verifyError) {
      console.error("✗ Email verification failed:", {
        error: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
      });
      return res.status(500).json({
        success: false,
        message: "Cannot connect to email server. Please check configuration.",
      });
    }

    const mailOptions = {
      from: `"QuickPlate" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Code - QuickPlate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">QuickPlate Verification</h2>
          <p>Hello,</p>
          <p>Use the following OTP to complete your ${
            isRegistrationFlow ? "registration" : "password reset"
          }:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This OTP will expire in <strong>5 minutes</strong>.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">QuickPlate Team</p>
        </div>
      `,
    };

    console.log("Attempting to send email...");
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${email}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("=== SEND OTP ERROR ===");
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      command: err.command,
      stack: err.stack,
    });

    if (err.code === "EAUTH") {
      return res.status(500).json({
        success: false,
        message: "Email authentication failed. Invalid credentials.",
      });
    }

    if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
      return res.status(500).json({
        success: false,
        message: "Cannot reach email server",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP: " + err.message,
    });
  }
};

// const createTransporter = () => {
//   return nodemailer.createTransport({
//   host: process.env.MAIL_HOST || "smtp-relay.brevo.com", // string
//   port: Number(process.env.MAIL_PORT) || 587,           // number
//   secure: Number(process.env.MAIL_PORT) === 465,        // true if using SSL port
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
//   tls: {
//       rejectUnauthorized: false
//     }
// });

//   // return nodemailer.createTransport({
//   //   // host: process.env.MAIL_HOST || 'smtp.gmail.com',
//   //   host: process.env.MAIL_HOST == 'smtp-relay.brevo.com',
//   //   port: process.env.MAIL_PORT == 465,
//   //   secure: true,
//   //   auth: {
//   //     user: process.env.MAIL_USER,
//   //     pass: process.env.MAIL_PASS,
//   //   },
//   // });
// };

// ========== SEND OTP ============
// const sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required"
//       });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email format"
//       });
//     }

//     const isRegistrationFlow = req.path.includes('/send-otp') && !req.path.includes('forgot-password');
//     const isForgotPasswordFlow = req.path.includes('forgot-password');

//     const userExists = await UserModel.findOne({ email });

//     if (isRegistrationFlow && userExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already registered. Please login instead."
//       });
//     }

//     if (isForgotPasswordFlow && !userExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Email not registered. Please sign up first."
//       });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//     await Otp.deleteMany({ email });
//     await Otp.create({ email, otp, expiresAt: otpExpiresAt });

//     console.log(`Generated OTP for ${email}: ${otp}`);

//     const transporter = createTransporter();

//     const mailOptions = {
//       from: `"QuickPlate" <${process.env.MAIL_USER}>`,
//       to: email,
//       subject: "Your OTP Code - QuickPlate",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//           <h2 style="color: #2563eb; text-align: center;">QuickPlate Verification</h2>
//           <p>Hello,</p>
//           <p>Use the following OTP to complete your ${isRegistrationFlow ? 'registration' : 'password reset'}:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
//           </div>
//           <p>This OTP will expire in <strong>5 minutes</strong>.</p>
//           <p>If you didn't request this code, please ignore this email.</p>
//           <hr style="margin: 20px 0;">
//           <p style="font-size: 12px; color: #666;">QuickPlate Team</p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (err) {
//     console.error("Send OTP error:", err.message);

//     if (err.code === 'EAUTH') {
//       return res.status(500).json({
//         success: false,
//         message: "Email service configuration error"
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Server error sending OTP"
//     });
//   }
// };

// const sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Log email configuration (DO THIS FIRST)
//     console.log("Email Config Check:", {
//       host: process.env.MAIL_HOST,
//       port: process.env.MAIL_PORT,
//       user: process.env.MAIL_USER ? "SET" : "MISSING",
//       pass: process.env.MAIL_PASS ? "SET" : "MISSING",
//     });

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email format",
//       });
//     }

//     const isRegistrationFlow =
//       req.path.includes("/send-otp") && !req.path.includes("forgot-password");
//     const isForgotPasswordFlow = req.path.includes("forgot-password");

//     const userExists = await UserModel.findOne({ email });

//     if (isRegistrationFlow && userExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already registered. Please login instead.",
//       });
//     }

//     if (isForgotPasswordFlow && !userExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Email not registered. Please sign up first.",
//       });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await Otp.deleteMany({ email });
//     await Otp.create({ email, otp, expiresAt: otpExpiresAt });

//     console.log(`Generated OTP for ${email}: ${otp}`);

//     const transporter = createTransporter();

//     // Test the connection
//     try {
//       await transporter.verify();
//       console.log("Email transporter verified successfully");
//     } catch (verifyError) {
//       console.error("Email verification failed:", verifyError);
//       return res.status(500).json({
//         success: false,
//         message: "Email service configuration error",
//       });
//     }

//     const mailOptions = {
//       from: `"QuickPlate" <${process.env.MAIL_USER}>`,
//       to: email,
//       subject: "Your OTP Code - QuickPlate",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//           <h2 style="color: #2563eb; text-align: center;">QuickPlate Verification</h2>
//           <p>Hello,</p>
//           <p>Use the following OTP to complete your ${
//             isRegistrationFlow ? "registration" : "password reset"
//           }:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
//           </div>
//           <p>This OTP will expire in <strong>5 minutes</strong>.</p>
//           <p>If you didn't request this code, please ignore this email.</p>
//           <hr style="margin: 20px 0;">
//           <p style="font-size: 12px; color: #666;">QuickPlate Team</p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent successfully to ${email}`);

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (err) {
//     console.error("Send OTP error:", err);

//     if (err.code === "EAUTH") {
//       return res.status(500).json({
//         success: false,
//         message: "Email authentication failed. Check credentials.",
//       });
//     }

//     if (err.code === "ECONNECTION") {
//       return res.status(500).json({
//         success: false,
//         message: "Could not connect to email server",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Server error sending OTP: " + err.message,
//     });
//   }
// };

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const validOtp = await Otp.findOne({
      email,
      otp: Number(otp),
    }).sort({ createdAt: -1 });

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP is expired
    if (validOtp.expiresAt && validOtp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: validOtp._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Don't delete the OTP here - let resetPassword handle it
    // Just return success for verification

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error verifying OTP",
    });
  }
};

// ========== SIGN IN ============

const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, otp } = req.body;

    // Validate all fields
    if (!firstname || !lastname || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Verify OTP first
    const validOtp = await Otp.findOne({
      email,
      otp: Number(otp),
    });

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Check if user already exists (double check)
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, number, and special character",
      });
    }

    // Create user
    const newUser = new UserModel({
      firstname,
      lastname,
      email,
      password,
    });

    await newUser.save();

    // Delete the OTP after successful registration
    await Otp.deleteOne({ _id: validOtp._id });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

const signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await new Promise((resolve, reject) => {
      user.validatePassword(password, (err, same) => {
        if (err) reject(err);
        else resolve(same);
      });
    });

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    //   res.cookie("token", accessToken, {
    //     httpOnly: true,
    //     secure: true,
    // sameSite: "none",
    //     maxAge: 24 * 60 * 60 * 1000, // 24 hours
    //   });

    //   res.cookie("refreshToken", refreshToken, {
    //     httpOnly: true,
    //     secure: true,
    // sameSite: "none",
    //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    //   });
    res.cookie("token", accessToken, getCookieOptions(24 * 60 * 60 * 1000));

    res.cookie(
      "refreshToken",
      refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Sign in error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during sign in",
    });
  }
};

// ========== FORGOT PASSWORD ============
const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, OTP has been sent",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt: otpExpiresAt });

    const transporter = createTransporter();

    const mailOptions = {
      from: `"QuickPlate" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - QuickPlate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #dc2626; text-align: center;">Password Reset Request</h2>
          <p>Hello ${user.firstname},</p>
          <p>You requested to reset your password. Use the following OTP:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This OTP will expire in <strong>5 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">QuickPlate Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "If the email exists, OTP has been sent",
    });
  } catch (err) {
    console.error("Send forgot password OTP error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// ========== RESET PASSWORD ============
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const validOtp = await Otp.findOne({
      email: email.toLowerCase().trim(),
      otp: Number(otp),
    });

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or expired OTP",
      });
    }

    // Check OTP expiration
    if (validOtp.expiresAt && validOtp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: validOtp._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteMany({ email });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
    };

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// const refreshAccessToken = (req, res) => {
//   const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken) {
//     return res.status(401).json({
//       success: false,
//       message: "No refresh token"
//     });
//   }

//   jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({
//         success: false,
//         message: "Invalid refresh token"
//       });
//     }

//     const newAccessToken = generateAccessToken({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//   //   res.cookie("token", newAccessToken, {
//   //     httpOnly: true,
//   //     secure: true,
//   // sameSite: "none",
//   //     maxAge: 24 * 60 * 60 * 1000,
//   //   });

//   res.cookie("token", newAccessToken, getCookieOptions(24 * 60 * 60 * 1000));

//     res.json({
//       success: true,
//       message: "Access token refreshed"
//     });
//   });
// };

// ========== DASHBOARD ============

const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "No refresh token",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    res.cookie("token", newAccessToken, getCookieOptions(24 * 60 * 60 * 1000));

    return res.json({
      success: true,
      message: "Access token refreshed",
    });
  } catch (err) {
    console.error("Token refresh error:", err.message);
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Dashboard loaded",
      user,
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error loading dashboard",
    });
  }
};

// ========== UPDATE PROFILE ============

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, currentPassword, newPassword } = req.body; // ✅ Add address

    console.log("🔄 Updating profile for user:", userId);
    console.log("📦 Received data:", {
      name,
      phone,
      address,
      hasPasswordChange: !!(currentPassword && newPassword),
    });

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update basic info
    if (name) {
      const nameParts = name.trim().split(" ");
      user.firstname = nameParts[0] || "";
      user.lastname = nameParts.slice(1).join(" ") || "";
    }
    if (phone) user.phone = phone.trim();
    if (address) user.address = address.trim(); // ✅ Add this line

    // Password change
    if (currentPassword && newPassword) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters and include 1 capital letter, 1 number, and 1 special character (!@#$%^&*)",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = newPassword;
    }

    await user.save();
    const updatedUser = await UserModel.findById(userId);

    const userResponse = {
      id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      name: `${updatedUser.firstname} ${updatedUser.lastname}`.trim(),
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      address: updatedUser.address || "", // ✅ Make sure this is included
      role: updatedUser.role,
    };

    console.log("✅ Updated user data:", userResponse);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser, // ✅ Use the formatted user object
    });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

// ========== LOGOUT ============
// const logout = (req, res) => {
//   res.clearCookie("token", {
//     httpOnly: true,
//    secure: true,
//   sameSite: "none"
//   });

//   res.clearCookie("refreshToken", {
//     httpOnly: true,
//     secure: true,
//   sameSite: "none"
//   });

//   return res.json({
//     success: true,
//     message: "Logged out successfully"
//   });
// };

const logout = (req, res) => {
  res.clearCookie("token", getCookieOptions(0));
  res.clearCookie("refreshToken", getCookieOptions(0));

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// ========== MIDDLEWARE ============
const verifyUserOnRefresh = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = {
  registerUser,
  signInUser,
  refreshAccessToken,
  getDashboard,
  logout,
  verifyUserOnRefresh,
  sendOtp,
  verifyOtp,
  resetPassword,
  sendForgotPasswordOtp,
  updateUserProfile,
  getCurrentUser,
};
