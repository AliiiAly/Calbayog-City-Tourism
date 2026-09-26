const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    throw new Error("Mailjet API keys are missing.");
  }

  const auth = Buffer.from(
    `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
  ).toString("base64");

  try {
    const response = await fetch(
      "https://api.mailjet.com/v3.1/send",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },

        body: JSON.stringify({
          Messages: [
            {
              From: {
                Email: "tourismcalbayogcity@gmail.com",
                Name: "Calbayog City Tourism",
              },

              To: [
                {
                  Email: to,
                },
              ],

              Subject: subject,

              HTMLPart: html,
            },
          ],
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "❌ MAILJET ERROR:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.ErrorMessage ||
          data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage ||
          `Mailjet request failed with status ${response.status}.`
      );
    }

    console.log(
      "📧 Mailjet email sent successfully:",
      JSON.stringify(data, null, 2)
    );

    return data;
  } catch (error) {
    console.error(
      "❌ EMAIL SENDING ERROR:",
      error?.message || error
    );

    throw error;
  }
};

const verifyEmailConnection = async () => {
  if (
    !process.env.MAILJET_API_KEY ||
    !process.env.MAILJET_SECRET_KEY
  ) {
    console.error("❌ Mailjet API keys are missing.");
    return false;
  }

  console.log("✅ Mailjet API configuration is ready.");
  return true;
};

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
