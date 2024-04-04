import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";
const router  = Router()

// REVIEW: Register Route
router.route("/register").post(
    // Middleware
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

// REVIEW: Login Route
router.route("/login").post(loginUser)

// REVIEW: Logout secured route
// secured routes with middleware
router.route("/logout").post(
    verifyJWT, 
    logoutUser)

// REVIEW: Refresh Access Token route
router.route("/refresh-token").post(refreshAccessToken)


export default router