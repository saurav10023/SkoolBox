import nodemailer from "nodemailer";

export const sendRegisterationOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Registeration OTP",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`
  });
};
