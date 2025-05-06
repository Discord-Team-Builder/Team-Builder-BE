// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
      .status(401)
      .json({ message: 'Unauthorized: No token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally, fetch user from DB
    const user = await User.findById(decoded.id).select('-__v -password');
    if (!user) {
      return res
      .status(401)
      .json({ message: 'Unauthorized: User not found' })
    }

    // Attach user to request for future use
    req.user = user;

    next(); // move to next middleware or route
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export default authMiddleware;
