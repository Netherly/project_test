const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function todayYMD_EuropeWarsaw() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' })
}

async function copyLatestToDate(ymd) {
  const latest = await prisma.rates.findFirst({
    orderBy: { date: 'desc' }
  })
  if (!latest) return false
  await prisma.rates.create({
    data: {
      date: ymd,
      value: latest.value
    }
  })
  return true
}

module.exports = { todayYMD_EuropeWarsaw, copyLatestToDate }
