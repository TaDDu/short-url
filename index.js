require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const crypto = require("crypto");
const mongoose = require("mongoose");
var validUrl = require("valid-url");
var uri = process.env.mongourl;

mongoose.connect(uri);
app.use(bodyParser.json());
app.use(morgan("tiny"));

const urlSchema = mongoose.model("Url", {
  short: String,
  url: String,
  hits: Number
});

app.route("/new/:url(*)").get((req, res) => {
  if (validUrl.isUri(req.params.url)) {
    var id = crypto.randomBytes(4).toString("hex");
    const url = new urlSchema({ short: id, url: req.params.url, hits: 0 })
      .save()
      .then(data => {
        res.json(data);
      });
  } else {
    res.json({ error: true, message: "not valid url" });
  }
});
app.route("/new").post((req, res) => {
  var id = crypto.randomBytes(4).toString("hex");
  const url = new urlSchema({ short: id, url: req.body.url, hits: 0 })
    .save()
    .then(data => {
      res.json(data);
    });
});
app.route("/statics/:id").get((req, res) => {
  urlSchema.findOne({ short: req.params.id }).then(urls => {
    res.json(urls);
  });
});
app.route("/:id").get((req, res) => {
  urlSchema.findOneAndUpdate(
    { short: req.params.id },
    { $inc: { hits: 1 } },
    (err, url) => {
      res.redirect(url.url);
    }
  );
});
var port = process.env.PORT || 8088;
app.listen(port, () => {
  console.log("Server started at port %i", port);
});
