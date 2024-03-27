// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './env'
})



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed!! ", err)
    })


/*
// IIFE Function  
// IIFE (Immediately Invoked Function Expression) : function that runs the moment it is invoked or called in the JavaScript event loop
; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERR:",error);
            throw error
        })

// Server Live code
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on Port ${process.env.PORT}`);
        })
    } 
    catch (error) {
        console.log("ERROR", error)
        throw err
    }
})()
*/