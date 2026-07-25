const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'member',
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
