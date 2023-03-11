const express = require("express");
const bodyParser = require("body-parser"); // used to parse the request body
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];

  comments.push({ id: commentId, content, status: 'pending' });

  commentsByPostId[req.params.id] = comments;

  // sends a CommentCreated event to the event handler
  await axios.post("http://localhost:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending'
    },
  });

  res.status(201).send(comments);
});

// This is when the comments service gets a POST request from the event handler
// The req body will have data about the comment itself
app.post('/events', async (req, res) => {
  console.log('Received Event', req.body.type)

  const {type, data} = req.body

  if (type === 'CommentModerated') {
    const {postId, id, status, content} = data
    const comments = commentsByPostId[postId]

    const comment = comments.find(comment => {
      return comment.id === id
    })

    comment.status = status

    // Sends CommentUpdated event to the event handler
    await axios.post("http://localhost:4005/events", {
      type: 'CommentUpdated',
      data: {
        id, status, postId, content
      }
    }).catch((err) => {
      console.log(err.message);
    });
  }

  res.send({})
})

app.listen(4001, () => {
  console.log("Listening on 4001");
});
