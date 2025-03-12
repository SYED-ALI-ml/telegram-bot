# Telegram Chatbot with Real-time Message Retrieval

This project is a **Telegram chatbot** that allows users to interact with their Telegram chats in real-time, retrieve past messages, check unread messages, and even ask the **Gemini AI** for insights on chat conversations.

## 🚀 Features
- **Live Chat Mode:** Listens for real-time messages in a selected chat.
- **Previous Chats:** Fetches messages from the last 30 minutes.
- **Unread Chats:** Displays unread messages from various chats.
- **Gemini AI Integration:** Analyzes chat messages and answers user questions.
- **Interactive Menu:** Users can navigate through different modes easily.

## 📌 Prerequisites
- Node.js (>= 14.x)
- Telegram API credentials (API ID, API Hash, String Session)
- Gemini API Key

## 🔧 Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/telegram-chatbot.git
   cd telegram-chatbot
   ```
2. Install dependencies:
   ```sh
   npm install telegram input axios
   ```
3. Configure API credentials in the script:
   - Replace `apiId`, `apiHash`, `stringSession`, and `geminiApiKey` with your actual values.

## ▶️ Usage
Run the bot:
```sh
node bot.js
```

Follow the on-screen menu to select the desired mode.

## 📜 API Configuration
- Get **Telegram API credentials**: [my.telegram.org](https://my.telegram.org/)
- Get **Gemini API Key**: [Google AI Studio](https://ai.google.dev/)

## 🛠️ Roadmap
- Add support for more AI models
- Implement logging and database storage for chats
- Improve message filtering and response accuracy

## 📜 License
This project is licensed under the MIT License.

## 🤝 Contributing
Feel free to submit pull requests or suggest new features!

## 📞 Contact
For any issues or suggestions, reach out via GitHub Issues or Telegram.

