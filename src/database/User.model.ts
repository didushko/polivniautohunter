import { model, Schema } from "mongoose";

export interface IUser extends Document {
  user_id: number;
  user_name?: string;
  first_request?: string;
  first_hunt?: string;
  last_hunt?: string;
  total_hunting: number;
}

const UserSchema = new Schema<IUser>({
  user_id: { type: Number, required: true },
  user_name: { type: String },
  first_request: { type: String },
  first_hunt: { type: String },
  last_hunt: { type: String },
  total_hunting: { type: Number, default: 0 },
});

const userModel = model<IUser>("User", UserSchema);

export default userModel;
