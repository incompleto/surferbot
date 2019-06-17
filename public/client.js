let $content

const get = (url) => {
  return window.fetch(url, {
    headers: HEADERS,
    method: 'get'
  })
}

const load = () => {
  document.body.classList.add('is-loading')
}

const stopLoading = () => {
  document.body.classList.remove('is-loading')
}

const shake = () => {
  document.body.classList.add('is-shaking')
  setTimeout(() => {
      document.body.classList.remove('is-shaking')
  }, 1000)
}

const getLinks = () => {
  load();
  
  get('/api/links').then((response) => {
    response.json().then((result) => {
      if (result.links) {
        result.links.forEach(addLink)
          setTimeout(() => {
            $content.classList.add('is-visible')  
            stopLoading()
          }, 350)
      }
    })
  }).catch(console.log)
}

const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

const onMessage = (message) => {
  let data = JSON.parse(message.data)
  
  if (data.ping) {
    shake()
  } else {
    addLink(data)
  }
}

const addLink = (data) => {
  load()
  
  let $el = document.createElement('div')
  $el.setAttribute('class', 'Link')  
  
  let $title = document.createElement('div')
  let $username = document.createElement('div')
  
  let $description = document.createElement('div')
  let $url = document.createElement('a')
  
  let $link = document.createElement('div')
  $link.setAttribute('class', 'Link__content')  
  $el.appendChild($link)
  
  $url.setAttribute('class', 'Link__title')  
  $url.href = data.url
  $url.textContent = data.title || data.url
  $link.appendChild($url)
  
  $description.setAttribute('class', 'Link__description')
  $description.textContent = data.description
  $link.appendChild($description)
 
  $username.setAttribute('class', 'Link__username')
  $username.textContent = `@${data.username}`
  $el.appendChild($username)
  
  $content.prepend($el)
  
  let elementHeight = $el.getBoundingClientRect().height
  $el.style.height = 0
  
  setTimeout(() => {
    $el.style.height = `${elementHeight}px`
    $el.classList.add('is-visible')  
    stopLoading()
    
    setTimeout(() => {
      $el.style.height = 'auto'
    }, 200)
    
  }, 300)
}

const setupSockets = function () {
  const href = window.location.href
  const URL = href.includes('localhost') ? href.replace('http', 'ws') : `wss://${window.location.hostname}`
  const socket = new WebSocket(URL)
  
  try {
    socket.onopen = () => {
      console.log('open socket')
    }

    socket.onmessage = onMessage

    socket.onclose = () => {
      console.log('closed socket')
    }

  } catch (exception) {
    console.error('Error socket:' + exception)
  }
}

const onLoad = () => {
  $content = document.body.querySelector('.js-content')
  setupSockets()
  getLinks()
}

window.onload = onLoad