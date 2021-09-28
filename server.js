const io = require('socket.io')(3001,{
    cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

io.on('connection', socket => {
  const id = socket.handshake.query.id
  socket.join(id)

  socket.on('send-message', ({recipients, text}) => {
    console.log("wet fish:", text, recipients, id)
    recipients.forEach(recipient=>{
      const newRecipents = recipients.filter(r => r !== recipient);
      newRecipents.push(id);
      socket.broadcast.to(recipient).emit('recieve-message', {
        recipients: newRecipents,
        sender: id,
        text
      })
    })
  })
})
