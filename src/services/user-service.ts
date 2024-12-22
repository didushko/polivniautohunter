import DatabaseConnection from "../database/DatabaseConnetion";
import userModel, { IUser } from "../database/User.model";

class UserService extends DatabaseConnection {
  addUserIfNotExists = async (
    user_id?: number,
    user_name?: string
  ): Promise<void> => {
    try {
      if (user_id) {
        const existingUser = await userModel.exists({ user_id });

        if (existingUser) {
          return;
        }
        const currentDate = new Date().toISOString().split("T")[0];
        const newUser = new userModel({
          user_id,
          user_name,
          first_request: currentDate,
          total_hunting: 0,
        });

        await newUser.save();
      }
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  async newHunting(userId: number, name: string): Promise<void> {
    try {
      const currentDate = new Date().toISOString().split("T")[0];

      const updateData = {
        $inc: { total_hunting: 1 },
        last_hunt: currentDate,
      };
      const user = await userModel.findOne({ user_id: userId });
      if (!user?.first_hunt) {
        Object.assign(updateData, { first_hunt: currentDate });
      }
      if(name && !user?.user_name){
        Object.assign(updateData, { user_name: name });
      }
      await userModel.updateOne({ user_id: userId }, updateData);
    } catch (err) {
      console.error("Error updating hunting info:", err);
    }
  }

  endHunting(userId: number): void {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      userModel.updateOne({ user_id: userId }, { last_hunt: currentDate });
    } catch (err) {
      console.error("Error updating hunting info:", err);
    }
  }

  getUsers = async (): Promise<IUser[]> => {
    try {
      const users = await userModel.find().lean<IUser[]>();
      return users;
    } catch (error) {
      console.error("Error retrieving users:", error);
      return [];
    }
  };
}

const userService = new UserService();

export default userService;
