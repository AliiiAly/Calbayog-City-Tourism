const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Calbayog City Tourism <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Resend email failed:", data);
    throw new Error(
      data?.message || "Resend could not send the email."
    );
  }

  console.log("📧 Email sent through Resend:", data.id);

  return data;
};

const verifyEmailConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing.");
    return false;
  }

  console.log("✅ Resend API configuration is ready.");
  return true;
};

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
