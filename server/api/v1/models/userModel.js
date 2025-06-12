const mongoose= require('mongoose');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match:[/\S+@\S+\.\S+/, 'is invalid']
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    select: false
  },
  avatar:{
    type:String,
    default:''
  },
  role:{
    type:String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    default: ''
  },
  resetPasswordExpires: {
    type: Date,
    default: Date.now
  },

},{timestamps: true});

//Hide sensitive fields data
userSchema.set('toJSON', {
  transform: function (doc, ret,options) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

//Hash password before saving to the DB
userSchema.pre('save',async function (next){
    if(!this.isModified('password')) return next();
    this.password=await bcrypt.hash(this.password, 12);
    next();
});

//verify the password
userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
