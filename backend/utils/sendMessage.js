import axios from "axios";
const SMS_USER = "khalid2u";
const SMS_SECRET =
  "c121137bbf059125e59c12542d3e3fdedf62a1edd82cbbb9bfc3e02dbd99f6d4";
const SMS_SENDER = "kas.pub.sa";
const SERVER_BASE_URL = "http://51.20.40.255:3000";

export async function sendSms(messageData) {
  const { to, message } = messageData;
  const time = new Date().toLocaleString();

  console.log("\n============================");
  console.log("📤 MOCK SMS SENT");
  console.log("----------------------------");
  console.log(`🕒 Time   : ${time}`);
  console.log(`📱 To     : ${to}`);
  console.log(`💬 Message: ${message}`);
  console.log("============================\n");
  return Promise.resolve({ success: true, to, message });

  try {
    const res = await axios.post(
      `${SERVER_BASE_URL}/send-sms`,
      { to, message },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Server SMS response:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Error sending SMS via server:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
