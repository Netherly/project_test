const prisma = require('../../prisma/client');

const genCode = (len = 6) =>
  Math.floor(10**(len-1) + Math.random() * 9*10**(len-1)).toString();

async function handleTelegramUpdate(req, res) {
  const update = req.body;
  const msg = update.message;
  if (!msg) return res.sendStatus(200);

  const tgUserId = msg.from.id;
  const tgChatId = msg.chat.id;
  const tgUsername = msg.from.username || null;

  const code = genCode(6);
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  const existing = await prisma.telegramLinkTicket.findFirst({
    where: { tgUserId: BigInt(tgUserId), consumedAt: null }
  });

  if (existing) {
    await prisma.telegramLinkTicket.update({
      where: { id: existing.id },
      data: { code, expiresAt: expires, tgChatId: BigInt(tgChatId), tgUsername }
    });
  } else {
    await prisma.telegramLinkTicket.create({
      data: {
        code,
        tgUserId: BigInt(tgUserId),
        tgChatId: BigInt(tgChatId),
        tgUsername,
        expiresAt: expires
      }
    });
  }

 
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: tgChatId,
      text: `Код для регистрации: ${code}\nДействует 15 минут. Введите его в форме регистрации.`
    })
  });

  res.sendStatus(200);
}

module.exports = { handleTelegramUpdate };
