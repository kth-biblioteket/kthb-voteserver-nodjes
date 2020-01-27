require('dotenv').config()
const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const fs=require('fs');

const connection = require("./db.js");
const VerifyToken = require('./verifytoken');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var allowedOrigins = process.env.ALLOWEDORIGINS.split(",");
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      let msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.options('*', cors())

const apiRoutes = express.Router();

apiRoutes.get('/',cors(), function(req, res) {
	res.send('Hello! The API is at https://ref.lib.kth.se/vote/api/v1');
});

apiRoutes.get("/vote/:eventid",cors(), function(req , res, next){
    let sql = `SELECT votetypes.type, votes.votes FROM votes
    INNER JOIN votetypes
    ON votes.votetypeid = votetypes.id
    INNER JOIN events
    ON votes.eventid = events.id
    WHERE events.id = ?`

    let currentVotes = {};
    connection.query(sql, [req.params.eventid], function (error, results, fields) {
        if (error) throw error;
        results.forEach(function(row) {
          currentVotes[row.type] = row.votes;
        });
        let response = {};
        response["iotProperties"] = {
          "region":process.env.REGION,
          "accessKey":process.env.ACCESSKEY,
          "secretKey":process.env.SECRETKEY,
          "endpoint":process.env.ENDPOINT,
          "topic":process.env.TOPIC
        }
        response["currentVotes"] = currentVotes;
        res.json(response)
    });
    
});

apiRoutes.post("/vote", function(req, res) {
    io.emit("FromAPI", '{"category" : "' + req.body.category + '", "computerLocation" : "' + req.body.computerLocation + '" }')
    let sql = `UPDATE votes a
              INNER JOIN votetypes b
              ON b.id = a.votetypeid
              SET votes = votes + 1
              WHERE a.eventid = ?
              AND b.type = ?`
    connection.query(sql, [req.body.eventid,req.body.category], function (error, results, fields) {
        if (error) throw error;
    });
    res.json({'result': 'vote emitted'});
});

apiRoutes.post("/reminder", VerifyToken, async function(req, res) {

  require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };

  let htmlbody = require('./emails/confirm' + req.body.subcategory + '.html');

  let mailOptions = {
    from: '"KTH Bibliotekets löftesinsamling" <noreply@ref.lib.kth.se>',
    to: req.body.email,
    subject: 'Här kommer information om ditt lämnade löfte.',
    html: htmlbody,
    generateTextFromHTML: true
  };

  const transporter = nodemailer.createTransport({
    port: 25,
    host: process.env.SMTP_HOST,
    tls: {
      rejectUnauthorized: false
    }
    //requireTLS: true
    //secure: true
  });

  await transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log("error is " + error);
        res.json({'error': error});
    } 
    else {
        console.log('Email sent: ' + info.response);
        res.json({'result': 'mail sent to ' + req.body.email});
    }
  });

});

app.use('/vote/api/v1', apiRoutes);

const server = app.listen(process.env.PORT || 3002, function () {
    const port = server.address().port;
    console.log("App now running on port", port);
});

const io = socketIo(server);

io.on("connection", socket => {
  console.log("New client connected");
  console.log(socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    console.log(socket.id);
  });
});
