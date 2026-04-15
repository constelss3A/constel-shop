const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  googleSub:    { type: String, index: true, unique: true, sparse: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  firstName:    { type: String, default: '' },
  lastName:     { type: String, default: '' },
  avatar:       { type: String, default: '' },
  role:         { type: String, enum: ['Admin', 'Client', 'User'], default: 'Client' },
  provider:     { type: String, enum: ['local', 'google'], default: 'local' },
  passwordHash: { type: String, default: null },
}, { timestamps: true });

module.exports = model('User', userSchema);
