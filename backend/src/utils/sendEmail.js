import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  // .env load hone ke baad, transporter create karenge
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env",
      );
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection
    transporter.verify((error, success) => {
      if (error) {
        console.error("⚠️  Email transporter verification error:", error);
      } else {
        console.log("✅ Email transporter is ready to send emails");
      }
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  if (!to) {
    throw new Error("Email recipient (to) is required");
  }

  const mailOptions = {
    from: `"Online Voting System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  try {
    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", {
      to,
      subject,
      messageId: result.messageId,
    });
    return result;
  } catch (error) {
    console.error("❌ Failed to send email:", {
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
};

export default sendEmail;
