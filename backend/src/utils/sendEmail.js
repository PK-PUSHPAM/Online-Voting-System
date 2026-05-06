import nodemailer from "nodemailer";

let transporter = null;

const normalizeAppPassword = (password = "") => password.replace(/\s/g, "");

const getSmtpConfig = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = normalizeAppPassword(process.env.EMAIL_PASS || "");

  if (!emailUser || !emailPass) {
    throw new Error(
      "Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in deployment environment variables.",
    );
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure =
    process.env.SMTP_SECURE === undefined
      ? smtpPort === 465
      : process.env.SMTP_SECURE === "true";

  return {
    emailUser,
    emailPass,
    smtpHost,
    smtpPort,
    smtpSecure,
  };
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { emailUser, emailPass, smtpHost, smtpPort, smtpSecure } =
    getSmtpConfig();

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

export const verifyEmailTransporter = async () => {
  const mailTransporter = getTransporter();
  return mailTransporter.verify();
};

const sendEmail = async ({ to, subject, text, html }) => {
  const { emailUser } = getSmtpConfig();
  const recipient = to?.trim();

  if (!recipient) {
    throw new Error("Email recipient is required");
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Online Voting System"}" <${emailUser}>`,
    to: recipient,
    subject,
    text,
    html,
  };

  try {
    const mailTransporter = getTransporter();
    const result = await mailTransporter.sendMail(mailOptions);

    console.log("✅ OTP email SMTP result", {
      to: recipient,
      subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
    });

    if (
      !Array.isArray(result.accepted) ||
      !result.accepted.includes(recipient)
    ) {
      throw new Error(
        `SMTP server did not accept recipient. Accepted: ${JSON.stringify(
          result.accepted || [],
        )}, Rejected: ${JSON.stringify(result.rejected || [])}`,
      );
    }

    return result;
  } catch (error) {
    console.error("❌ OTP email sending failed", {
      to: recipient,
      subject,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message,
    });

    throw error;
  }
};

export default sendEmail;
