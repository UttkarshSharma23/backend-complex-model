import asyncHandler from "../utils/asyncHandler.js"

const registerUser = asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"Uttkarsh is awesome"
    })
})

const loginUser = asyncHandler(async(req,res)=>{

})

export {registerUser, loginUser}