const express = require("express");
const bodyParser = require("body-parser"); // used to parse the request body
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// moderates comments and sends the approval/rejection status to the event handler
app.post("/events", async (req, res) => {
  const {type, data} = req.body

  if (type === 'CommentCreated') {
    const status = data.content.includes('orange') ? 'rejected' : 'approved'

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentModerated',
      data: {
        id: data.id,
        postId: data.postId,
        status,
        content: data.content
      }
    })
  }

  res.send({})
});

app.listen(4003, () => {
  console.log("Listening on 4003");
});
