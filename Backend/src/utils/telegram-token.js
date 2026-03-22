function normalizeTelegramBotToken(value) {
  let token = String(value || '').trim();

  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }

  token = token.replace(/^\.+/, '');
  return token;
}

function getTelegramBotToken() {
  return normalizeTelegramBotToken(process.env.TELEGRAM_BOT_TOKEN);
}

module.exports = {
  normalizeTelegramBotToken,
  getTelegramBotToken,
};
