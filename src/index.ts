import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
config()

const app = express()
const port = process.env.PORT || 8080

//middleware
app.use(express.json())
app.use(urlencoded({ extended: false }))

app.listen(port, () => {
    console.log(`Bytekode API is live on port: ${port}`)
})

// ping
app.get('/', (req, res) => {
    res.json({
        "message": "Service is active."
    })
})