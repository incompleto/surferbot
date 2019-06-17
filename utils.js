const anchorme = require("anchorme").default

const REGEX_TAGS = /#(\w+)/gi
const REGEX_TAG = /#(\w+)/
const REGEX_QUOTE = /(^".+?")|(^'.+?')|(".+?"$)|('.+?'$)/gi

const createUtils = () => {
  let removeFromText = (text, ...arrays) => {
    if (!text) {
      return
    }

    let data = concatArrayOfArrays(arrays)

    data.forEach((d) => {
      let reg = new RegExp(d, 'gi')
      text = text.replace(reg, '');
    })

    return text
  }

  const extractQuote = (text) => {
    if (!text) {
      return []
    }

    let quotes = text.trim().match(REGEX_QUOTE)

    if (quotes && quotes.length) {
      return quotes[0]
    }

    return quotes
  }

  const extractTags = (text) => {
    if (!text) {
      return []
    }

    let matches = text.match(REGEX_TAGS)
    let tags = []

    if (matches && matches.length) {
      matches.forEach((m) => {
        let tag = m.match(REGEX_TAG)
        tags.push(tag[1] || tag[2])
      })
    }

    return tags
  }

  const extractURLS = (text) => {
    if (!text) {
      return []
    }

    return pluck(anchorme(text, { list: true }), 'raw')
  }

  const concatArrayOfArrays = (args) => {
    return args.reduce((acc, val) => [...acc, ...val])
  }

  const pluck = (array, key) => {
    return array.map(o => o[key])
  }

  const prependHashtags = (tags) => {
    return tags && tags.length ? tags.map((t) => { return '#' + t }) : []
  }

  return {
    concatArrayOfArrays,
    removeFromText,
    extractQuote,
    extractTags,
    extractURLS,
    pluck,
    prependHashtags
  }
}

module.exports = createUtils()