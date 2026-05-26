import mongoose, { Schema, model  } from 'mongoose';
import type {InferSchemaType} from 'mongoose';

const userAuthSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true } ,// Stored hashed
  isProfileCompleted : {type: Boolean, default: false}
}, { timestamps: true });

export type UserAuth = InferSchemaType<typeof userAuthSchema>;
export const UserModel = model('User', userAuthSchema);