import axios from 'axios';
import User from '../models/user.model.js';
import { clientId, clientSecret, redirectUri, apiUrl } from '../config/discord.js';

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

    // 3. Save or update user
    let user = await User.findOne({ discordId: userData.id });
    if (!user) {
      user = await User.create({
        discordId: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
      });
    }

    // 4. Set cookie or send token (You can use JWT here)
    res.cookie('user', JSON.stringify({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
    }), {
      httpOnly: true,
      secure: false, // production me true karna
    });

    return res.redirect(process.env.FRONTEND_URL + '/dashboard');

  } catch (error) {
    console.error(error.response?.data || error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const getMe = async (req, res) => {
    try {
      const userCookie = req.cookies.user;
      if (!userCookie) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const userData = JSON.parse(userCookie);
  
      return res.status(200).json({ user: userData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch user info' });
    }
  };