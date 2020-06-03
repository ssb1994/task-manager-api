const express = require('express')
require('./db/mongoose')
const cors = require('cors');
const userRouter = require('./router/user')
const taskRouter = require('./router/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)
app.use(cors())



app.listen(port, () => {
    console.log('Server is up on port ' + port)
})