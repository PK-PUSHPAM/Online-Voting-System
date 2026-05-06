import nodemailer from "nodemailer";

let transporter = null;

const normalizeAppPassword = (password = "") => password.replace(/\s/g, "");

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = normalizeAppPassword(process.env.EMAIL_PASS || "");

  if (!emailUser || !emailPass) {
    throw new Error(
      "Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in your deployment environment variables.",
    );
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure =
    process.env.SMTP_SECURE === undefined
      ? smtpPort === 465
      : process.env.SMTP_SECURE === "true";

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 15000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 20000),
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const emailUser = process.env.EMAIL_USER?.trim();

  if (!to) {
    throw new Error("Email recipient is required");
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Online Voting System"}" <${emailUser}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const mailTransporter = getTransporter();
    const result = await mailTransporter.sendMail(mailOptions);

    console.log("✅ OTP email sent", {
      to,
      subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return result;
  } catch (error) {
    console.error("❌ OTP email sending failed", {
      to,
      subject,
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    });

    throw error;
  }
};

export default sendEmail;
