import DatabaseConnection from "../database/DatabaseConnetion";
import TrackingModel from "../database/Tracking.model";

class TrackingService extends DatabaseConnection {
  addTracking = async (
    userId: number,
    userName: string,
    url: string,
    name: string,
    lastDateWithAdd: number,
    lastDate: number
  ): Promise<boolean> => {
    try {
      const tracking = new TrackingModel({
        user_id: userId,
        user_name: userName,
        url,
        name,
        last_date_with_add: lastDateWithAdd,
        last_date: lastDate,
      });
      await tracking.save();
      return true;
    } catch (err) {
      console.error("Error adding tracking data:", err);
      return false;
    }
  };

  updateTrackingDates = async (
    userId: string,
    name: string,
    lastDateWithAdd: number,
    lastDate: number
  ): Promise<boolean> => {
    try {
      const result = await TrackingModel.updateOne(
        { user_id: userId, name },
        { $set: { last_date_with_add: lastDateWithAdd, last_date: lastDate } }
      );
      return result.matchedCount > 0;
    } catch (err) {
      console.error("Error updating tracking dates:", err);
      return false;
    }
  };

  getListOfTracking = async (userId: number): Promise<string[]> => {
    try {
      const trackings = await TrackingModel.find(
        { user_id: userId },
        { name: 1, _id: 0 }
      );
      return trackings.map((t) => t.name);
    } catch (err) {
      console.error("Error retrieving tracking list:", err);
      return [];
    }
  };

  deleteTrackingByName = async (
    userId: number,
    name: string
  ): Promise<boolean> => {
    try {
      const result = await TrackingModel.deleteOne({ user_id: userId, name });
      return result.deletedCount > 0;
    } catch (err) {
      console.error("Error deleting tracking by name:", err);
      return false;
    }
  };

  deleteTrackingById = async (userId: number): Promise<boolean> => {
    try {
      const result = await TrackingModel.deleteMany({ user_id: userId });
      return result.deletedCount > 0;
    } catch (err) {
      console.error("Error deleting tracking by ID:", err);
      return false;
    }
  };

  getTrackingListBatch = async (offset: number, limit: number) => {
    try {
      const trackings = await TrackingModel.find().skip(offset).limit(limit);
      return trackings;
    } catch (err) {
      console.error("Error retrieving tracking batch:", err);
      return [];
    }
  };
}

const trackingService = new TrackingService();

export default trackingService;