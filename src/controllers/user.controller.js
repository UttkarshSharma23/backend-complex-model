// *-----------------------------------------------------------------import files----------------------------------------------------------------*
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import uploadCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
// *-------------------------------------------------------------Import ends here-----------------------------------------------------------------*


// *------------------------------REVIEW: Creating a separate method for access token and refresh token ------------------------------------------*
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // find the user
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // adding refresh token in database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
}
// *-------------------------------------------------End of access token and refresh token -------------------------------------------------------*


// *-----------------------------------------------------REVIEW: Register Controller -------------------------------------------------------------*
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
    console.log(req.files);

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
// *-------------------------------------------------------End of Register Controller ------------------------------------------------------------*


// *-----------------------------------------------------REVIEW: Login Controller ---------------------------------------------------------------*
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    let user;
    if (email) {
        // Find user by email
        user = await User.findOne({ email });
    } else {
        // Find user by username
        user = await User.findOne({ username });
    }

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    // Optional step: Select only required fields to send to the client
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // Set options for cookies
    const options = {
        httpOnly: true,
        secure: true // Make sure to set this to 'true' only if you are using HTTPS
    }

    // Send cookies and response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))
})
// *----------------------------------------------------------End of LogIn Controller -----------------------------------------------------------*


// *-----------------------------------------------------REVIEW: Logout Controller ---------------------------------------------------------------*
const logoutUser = asyncHandler(async (req, res) => {
    // remove cookie
    //remove refresh Token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // updates the field
            $set:
            {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})
// *----------------------------------------------------------End of Logout Controller -----------------------------------------------------------*


// *-----------------------------------------------REVIEW: Refresh Access Token End-point -------------------------------------------------------*
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        // capture the token
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request")
        }

        // verify the token
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )

        // Getting the token from mongo database.
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        // checking the refreshtoken and incoming token
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accesToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})
// *---------------------------------------------------End of Refresh Access Token End-point -----------------------------------------------------*


// *-----------------------------------------------REVIEW: Update Current Password ---------------------------------------------------------------*
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200, {}, "Password is Changed"))
})
// *-----------------------------------------------------End of Update Current Password ----------------------------------------------------------*


// *-----------------------------------------------REVIEW: Current User --------------------------------------------------------------------------*
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "current user fetched successfully")
})
// *-----------------------------------------------------End of Current User----------------------------------------------------------------------*


// *-----------------------------------------------REVIEW: Update Account Details ---------------------------------------------------------------*
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
   const user =  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details updated successfully"))
})
// *-----------------------------------------------------End of Update Account Details ----------------------------------------------------------*


// *-----------------------------------------------REVIEW: Update Avatar Update ---------------------------------------------------------------*
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    // databse store direct

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
        )
        .select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar Updated successfully"))
})
// *-----------------------------------------------------End of Avatar Update --------------------------------------------------------------------*


// *-----------------------------------------------REVIEW: Update CoverImage Update --------------------------------------------------------------*
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    // databse store direct

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image files is missing")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the Image")
    }

   const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
        )
        .select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Cover Image Updated successfully"))
})
// *-----------------------------------------------------End of CoverImage Update-----------------------------------------------------------------*



// Export files
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}