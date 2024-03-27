import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))

// TODO :Configuration of Middleware
// Middleware to accept the json data
app.use(express.json({limit:"16kb"}))
// middle configuration for handling the urls that could include +,% etc.
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// Public assets
app.use(express.static("public"))

app.use(cookieParser())



export default app