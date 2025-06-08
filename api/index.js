// api/index.js

// প্রয়োজনীয় লাইব্রেরি ইম্পোর্ট করা হচ্ছে
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config(); // .env ফাইল থেকে ভ্যারিয়েবল লোড করার জন্য

// .env ফাইল থেকে টোকেন এবং ওনার আইডি নেওয়া হচ্ছে
// Vercel এ ডিপ্লয় করার সময় এগুলোকে Environment Variables হিসেবে সেট করতে হবে
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.OWNER_CHAT_ID;

// বট ইনস্ট্যান্স তৈরি করা
const bot = new TelegramBot(TOKEN);

// Express অ্যাপ তৈরি করা
const app = express();

// JSON পার্স করার জন্য মিডলওয়্যার
app.use(express.json());

// Vercel এর জন্য Webhook সেট করা
// এই কোডটি স্বয়ংক্রিয়ভাবে Vercel URL ব্যবহার করে ওয়েব হুক সেট করবে
const VERCEL_URL = process.env.VERCEL_URL;
const webhookUrl = `https://${VERCEL_URL}/api/index`;
bot.setWebHook(webhookUrl);

// টেলিগ্রাম থেকে আসা আপডেটের জন্য রুট
// এই রুটে টেলিগ্রাম POST রিকোয়েস্ট পাঠাবে
app.post('/api/index', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); // টেলিগ্রামকে জানানো যে মেসেজ পাওয়া গেছে
});

console.log('Bot server started...');

// --- মূল বট লজিক ---

// যেকোনো ধরনের মেসেজ শোনার জন্য
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // ওনারের (আপনার) মেসেজ চেক করা হচ্ছে
  // যদি মেসেজটি আপনার হয় এবং এটি কোনো মেসেজের রিপ্লাই হয়
  if (chatId.toString() === OWNER_ID && msg.reply_to_message) {
    
    // চেক করা হচ্ছে যে রিপ্লাই করা মেসেজটি একটি ফরোয়ার্ডেড মেসেজ কিনা
    if (msg.reply_to_message.forward_from) {
      const originalCustomerId = msg.reply_to_message.forward_from.id;

      // কাস্টমারকে রিপ্লাই পাঠানোর জন্য বিভিন্ন মেসেজ টাইপ হ্যান্ডেল করা
      if (msg.text) {
        bot.sendMessage(originalCustomerId, msg.text);
      } else if (msg.photo) {
        // সবচেয়ে ভালো কোয়ালিটির ছবিটি পাঠানো হচ্ছে
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        bot.sendPhoto(originalCustomerId, fileId, { caption: msg.caption });
      } else if (msg.audio) {
        bot.sendAudio(originalCustomerId, msg.audio.file_id, { caption: msg.caption });
      } else if (msg.document) {
        bot.sendDocument(originalCustomerId, msg.document.file_id, { caption: msg.caption });
      } else if (msg.video) {
        bot.sendVideo(originalCustomerId, msg.video.file_id, { caption: msg.caption });
      } else if (msg.voice) {
        bot.sendVoice(originalCustomerId, msg.voice.file_id, { caption: msg.caption });
      } else if (msg.sticker) {
        bot.sendSticker(originalCustomerId, msg.sticker.file_id);
      } else {
        bot.sendMessage(originalCustomerId, "দুঃখিত, অ্যাডমিন একটি অসমর্থিত ফাইল টাইপ পাঠিয়েছেন।");
      }
    }
  }
  // যদি মেসেজটি কোনো কাস্টমারের হয়
  else if (chatId.toString() !== OWNER_ID) {
    // কাস্টমারের মেসেজটি ওনারকে ফরোয়ার্ড করা হচ্ছে
    // এই ফরোয়ার্ড মেসেজটিই আসল প্রেরকের তথ্য বহন করে, যা রিপ্লাই করার জন্য জরুরি
    bot.forwardMessage(OWNER_ID, chatId, msg.message_id);

    // ওনারকে একটি নির্দেশনামূলক মেসেজ পাঠানো হচ্ছে
    bot.sendMessage(OWNER_ID, `☝️ এই মেসেজে রিপ্লাই করে গ্রাহকের সাথে কথা বলুন।\nগ্রাহকের আইডি: ${chatId}`);
  }
});


// '/start' কমান্ড হ্যান্ডেল করা
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== OWNER_ID) {
        bot.sendMessage(chatId, "স্বাগতম! আপনার প্রশ্ন বা বার্তা পাঠান, আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবে।");
    } else {
        bot.sendMessage(chatId, "অ্যাডমিন প্যানেলে স্বাগতম! গ্রাহকদের মেসেজ এখানে ফরোয়ার্ড করা হবে।");
    }
});


// Vercel সার্ভারলেস ফাংশনের জন্য অ্যাপ এক্সপোর্ট করা
module.exports = app;
