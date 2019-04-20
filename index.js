require("dotenv").config();

const express = require("express");
const app = express();

const eStatics = require("e-statics")(app);
app.use(eStatics.counter);

const bodyParser = require("body-parser");
const morgan = require("morgan");
const crypto = require("crypto");
const mongoose = require("mongoose");
var validUrl = require("valid-url");

var uri = process.env.mongourl;

//mongoose.connect(uri,{autoReconnect:true});
const urlSchema = mongoose.model("Url", {
  short: String,
  url: String,
  hits: Number
});
setTimeout(function() {
  mongoose.connect(uri,function(err,succ){
      if(err){
          console.log("Error connecting to MongoDB:");
          throw new Error(err);
      }

      console.log("succesfully connected to mongodb")
  });
}, 10000);

app.use(bodyParser.json());
app.use(morgan("tiny"));

// Health check
app.get('/healthcheck', (req, res) => res.send());

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
app.post("/new",(req, res) => {
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
app.get("/:id",(req, res) => {
  urlSchema.findOneAndUpdate(
    { short: req.params.id },
    { $inc: { hits: 1 } },
    (err, url) => {
      res.redirect(url.url);
    }
  );
});
app.use("/", express.static("public"));
var port = process.env.PORT || 8088;
app.listen(port, () => {
  console.log("Server started at port %i", port);
});
