const Airtable = require('airtable')

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_ENDPOINT = process.env.AIRTABLE_ENDPOINT
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_NAME
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE

Airtable.configure({
  endpointUrl: AIRTABLE_ENDPOINT,
  apiKey: AIRTABLE_API_KEY
})

let base = new Airtable({ AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)

const createStorage = () => {
 
  const store = ({ url, text, type, comment, tags, room, user }, callback) => {
    tags = (tags && tags.join(', ')) || ''
    
    let client = 'Telegram'
    
    if (!text || !text.length) { // todo: remove
      text = ''
    }
    
    base(AIRTABLE_TABLE).create({ url, text, type, comment, tags, client, room, user }, callback)
  }
  
  return {
    store
  }
}

module.exports = createStorage()