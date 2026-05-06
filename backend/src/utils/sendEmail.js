import nodemailer from "nodemailer";

let transporter = null;

const getBooleanEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim().toLowerCase() === "true";
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing. Set both variables in Render environment.",
    );
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = getBooleanEnv(process.env.SMTP_SECURE, smtpPort === 465);

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error("Email recipient is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  if (!text && !html) {
    throw new Error("Email body is required.");
  }

  const fromName = process.env.EMAIL_FROM_NAME || "Online Voting System";
  const fromEmail = process.env.EMAIL_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const activeTransporter = getTransporter();
    const result = await activeTransporter.sendMail(mailOptions);

    console.log("OTP email sent successfully:", {
      to,
      subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return result;
  } catch (error) {
    console.error("OTP email sending failed:", {
      to,
      subject,
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    });

    throw new Error(
      error.message ||
        "OTP email could not be sent. Check EMAIL_USER, EMAIL_PASS and SMTP env variables.",
    );
  }
};

export default sendEmail;
