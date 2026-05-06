import dns from "dns";
import nodemailer from "nodemailer";

dns.setDefaultResultOrder("ipv4first");

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

  const emailUser = String(process.env.EMAIL_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || "").trim();

  if (!emailUser || !emailPass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing. Set both variables in Render environment.",
    );
  }

  const smtpHost = String(process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = getBooleanEnv(process.env.SMTP_SECURE, smtpPort === 465);

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,

    /**
     * Important:
     * Render sometimes tries Gmail SMTP through IPv6.
     * Your logs show ENETUNREACH for IPv6 address.
     * family: 4 forces IPv4 connection.
     */
    family: 4,

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    requireTLS: smtpPort === 587,

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    tls: {
      servername: smtpHost,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const recipient = String(to || "").trim();

  if (!recipient) {
    throw new Error("Email recipient is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  if (!text && !html) {
    throw new Error("Email body is required.");
  }

  const fromName = process.env.EMAIL_FROM_NAME || "Online Voting System";
  const fromEmail = String(process.env.EMAIL_USER || "").trim();

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: recipient,
    subject,
    text,
    html,
  };

  try {
    const activeTransporter = getTransporter();
    const result = await activeTransporter.sendMail(mailOptions);

    console.log("OTP email sent successfully:", {
      to: recipient,
      subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return result;
  } catch (error) {
    console.error("OTP email sending failed:", {
      to: recipient,
      subject,
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    });

    throw new Error(
      error.message ||
        "OTP email could not be sent. Check backend deployment EMAIL_USER, EMAIL_PASS and SMTP env variables.",
    );
  }
};

export default sendEmail;
