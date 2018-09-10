
const client = require('cheerio-httpcli')
const tough = require('tough-cookie')
const rp = require('request-promise')

const email = process.env.EMAIL
const password = process.env.PASSWORD
const apiKey = process.env.MACKREL_API_KEY

export async function run (context: any, mytimer: any) {
  const checkedCount = await sendCheckedcountToMackerel()
  console.log(new Date().toLocaleString(), checkedCount)
  context.done();
};

const fetchCheckedCount = async userToken => {
  const cookie = new tough.Cookie({
    key: 'user',
    value: userToken,
    path: '/',
    domain: 'techbookfest.org'
  })
  const jar = rp.jar()
  jar.setCookie(cookie, 'https://techbookfest.org')
  const opt = {
    url: 'https://techbookfest.org/api/circle/own',
    jar
  }
  const circles = JSON.parse(await rp(opt))
  const checkedCount = circles.filter(circle => circle.event.id === 'tbf05').map(circle => circle.checkedCount)[0]
  return checkedCount
}

const re = /^user=([^;]+)/

const signIn = async () => {
  const opt = {
    method: 'POST',
    uri: 'https://techbookfest.org/api/user/login',
    body: JSON.stringify({ email, password }),
    headers: {
      'content-type': 'application/json'
    },
    resolveWithFullResponse: true
  }
  const res = await rp(opt)
  const matched = re.exec(res.headers['set-cookie'][0])
  return matched[1]
}

const crawl = async () => {
  const userToken = await signIn()
  const checkedCount = await fetchCheckedCount(userToken)
  return checkedCount
}

const sendToMackerel = async checkedCount => {
    const opt = {
        method: 'POST',
        uri: 'https://api.mackerelio.com/api/v0/services/techbookfest/tsdb',
        body: JSON.stringify([{ name: "circleCheck5", time: Math.floor(new Date().getTime() / 1000), value: checkedCount }]),
        headers: {
          'content-type': 'application/json',
          'X-Api-Key': apiKey
        },
        resolveWithFullResponse: true
      }
    await rp(opt)
}
  
const sendCheckedcountToMackerel = async () => {
  const checkedCount = await crawl()
  await sendToMackerel(checkedCount)  
  return checkedCount
}
