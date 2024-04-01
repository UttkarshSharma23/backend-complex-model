import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import uploadCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

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
    console.log("email:", email)

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User witu email or username exist")
    }

    // avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // coverImage 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload to cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath)
    const converImage = await uploadCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // Not to get the selected fields as output
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {

})

export { registerUser, loginUser }