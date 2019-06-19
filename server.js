require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const Storage = require("./db");
const Utils = require("./utils");
const config = require("./config");
const DB = new Storage();

const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`;

const app = express();
const socket = require("express-ws")(app);

const metascraper = require("metascraper")([
  require("metascraper-author")(),
  require("metascraper-description")(),
  require("metascraper-image")(),
  require("metascraper-title")(),
  require("metascraper-url")()
]);

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const showError = error => {
  console.error(error);
};

const reply = (chat_id, text) => {
  return axios.post(TELEGRAM_URL, { chat_id, text });
};

const onStorageResponse = response => {
  console.log("Saved!", response);
};

const extractMetadata = text => {
  let urls = Utils.extractURLS(text);
  let tags = Utils.extractTags(text);

  let cleanText = Utils.removeFromText(text, Utils.prependHashtags(tags), urls);
  let quote = Utils.extractQuote(cleanText);
  let comment = Utils.removeFromText(cleanText, [quote]);

  text = quote || cleanText;

  return { text, urls, tags, comment, quote };
};

const handleText = message => {
  let metadata = extractMetadata(message.text);

  if (metadata.text === "/start") {
    reply(
      message.chat.id,
      config.TEXTS.start.replace("{u}", message.from.first_name)
    );
  } else if (metadata.text === "/help") {
    reply(message.chat.id, config.TEXTS.commands);
  } else if (metadata.text === "/ping") {
    socket.getWss().clients.forEach(client => {
      client.send(JSON.stringify({ ping: true }));
    });
  } else if (metadata.urls && metadata.urls.length) {
    storeURLS(message, metadata);
  } else if (metadata.quote) {
    // storeQuote(message, metadata)
  }
};

const storeQuote = (message, data) => {
  data.user = message.from.username;
  data.room = message.chat.title;
  data.type = "quote";

  Storage.store(data, onStorageResponse);

  if (message.chat.type === "private") {
    reply(message.chat.id, data);
  }
};

const handleAvatar = message => {
  handlePhoto(message, message.new_chat_photo);
};

const handlePhoto = (message, photo = undefined) => {
  let text = message.caption;
  let tags = Utils.extractTags(text);
  let urls = Utils.extractURLS(text);

  photo = !photo ? message.photo : photo;

  let file_id = photo[photo.length - 1].file_id;
  let url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/getFile?file_id=${file_id}`;

  const onGetResponse = response => {
    let user = message.from.username;
    let room = message.chat.title;
    let comment = Utils.removeFromText(text, Utils.prependHashtags(tags), urls);
    let type = "image";
    let text = "";

    let url = `https://api.telegram.org/file/bot${TELEGRAM_API_KEY}/${
      response.data.result.file_path
    }`;

    Storage.store(
      { url, text, type, comment, tags, room, user },
      onStorageResponse
    );
  };

  axios.get(url).then(onGetResponse);
};

const storeURLS = (message, data) => {
  let username = message.from.username;
  let room = message.chat.title;
  let type = "website";

  data.urls.forEach(url => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }

    axios
      .get(url)
      .then(async response => {
        const html = response.data;
        const metadata = await metascraper({ html, url });

        const author = metadata.author;
        const title = metadata.title;
        const description = metadata.description;

        DB.createLink({ author, title, description, url, username });

        socket.getWss().clients.forEach(client => {
          client.send(
            JSON.stringify({ author, url, title, description, url, username })
          );
        });
      })
      .catch(e => {
        console.log(e);
      });
  });
};

const onGetLinks = (request, response) => {
  DB.getLinks()
    .then(links => {
      response.json({ links });
    })
    .catch(e => {
      response.json({ links: [] });
    });
};

const onMessage = (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.end();
  }

  if (message.photo) {
    handlePhoto(message);
  } else if (message.new_chat_photo) {
    handleAvatar(message);
  } else if (message.text) {
    handleText(message);
  }

  res.end("ok");
};

const onRoot = (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
};

const onReset = (request, response) => {
  if (request.query.secret === process.env.SECRET) {
    DB.recreateDatabase().then(() => {
      response.json({ ok: true });
    });
  } else {
    response.json({ ok: false });
  }
};

app.get("/", onRoot);
app.get("/reset", onReset);
app.get("/api/links", onGetLinks);
app.post("/message", onMessage);

app.ws("/", (ws, req) => {
  ws.on("message", message => {
    console.log("Message", JSON.parse(message));
  });
});

const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
