import DatabaseConnection from '../database/DatabaseConnetion';
import TrackingModel, { ITracking } from '../database/Tracking.model';
import userService from './user-service';

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
        user_name: userName || 'unknown_user',
        url,
        name,
        last_date_with_add: lastDateWithAdd || 0,
        last_date: lastDate || 0,
      });
      await tracking.save();
      userService.newHunting(userId, userName);
      return true;
    } catch (err) {
      console.error('Error adding tracking data:', err);
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
      console.error('Error updating tracking dates:', err);
      return false;
    }
  };

  updateUrl = async (
    userId: string,
    name: string,
    newUrl: string
  ): Promise<boolean> => {
    try {
      const result = await TrackingModel.updateOne(
        { user_id: userId, name },
        { $set: { url: newUrl } }
      );
      return result.matchedCount > 0;
    } catch (err) {
      console.error('Error updating tracking dates:', err);
      return false;
    }
  };

  getListOfTracking = async (userId: number): Promise<ITracking[]> => {
    try {
      const trackings = await TrackingModel.find(
        { user_id: userId },
        { name: 1, url: 1, _id: 0 }
      );
      return trackings;
    } catch (err) {
      console.error('Error retrieving tracking list:', err);
      return [];
    }
  };

  getListOfActive = async (): Promise<ITracking[]> => {
    try {
      const trackings = await TrackingModel.find()
        .sort({ user_id: 1 })
        .lean<ITracking[]>();
      return trackings;
    } catch (err) {
      console.error('Error retrieving tracking list:', err);
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
      console.error('Error deleting tracking by name:', err);
      return false;
    }
  };

  deleteTrackingById = async (userId: number): Promise<number> => {
    try {
      const result = await TrackingModel.deleteMany({ user_id: userId });
      return result.deletedCount;
    } catch (err) {
      console.error('Error deleting tracking by ID:', err);
      return 0;
    }
  };

  getTrackingListBatch = async (offset: number, limit: number) => {
    try {
      const trackings = await TrackingModel.find().skip(offset).limit(limit);
      return trackings;
    } catch (err) {
      console.error('Error retrieving tracking batch:', err);
      return [];
    }
  };
}

const trackingService = new TrackingService();

export default trackingService;
