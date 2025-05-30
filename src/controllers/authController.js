import axios from 'axios';
import User from '../models/user.model.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import jwt from 'jsonwebtoken';
import { clientId, clientSecret, redirectUri, apiUrl } from '../config/discord.js';
import Guild from '../models/guild.model.js';
import sendEmail from '../services/transporter.js';
import { StatusCode } from '../services/constants/statusCode.js';
import ApiResponse from '../utils/api-response.js';
import ApiError from '../utils/api-error.js';
import { upsertGuildsAndGetIds } from '../utils/upsertGuilds.js';

async function refreshDiscordToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('redirect_uri', redirectUri);

  const { data } = await axios.post(`${apiUrl}/oauth2/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data; // includes new access_token and refresh_token
}

export const discordAuth = (req, res) => {
  const scope = 'identify email guilds';
  const discordAuthUrl = `${apiUrl}/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

  return res.redirect(discordAuthUrl);
}

export const discordCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) return res
  .status(StatusCode.BAD_REQUEST)
  .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "Missing authorization code", ));

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

    const accessToken = tokenData.access_token ;
    const refreshToken = tokenData.refresh_token ;
    // 2. Fetch user data from Discord
    const { data: userData } = await axios.get(`${apiUrl}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 4. Fetch user guilds
    const { data: guildsData } = await axios.get(`${apiUrl}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 5. Save or update user
    const guildIds  = await upsertGuildsAndGetIds(guildsData);

    // 2. Now create or update the user
    let user = await User.findOne({ discordId: userData.id });

    if (!user) {
      user = await User.create({
        discordId: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        globalName: userData.global_name,
      });
    }
    user.guilds = guildIds;
    user.discordAccessToken = encrypt(accessToken) ;
    user.discordRefreshToken = encrypt(refreshToken) ;
    await user.save();

    // Send welcome email 
   
     sendEmail(user.email, 'Welcome to Team Builder', `Hello ${user.username},\n\nWelcome to Team Builder! We're excited to have you on board.\n\nBest regards,\nTeam Builder`  );
    
    
    // 6. Set user data in cookie
    const token = jwt.sign(
      { id: user._id, username: user.username, avatar: user.avatar },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

   // 7. Set cookie with JWT token
   res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',// Set to true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' :  'Strict', 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
   
    // Convert to milliseconds
  });

    return res.redirect(process.env.FRONTEND_URL + '/dashboard');
    
  } catch (error) {
    console.error(error.response?.data || error);
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Discord authentication failed", [error.message], error.stack);
  }
};

export const getMe = async (req, res) => {
    try {
      const userCookie = req.cookies.token;
      if (!userCookie) {
        return res
        .status(StatusCode.UNAUTHORIZED)
        .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized",) );
      }

      // Decode the JWT token to get user info
      const decodedToken = jwt.verify(userCookie, process.env.JWT_SECRET);
      if (!decodedToken) {
        return res
        .status(StatusCode.UNAUTHORIZED)
        .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized",) );
        
      }

      // Fetch user data from the database
      const userData = await User.findById(decodedToken.id).select('-guilds');
      if (!userData) {
        return res
        .status(StatusCode.NOT_FOUND)
        .json(new ApiResponse(StatusCode.NOT_FOUND, false, "User not found",) );  
      }
     
      // Return user data 
      return res
      .status(StatusCode.OK)
      .json(new ApiResponse(StatusCode.OK, true, "User info fetched successfully", userData));
    } catch (error) {
      console.error(error);
      throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch user info", [error.message], error.stack); 
    }
};

// get user guilds
export const getUserGuilds = async (req, res) => {
  try {
    const userCookie = req.cookies.token;
    if (!userCookie) {
      return res
      .status(StatusCode.UNAUTHORIZED)
      .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized",) );
    }

    // Decode the JWT token to get user info
    const decodedToken = jwt.verify(userCookie, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res
      .status(StatusCode.UNAUTHORIZED)
      .json(new ApiResponse(StatusCode.UNAUTHORIZED, false, "Unauthorized",) );
    }

    // Fetch user data from the database
    const user = await User.findById(decodedToken.id)
    if (!user || !user.discordAccessToken) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json(new ApiResponse(StatusCode.NOT_FOUND, false, "User or access token not found"));
    }

    // Fetch latest guilds from Discord API
    
    let accessToken = decrypt(user.discordAccessToken) ;

    // Try initial request
    let guildsData;
    try {
        const { data } = await axios.get(`${apiUrl}/users/@me/guilds`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        guildsData = data;
      } catch (error) {
        if (err.response?.status === 401) {
        // Refresh the token
        const newTokenData = await refreshAccessToken(decrypt(user.discordRefreshToken));
        user.discordAccessToken = encrypt(newTokenData.access_token);
        user.discordRefreshToken = encrypt(newTokenData.refresh_token);
        await user.save();

        // Retry the API call
        const { data: guildsData } = await axios.get(`${apiUrl}/users/@me/guilds`, {
          headers: { Authorization: `Bearer ${newTokenData.access_token}` },
        });
        guildsData = data;
       
      } else {
        throw err;
      }
    }

    const guildIds  = await upsertGuildsAndGetIds(guildsData);
    user.guilds = guildIds;
    await user.save();

    // Return user guilds
    const updatedGuilds = await Guild.find({ _id: { $in: guildIds } });
    return res
    .status(StatusCode.OK)
    .json(new ApiResponse(StatusCode.OK, true, "User guilds fetched successfully", updatedGuilds));
  } catch (error) {
    console.error(error);
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch user guilds", [error.message], error.stack);}
};

// Logout function to clear the cookie
export const logout = (req, res) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("User logging out:", decoded.username || decoded.id);
    } else {
      console.log("No token found. Maybe already logged out.");
      return res
      .status(StatusCode.BAD_REQUEST)
      .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "No token found", ));
    }
  
  res.clearCookie('token');
  return res
  .status(StatusCode.OK)
  .json(new ApiResponse(StatusCode.OK, true, "Logged out successfully", ));
  } catch (err) {
    console.error("Error decoding token during logout:", err.message);
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Logout failed", [err.message], err.stack);
  }
};
