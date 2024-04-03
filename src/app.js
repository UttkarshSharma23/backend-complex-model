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

// REVIEW :Configuration of Middleware
// Middleware to accept the json data
app.use(express.json({limit:"16kb"}))
// middle configuration for handling the urls that could include +,% etc.
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// Public assets
app.use(express.static("public"))

app.use(cookieParser())

//REVIEW: Routes import 
import userRouter from "./routes/user.routes.js"


// REVIEW: Routes Declartion for User
app.use("/api/v1/users",userRouter)
// http://localhost:8000/api/v1/users/register

export default app