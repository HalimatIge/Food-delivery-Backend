// const createTransporter = () => {
//   // Validate required environment variables
//   if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
//     throw new Error("Email credentials not configured");
//   }

//   const config = {
//     host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
//     port: parseInt(process.env.MAIL_PORT) || 587,
//     secure: parseInt(process.env.MAIL_PORT) === 465,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//     tls: {
//       rejectUnauthorized: false, // Allow self-signed certificates
//     },
//     debug: true, // Enable debug output
//     logger: true, // Log to console
//   };

//   console.log("Creating transporter with config:", {
//     host: config.host,
//     port: config.port,
//     secure: config.secure,
//     user: config.auth.user,
//     passLength: config.auth.pass?.length,
//   });

//   return nodemailer.createTransport(config);
// };

// const sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     console.log("=== SEND OTP REQUEST ===");
//     console.log("Email:", email);
//     console.log("Environment Check:", {
//       MAIL_HOST: process.env.MAIL_HOST,
//       MAIL_PORT: process.env.MAIL_PORT,
//       MAIL_USER: process.env.MAIL_USER ? "✓ SET" : "✗ MISSING",
//       MAIL_PASS: process.env.MAIL_PASS ? "✓ SET" : "✗ MISSING",
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

//     let transporter;
//     try {
//       transporter = createTransporter();
//       console.log("Transporter created successfully");
//     } catch (transporterError) {
//       console.error("Failed to create transporter:", transporterError);
//       return res.status(500).json({
//         success: false,
//         message: "Email service not configured properly",
//       });
//     }

//     // Test the connection
//     try {
//       await transporter.verify();
//       console.log("✓ Email server connection verified");
//     } catch (verifyError) {
//       console.error("✗ Email verification failed:", {
//         error: verifyError.message,
//         code: verifyError.code,
//         command: verifyError.command,
//       });
//       return res.status(500).json({
//         success: false,
//         message: "Cannot connect to email server. Please check configuration.",
//       });
//     }

//     const mailOptions = {
//       from: `"QuickPlate" <halimatyetundeige@gmail.com>`,
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

//     console.log("Attempting to send email...");
//     await transporter.sendMail(mailOptions);
//     console.log(`✓ Email sent successfully to ${email}`);
//     console.log("Message ID:", info.messageId);
//     console.log("Response:", info.response);

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (err) {
//     console.error("=== SEND OTP ERROR ===");
//     console.error("Error details:", {
//       message: err.message,
//       code: err.code,
//       command: err.command,
//       stack: err.stack,
//     });

//     if (err.code === "EAUTH") {
//       return res.status(500).json({
//         success: false,
//         message: "Email authentication failed. Invalid credentials.",
//       });
//     }

//     if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
//       return res.status(500).json({
//         success: false,
//         message: "Cannot reach email server",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send OTP: " + err.message,
//     });
//   }
// };

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

// const sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

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

//     const msg = {
//       to: email,
//       from: process.env.SENDGRID_VERIFIED_SENDER, // Your verified sender email
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

//     await sgMail.send(msg);
//     console.log(`Email sent successfully to ${email}`);

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (err) {
//     console.error("Send OTP error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send OTP",
//     });
//   }
// };
