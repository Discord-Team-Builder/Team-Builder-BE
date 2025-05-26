// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { StatusCode } from '../services/constants/statusCode.js';
import ApiResponse from '../utils/api-response.js';
import ApiError from '../utils/api-error.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
      .status(StatusCode.UNAUTHORIZED)
      .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally, fetch user from DB
    const user = await User.findById(decoded.id).select('-__v -password');
    if (!user) {
      return res
      .status(StatusCode.UNAUTHORIZED)
      .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized: User not found"));
    }

    // Attach user to request for future use
    req.user = user;

    next(); // move to next middleware or route
  } catch (error) {
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      "Failed to authenticate user",
      [error.message],
      error.stack
    );
  }
};

export default authMiddleware;
