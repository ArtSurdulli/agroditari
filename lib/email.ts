import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, link: string) {
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;

  // Dev fallback: if creds are missing, log the link instead of sending.
  if (!user || !pass) {
    console.log("[DEV] Verification link: " + link);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? user,
    to: email,
    subject: "Verifiko llogarinë tënde në AgroDitari",
    html: `<p>Mirë se erdhe në AgroDitari.</p>
           <p>Kliko për të aktivizuar llogarinë:</p>
           <p><a href="${link}">Verifiko email-in</a></p>
           <p>Linku skadon për 24 orë.</p>`,
  });
}