import { model, Schema } from "mongoose";

export interface ITracking extends Document {
  user_id: number;
  user_name: string;
  url: string;
  name: string;
  last_date_with_add: number;
  last_date: number;
}

const TrackingSchema = new Schema<ITracking>({
  user_id: { type: Number, required: true },
  user_name: { type: String, required: true },
  url: { type: String, required: true },
  name: { type: String, required: true },
  last_date_with_add: { type: Number, required: true },
  last_date: { type: Number, required: true },
});

const TrackingModel = model<ITracking>("Tracking", TrackingSchema);

export default TrackingModel;
