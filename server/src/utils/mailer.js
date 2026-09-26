const Mailjet = require("node-mailjet");

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    throw new Error("Mailjet API keys are missing.");
  }

  const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  const request = await mailjet
    .post("send", { version: "v3.1" })
    .request({
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
    });

  console.log("📧 Email sent through Mailjet:", request.body);
  return request.body;
};

const verifyEmailConnection = async () => {
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    console.error("❌ Mailjet API keys are missing.");
    return false;
  }

  console.log("✅ Mailjet API configuration is ready.");
  return true;
};

module.exports = { sendEmail, verifyEmailConnection };
