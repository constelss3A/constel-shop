const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const User = require('../models/user');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'credential é obrigatório' });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(401).json({ error: 'E-mail Google não verificado' });
    }

    const { sub, email, name, given_name, family_name, picture } = payload;

    const buildResponseUser = u => ({
      id: u._id || u.id || sub,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`.trim(),
      picture: u.avatar,
      role: u.role,
    });

    const signToken = u => jwt.sign(
      { sub: (u._id || u.id || sub).toString(), email: u.email, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    if (mongoose.connection.readyState !== 1) {
      const stub = {
        id: sub,
        email,
        firstName: given_name || (name ? name.split(' ')[0] : ''),
        lastName:  family_name || (name ? name.split(' ').slice(1).join(' ') : ''),
        avatar: picture || '',
        role: 'Client',
      };
      return res.json({ token: signToken(stub), user: buildResponseUser(stub) });
    }

    let user = await User.findOne({ $or: [{ googleSub: sub }, { email }] });

    if (!user) {
      user = await User.create({
        googleSub: sub,
        email,
        firstName: given_name || (name ? name.split(' ')[0] : ''),
        lastName:  family_name || (name ? name.split(' ').slice(1).join(' ') : ''),
        avatar: picture || '',
        role: 'Client',
        provider: 'google',
      });
    } else if (!user.googleSub) {
      user.googleSub = sub;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    return res.json({ token: signToken(user), user: buildResponseUser(user) });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({ error: 'Credencial Google inválida' });
  }
});

module.exports = router;
