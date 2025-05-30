import User from "../models/user.model.js"
import {StatusCode} from "../services/constants/statusCode.js"
import ApiResponse from "../utils/api-response.js"
import ApiError from "../utils/api-error.js"

export const UpdateProfile = async (req, res)=>{
  try {
    const userId = req.user._id
    const updateData = req.body

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser){
      return res
      .status(StatusCode.BAD_REQUEST)
      .json(new ApiResponse(StatusCode.BAD_REQUEST, false, 'User not found'), null)
    }

    return res
    .status(StatusCode.CREATED)
    .json(new ApiResponse(StatusCode.CREATED, true, 'Profile updated successfully', {updatedUser}))
  } catch (err) {
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, 'Something went wrong', [err.message], err.stack )
  }
}