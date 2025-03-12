const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const axios = require("axios");

//Put your API ID, API Hash, String Session for telegram and Gemini API Key here
const apiId = "";
const apiHash = "";
const stringSession = new StringSession("");
const geminiApiKey = "";

(async () => {
  console.log("🔄 Connecting to Telegram...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start();
  console.log("\n✅ Connected to Telegram!");

  while (true) {
    console.log("\n➡️ Choose an option:");
    console.log("1️⃣ Live Chat");
    console.log("2️⃣ Previous Chat");
    console.log("3️⃣ Unread Chats");
    console.log("4️⃣ Ask Gemini a Question");
    console.log("5️⃣ Exit");

    const mode = await input.text("Enter choice (1-5): ");

    if (mode === "1") {
      const chatId = await selectChat(client);
      console.log("\n📡 Listening for real-time messages...");
      client.addEventHandler(async (event) => {
        if (event.message && event.message.peerId) {
          const sender = await client.getEntity(event.message.senderId);
          const timestamp = new Date(event.message.date * 1000).toLocaleString();
          const chatEntry = `📅 ${timestamp} - ${sender.username || sender.firstName || "Unknown User"}: ${event.message.message}`;
          console.log(chatEntry);
        }
      });
    } else if (mode === "2") {
      const chatId = await selectChat(client);
      let minutesBefore = await getMinutesBefore();
      const availableMinutes = 30;

      if (minutesBefore > availableMinutes) {
        console.log(`⚠️ Requested ${minutesBefore} minutes, but only ${availableMinutes} are available.`);
        minutesBefore = availableMinutes;
      }

      console.log(`\n📜 Fetching messages from the last ${minutesBefore} minutes...`);
      const messages = await fetchMessages(client, chatId, minutesBefore);

      if (messages.length === 0) {
        console.log("\n❌ No previous messages found.");
      } else {
        console.log("\n✅ Messages Retrieved:");
        messages.forEach((msg) => console.log(msg));
      }
    } else if (mode === "3") {
      console.log("\n📌 Fetching unread chat groups...");
      const dialogs = await client.getDialogs();
      const unreadChats = dialogs.filter((chat) => chat.unreadCount > 0);

      if (unreadChats.length === 0) {
        console.log("\n✅ No unread messages.");
      } else {
        console.log("\n📨 Unread Chats:");
        unreadChats.forEach((chat, index) => {
          console.log(`[${index + 1}] ${chat.title} (Unread: ${chat.unreadCount})`);
        });

        const choice = await input.text("Enter chat number to view unread messages: ");
        if (!choice || isNaN(choice) || choice < 1 || choice > unreadChats.length) {
          console.log("❌ Invalid selection.");
        } else {
          const selectedChat = unreadChats[choice - 1];
          console.log(`\n📜 Fetching unread messages from: ${selectedChat.title}...`);
          const messages = await fetchMessages(client, selectedChat.id, 30);
          messages.forEach((msg) => console.log(msg));
        }
      }
    } else if (mode === "4") {
      const chatId = await selectChat(client);
      console.log("\n📌 Fetching past 70 messages and user list...");
      const messages = await fetchMessages(client, chatId, 70);
      const usernames = await fetchUsernames(client, chatId);
      console.log("\n📌 Sending question to Gemini...");
      const question = await input.text("Enter your question about the chat: ");
      const answer = await askGeminiQuestion(question, messages, usernames);
      console.log("\n🤖 Gemini's Answer:", answer);
    } else if (mode === "5") {
      console.log("\n👋 Exiting...");
      process.exit();
    } else {
      console.log("❌ Invalid choice. Try again.");
    }
  }
})();

async function askGeminiQuestion(question, messages, usernames) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          role: "user",
          parts: [{
            text: `Usernames in chat: ${usernames.join(", ")}\nChat context:\n${messages.slice(-70).join("\n")}\n\nQuestion: ${question}`
          }]
        }]
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    return "Failed to get an answer.";
  }
}

async function fetchUsernames(client, chatId) {
  const messages = await client.getMessages(chatId, { limit: 70 });
  const users = new Set();
  for (const msg of messages) {
    if (msg.senderId) {
      const sender = await client.getEntity(msg.senderId);
      users.add(sender.username || sender.firstName || "Unknown User");
    }
  }
  return Array.from(users);
}

async function fetchMessages(client, chatId, limit) {
  const messages = await client.getMessages(chatId, { limit });
  return messages.map(msg => `${new Date(msg.date * 1000).toLocaleString()} - ${msg.message}`);
}

async function selectChat(client) {
  console.log("\n📌 Fetching chat list...");
  const dialogs = await client.getDialogs();
  dialogs.forEach((chat, index) => {
    console.log(`[${index + 1}] ${chat.title}`);
  });
  const choice = await input.text("Enter chat number: ");
  if (!choice || isNaN(choice) || choice < 1 || choice > dialogs.length) {
    console.log("❌ Invalid selection.");
    return null;
  }
  return dialogs[choice - 1].id;
}
