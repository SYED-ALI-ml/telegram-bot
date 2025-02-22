const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const OpenAI = require("openai");

const apiId = 28924952;
const apiHash = "";
const savedSession = "";
const openaiApiKey = ""; // Replace with your OpenAI API Key
const stringSession = new StringSession(savedSession);
const openai = new OpenAI({ apiKey: openaiApiKey });

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
    console.log("5️⃣ Exit");

    const mode = await input.text("Enter choice (1-5): ");

    if (mode === "1") {
      const chatId = await selectChat(client);
      console.log("\n📡 Listening for real-time messages...");
      client.addEventHandler(async (event) => {
        if (event.message && event.message.chatId.value === chatId) {
          const sender = await client.getEntity(event.message.senderId);
          console.log(`\n💬 ${sender.username || sender.firstName}: ${event.message.message}`);
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
    }else if (mode === "4") {
      console.log("\n👋 Exiting...");
      process.exit();
    } else {
      console.log("❌ Invalid choice. Try again.");
    }
  }
})();

// **Helper Function: Fetch Messages**
async function fetchMessages(client, chatId, minutesBefore) {
  const messages = await client.getMessages(chatId, { limit: 100 });
  const currentTime = Math.floor(Date.now() / 1000);
  const filteredMessages = messages.filter((msg) => msg.date >= currentTime - minutesBefore * 60);

  return Promise.all(
    filteredMessages.map(async (message) => {
      const sender = await client.getEntity(message.senderId);
      const senderName = sender.username || sender.firstName || sender.id;
      return `\n🕒 ${new Date(message.date * 1000).toLocaleString()} | ${senderName}: ${message.message}`;
    })
  );
}

// **Helper Function: Select Chat**
async function selectChat(client) {
  const dialogs = await client.getDialogs();
  const chatList = dialogs.slice(0, 5).map((chat, index) => ({
    index: index + 1,
    id: chat.id.value,
    name: chat.title || "Private Chat",
  }));

  console.log("\n📌 Select a chat:");
  chatList.forEach((chat) => {
    console.log(`[${chat.index}] ${chat.name}`);
  });

  let chatId;
  while (!chatId) {
    const choice = await input.text("Enter choice (1-5 or chat ID): ");
    chatId = chatList[parseInt(choice) - 1]?.id || parseInt(choice, 10);
  }
  return chatId;
}

// **Helper Function: Summarize Chat**
async function summarizeChat(messages) {
  const chatText = messages.join("\n");
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: `Summarize this chat:\n${chatText}` }],
  });

  return response.choices[0].message.content.trim();
}
