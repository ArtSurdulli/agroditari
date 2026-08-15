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

export type ReminderDigestItem = {
  title: string;
  dueDate: Date;
  cropName?: string | null;
  parcelName?: string | null;
};

function formatDigestLine(item: ReminderDigestItem) {
  const datePart = item.dueDate.toLocaleDateString("sq-AL", {
    timeZone: "UTC",
  });
  const linkPart =
    item.cropName && item.parcelName
      ? ` (${item.cropName} — ${item.parcelName})`
      : "";
  return `${item.title} — ${datePart}${linkPart}`;
}

function renderDigestSection(heading: string, items: ReminderDigestItem[]) {
  if (items.length === 0) return "";
  const rows = items.map((item) => `<li>${formatDigestLine(item)}</li>`).join("");
  return `<p><strong>${heading}</strong></p><ul>${rows}</ul>`;
}

export async function sendReminderDigestEmail(
  user: { email: string; name: string },
  digest: { overdue: ReminderDigestItem[]; dueThisWeek: ReminderDigestItem[] }
) {
  const credentials = getMailCredentials();

  // Dev fallback: if creds are missing, log the digest instead of sending.
  if (!credentials) {
    console.log(
      `[DEV] Reminder digest for ${user.email}: ${digest.overdue.length} të vonuara, ${digest.dueThisWeek.length} këtë javë`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: credentials,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? credentials.user,
    to: user.email,
    subject: "Përmbledhja javore e kujtesave — AgroDitari",
    html: `<p>Përshëndetje ${user.name},</p>
           <p>Ja përmbledhja e kujtesave të tua në AgroDitari:</p>
           ${renderDigestSection("Të vonuara", digest.overdue)}
           ${renderDigestSection("Këtë javë", digest.dueThisWeek)}
           <p><a href="${process.env.APP_URL}/reminders">Shiko kujtesat</a></p>`,
  });
}