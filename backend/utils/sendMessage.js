import axios from "axios";

const SMS_USER = "khalid2u";
const SMS_SECRET =
  "c121137bbf059125e59c12542d3e3fdedf62a1edd82cbbb9bfc3e02dbd99f6d4";
const SMS_SENDER = "kas.pub.sa";
const SERVER_BASE_URL = "http://13.49.64.191:3000";

// Uncomment this block later to use direct DreamSMS API call after testing.
/*
export async function sendSMS(to, message) {
  const url = "https://www.dreams.sa/index.php/api/sendsms/";
  const params = new URLSearchParams({
    user: SMS_USER,
    secret_key: SMS_SECRET,
    sender: SMS_SENDER,
    to,
    message,
  });

  try {
    const res = await axios.get(`${url}?${params.toString()}`);
    console.log("SMS response:", res.data);
    return { success: true };
  } catch (error) {
    console.error("SMS Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
*/

export async function sendSms(messageData) {
  const { to, message } = messageData;
  const time = new Date().toLocaleString();

  console.log("\n============================");
  console.log("📤 SENDING SMS");
  console.log("----------------------------");
  console.log(`🕒 Time   : ${time}`);
  console.log(`📱 To     : ${to}`);
  console.log(`💬 Message: ${message}`);
  console.log("============================\n");

  try {
    const res = await axios.post(
      `${SERVER_BASE_URL}/send-sms`,
      { to, message },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Server SMS response:", res.data);
    return { success: true, to, message };
  } catch (error) {
    console.error(
      "Error sending SMS via server:",
      error.response?.data || error.message
    );
    return {
      success: false,
      to,
      message,
      error: error.response?.data || error.message,
    };
  }
}
