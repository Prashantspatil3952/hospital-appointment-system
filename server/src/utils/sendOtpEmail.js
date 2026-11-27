export async function sendOtpEmail(to, name, otp) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: to, name }],
      subject: "Verify your CarePoint account",
      textContent: `Hello ${name}, your verification code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#172033"><h2>Verify your email</h2><p>Hello ${escapeHtml(name)},</p><p>Use this one-time code to verify your CarePoint account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f1f5f9;border-radius:12px;text-align:center">${otp}</div><p>This code expires in <b>5 minutes</b>. If you did not request it, you can ignore this email.</p></div>`
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Brevo email error:", response.status, details);
    throw new Error("Could not send verification email. Check Brevo configuration and verified sender.");
  }
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
