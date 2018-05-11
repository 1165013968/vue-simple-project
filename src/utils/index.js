function decode (value) {
  try {
    return decodeURIComponent(value)
  } catch (e) {
    console.log('error')
  }
}
function parse (str) {
  let obj = {}
  let pairs = str.split(/ *; */)
  let pair
  if (pairs[0] === '') return obj
  for (let i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=')
    obj[decode(pair[0])] = decode(pair[1])
  }
  return obj
}

function all (cookie) {
  let str
  try {
    str = cookie || document.cookie
  } catch (err) {
    return {}
  }
  return parse(str)
}

export function getCookie (cookie, name) {
  return all(cookie)[name]
}

export function getToken (name) {
  let cookie
  try {
    cookie = window.top && window.top.document.cookie
  } catch (e) {
    cookie = ''
  }
  return getCookie(cookie, name) || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkNmRhODBiZi00MTAwLTQ1YzUtODZjNy02Y2E1N2UwZjc2MCIsImlzcyI6IkJpZ0V5ZSIsImV4cCI6MTYxMjE2OTQzMH0.j8l2-GE0V5b_bohnfPYMXYn9YTN_nBtgGFgK2TilZUE'
}
