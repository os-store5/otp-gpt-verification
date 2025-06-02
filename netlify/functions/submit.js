const imaps = require("imap-simple");
const simpleParser = require("mailparser").simpleParser;

const config = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 5000,
  },
};

exports.handler = async (event) => {
  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["UNSEEN", ["FROM", "noreply@openai.com"]];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    if (!messages.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "لم يتم العثور على كود التحقق في البريد." }),
      };
    }

    const raw = messages[0].parts.find(p => p.which === "TEXT").body;
    const parsed = await simpleParser(raw);
    const match = parsed.text.match(/\b\d{6}\b/);

    if (!match) {
      return {
        statusCode: 422,
        body: JSON.stringify({ message: "لم يتم العثور على كود مكوّن من 6 أرقام في الرسالة." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ otp: match[0] }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "حدث خطأ أثناء جلب الكود.", error: err.message }),
    };
  }
};
