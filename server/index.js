const express = require('express');
const uuid = require('uuid');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const PORT = process.env.PORT || 3000;
const APP_ID = '01a2b22bf450409aa063ba49244a3659';
const APP_CERTIFICATE = 'fc4048d91f254fd0b8597de453559b99';
const app = express();

const nocache = (req, res, next) => {
  res.header('Cache-control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

const generateAccessToken = (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  let uid = req.query.uid;
  if (!uid || uid === '') uid = 0;
  const roleName = req.query.role;
  let role;
  if (!roleName || roleName === '')
    return res.status(500).json({ error: 'Role is required!' });
  if (roleName.toLowerCase() === 'subscriber') role = RtcRole.SUBSCRIBER;
  else if (roleName.toLowerCase() === 'publisher') role = RtcRole.PUBLISHER;
  else {
    return res.status(500).json({ error: 'Role is inavlid!' });
  }
  const expireTime = 10800;
  const currentTime = Math.floor(Date.now() / 1000);
  const privilageExpireTime = currentTime + expireTime;
  const channelName = uuid.v4();
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilageExpireTime
  );
  return res.json({ token: token, channel: channelName });
};

app.get('/access-token', nocache, generateAccessToken);

app.listen(PORT);
