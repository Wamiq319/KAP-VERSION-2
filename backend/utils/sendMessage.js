// utils/sendSms.js

export const sendSms = (messageData) => {
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
};
