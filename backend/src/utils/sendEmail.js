import dns from "node:dns";
import nodemailer from "nodemailer";

dns.setDefaultResultOrder("ipv4first");

let transporter = null;

const EMAIL_MODULE_VERSION = "sendEmail-ipv4-force-v2";

const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(
    hostname,
    {
      ...options,
      family: 4,
      all: false,
    },
    callback,
  );
};

const getBooleanEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim().toLowerCase() === "true";
};

const getRequiredEnv = (key) => {
  const value = String(process.env[key] || "").trim();

  if (!value) {
    throw new Error(`${key} is missing in backend environment variables.`);
  }

  return value;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const emailUser = getRequiredEnv("EMAIL_USER");
  const emailPass = getRequiredEnv("EMAIL_PASS");

  const smtpHost = String(process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = getBooleanEnv(process.env.SMTP_SECURE, smtpPort === 465);

  console.log("Email transporter config:", {
    version: EMAIL_MODULE_VERSION,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: emailUser,
    ipv4Forced: true,
  });

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,

    /**
     * Render/Gmail IPv6 issue fix:
     * Your logs show SMTP is trying IPv6:
     * 2607:f8b0:4004:...
     *
     * These options force Node/Nodemailer to connect through IPv4.
     */
    family: 4,
    lookup: ipv4Lookup,
    localAddress: "0.0.0.0",

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    requireTLS: smtpPort === 587,

    connectionTimeout: 45000,
    greetingTimeout: 45000,
    socketTimeout: 45000,

    tls: {
      servername: smtpHost,
      rejectUnauthorized: true,
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

  const fromName = String(
    process.env.EMAIL_FROM_NAME || "Online Voting System",
  ).trim();

  const fromEmail = getRequiredEnv("EMAIL_USER");

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
      version: EMAIL_MODULE_VERSION,
      to: recipient,
      subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return result;
  } catch (error) {
    console.error("OTP email sending failed:", {
      version: EMAIL_MODULE_VERSION,
      to: recipient,
      subject,
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    });

    throw new Error(
      error.message ||
        "OTP email could not be sent. Check backend EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT and SMTP_SECURE.",
    );
  }
};

export default sendEmail;
