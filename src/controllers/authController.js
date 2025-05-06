import axios from 'axios';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { clientId, clientSecret, redirectUri, apiUrl } from '../config/discord.js';


export const discordAuth = (req, res) => {
  const scope = 'identify email guilds';
  const discordAuthUrl = `${apiUrl}/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

  return res.redirect(discordAuthUrl);
}

export const discordCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).json({ message: 'No code provided' });

  try {
    // 1. Exchange code for access token
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const { data: tokenData } = await axios.post(`${apiUrl}/oauth2/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const accessToken = tokenData.access_token;

    // 2. Fetch user data from Discord
    const { data: userData } = await axios.get(`${apiUrl}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 4. Fetch user guilds
    const { data: guildsData } = await axios.get(`${apiUrl}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

      console.log('User Data:', userData);
      console.log('Guilds Data:', guildsData);

    // 5. Save or update user
    let user = await User.findOne({ discordId: userData.id });
    
    if (!user) {
      user = await User.create({
        discordId: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        globalName: userData.global_name,
        guilds: guildsData.map(guild =>({
          guildId: guild.id,
          name: guild.name,
          icon: guild.icon,
          banner: guild.banner,
          owner: guild.owner,
          permissions: guild.permissions,
          permissions_new: guild.permissions_new,
          features: guild.features,
        }))
      });
    }

    // 6. Set user data in cookie
    const token = jwt.sign(
      { id: user._id, username: user.username, avatar: user.avatar },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

   // 7. Set cookie with JWT token
   res.cookie('token', token, {
    httpOnly: true,
    secure: false, // Set to true in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // Convert to milliseconds
  });

    return res.redirect(process.env.FRONTEND_URL + '/dashboard');

  } catch (error) {
    console.error(error.response?.data || error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const getMe = async (req, res) => {
    try {
      const userCookie = req.cookies.token;
      if (!userCookie) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Decode the JWT token to get user info
      const decodedToken = jwt.verify(userCookie, process.env.JWT_SECRET);
      if (!decodedToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch user data from the database
      const userData = await User.findById(decodedToken.id).select('-__v -password guilds');
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
     
      // Return user data 
      return res.status(200).json({user: userData});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch user info' });
    }
};

// get user guilds
export const getUserGuilds = async (req, res) => {
  try {
    const userCookie = req.cookies.token;
    if (!userCookie) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Decode the JWT token to get user info
    const decodedToken = jwt.verify(userCookie, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch user data from the database
    const userData = await User.findById(decodedToken.id).select('-__v -password');
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user guilds
    return res.status(200).json({ guilds: userData.guilds });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch user guilds' });
  }
};

// Logout function to clear the cookie
export const logout = (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("User logging out:", decoded.username || decoded.id);
    } else {
      console.log("No token found. Maybe already logged out.");
    }
  } catch (err) {
    console.error("Error decoding token during logout:", err.message);
  }

  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};
