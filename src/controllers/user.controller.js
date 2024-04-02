import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import uploadCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"


//REVIEW: Creating a seperate method for access token and refressh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // find the user
        await User.find(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //    adding refresh token in database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong  while generating refresh and access token")
    }
}


// REVIEW: Register Controller
const registerUser = asyncHandler(async (req, res) => {

    /*REVIEW : Algorithm for register
       >>get user detials from frontend
       >>validation
       >>check if user already exists: username,email
       >>check for images , check for avatar
       >>upload them on cloudinary
       >>create user object - create entry in DB
       >>remove pass and refresh token field from response
       >>check for user creation
       >>return res
   */

    const { fullName, email, username, password } = req.body
    // console.log("email:", email)

    /*   REVIEW :beginer method
    if(fullName === "")
    {
            throw ApiError(400,"Full name is required")
    }
    */
    if (
        [fullName, email, username, password].some((field) => field?.trim === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // Checking the existing user
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }
    // console.log(req.files);

    // avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // coverImage 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload to cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // If User succesfully created then push into stack by creating User.
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // Not to get the selected fields as output as recieved value
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    let coverImagelocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})


// REVIEW: Login Controller
const loginUser = asyncHandler(async (req, res) => {
    // req body-> data
    //  username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    // res send

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "Username or Password is required")
    }

    // find the user if registered
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    // checkpoint does not exist
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // checking the valid password
    const isPasswordValid = await user.isPasswordCorrect(password)

    //    checkpoint does not match
    if (!user) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // Optional step
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await  User.findById(user._id)
    select("-password -refreshToken")
    
    //    sending in cookies
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json
    (
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User LoggedIn Successfully"
        )
    )
})

// REVIEW: logout Controller
const logoutUser = asyncHandler(async(req,res)=>{
        // remove cookie
        //remove refresh Token

       
})


export {
    registerUser,
    loginUser
}