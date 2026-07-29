import nodemailer from "nodemailer";

function getMailCredentials() {
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

export async function sendVerificationEmail(email: string, link: string) {
  const credentials = getMailCredentials();

  // Dev fallback: if creds are missing, log the link instead of sending.
  if (!credentials) {
    console.log("[DEV] Verification link: " + link);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: credentials,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? credentials.user,
    to: email,
    subject: "Verifiko llogarinë tënde në AgroDitari",
    html: `<p>Mirë se erdhe në AgroDitari.</p>
           <p>Kliko për të aktivizuar llogarinë:</p>
           <p><a href="${link}">Verifiko email-in</a></p>
           <p>Linku skadon për 24 orë.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, link: string) {
  const credentials = getMailCredentials();

  // Dev fallback: if creds are missing, log the link instead of sending.
  if (!credentials) {
    console.log("[DEV] Password reset link: " + link);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: credentials,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? credentials.user,
    to: email,
    subject: "Rivendos fjalëkalimin për AgroDitari",
    html: `<p>Ke kërkuar rivendosjen e fjalëkalimit për llogarinë tënde në AgroDitari.</p>
           <p>Kliko për të vendosur një fjalëkalim të ri:</p>
           <p><a href="${link}">Rivendos fjalëkalimin</a></p>
           <p>Linku skadon për 1 orë. Nëse s'e ke kërkuar këtë, injoro këtë email.</p>`,
  });
}