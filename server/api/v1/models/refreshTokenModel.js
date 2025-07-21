const mongoose= require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index:true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index:true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
    index:true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ip:{
    type: String,
    default: '',
  },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('RefreshToken', refreshTokenSchema);