let on = require('sendevent'),
  parse = require('./url'),
  find = require('./find'),
  replace = require('./replace'),
  connectionLost = require('./connectionLost')

let token
let latestHeartbeatTime

on('/instant/events', (ev) => {
  if (ev.token) {
    if (!token) token = ev.token
    if (token != ev.token) return location.reload()
    setInterval(() => {
      if (latestHeartbeatTime) {
        const diff = Date.now() - latestHeartbeatTime
        if (diff > 1000 * 12) connectionLost()
      }
    }, 1000 * 10)
  }

  if (typeof ev.heartbeat === 'number') {
    latestHeartbeatTime = Date.now()
  }

  // reload page if it contains an element with the given class name
  if (ev.className) {
    if (find.byClass(ev.className)) location.reload()
    return
  }

  // reload page if it contains an element that matches the given selector
  if (ev.selector) {
    if (find.bySelector(ev.selector)) location.reload()
    return
  }

  // resolve the URL
  const url = parse(ev.url)

  // Remove query and hash strings
  const normalizedLocationHref = location.href.split('#')[0].split('?')[0]

  // reload the page
  if (url.href.replace('index.html', '') == normalizedLocationHref) {
    location.reload()
    return
  }

  // look for a stylesheet
  let el = find.byURL('link', 'href', url)
  if (el) return replace(el, `${url.pathname}?v=${new Date().getTime()}`)

  // look for a script
  el = find.byURL('script', 'src', url)
  if (el) {
    location.reload()
    return
  }

  // If we're using script type="module" then reload on every js change
  console.log(url.href, parse.getExt(url.href))
  if (parse.getExt(url.href) === '.js') {
    el = find.bySelector('script[type=module]')
    console.log(el)

    if (el) {
      location.reload()
    }
  }
})
