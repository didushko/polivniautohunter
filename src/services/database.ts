import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db");

const createTables = (): boolean => {
  try {
    db.run(
      `CREATE TABLE IF NOT EXISTS tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        url TEXT,
        name TEXT,
        last_date_with_add INTEGER,
        last_date INTEGER
      )`,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    return true;
  } catch (err) {
    console.error("Error creating tables:", err);
    return false;
  }
};

export const updateTrackingDates = (
  userId: string,
  name: string,
  lastDateWithAdd: number,
  lastDate: number
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE tracking
      SET last_date_with_add = ?, last_date = ?
      WHERE user_id = ? AND name = ?
    `;
    db.run(query, [lastDateWithAdd, lastDate, userId, name], function (err) {
      if (err) {
        console.error("Error updating tracking:", err);
        return reject(err);
      }

      if (this.changes > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const addTracking = (
  userId: number,
  url: string,
  name: string,
  lastDateWithAdd: number,
  lastDate: number
): boolean => {
  try {
    db.run(
      `INSERT INTO tracking (user_id, url, name, last_date_with_add, last_date) VALUES (?, ?, ?, ?, ?)`,
      [userId, url, name, lastDateWithAdd, lastDate],
      function (err) {
        if (err) {
          console.error("Error inserting tracking data:", err);
          return false;
        } else {
          return true;
        }
      }
    );
    return true;
  } catch (err) {
    console.error("Error adding tracking data:", err);
    return false;
  }
};

const getListOfTracking = (userId: number): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT name FROM tracking WHERE user_id = ?`,
      [userId],
      (err, rows: { name: string }[]) => {
        if (err) {
          console.error("Error retrieving tracking list:", err);
          reject(false);
        } else {
          const trackingNames = rows.map((row) => row.name);
          resolve(trackingNames);
        }
      }
    );
  });
};

const deleteTrackingByName = (
  userId: number,
  name: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM tracking WHERE user_id = ? AND name = ?`,
      [userId, name],
      function (err) {
        if (err) {
          console.error("Error deleting tracking by name:", err);
          reject(false);
        } else if (this.changes === 0) {
          console.log("No tracking record found with that name.");
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
};

const deleteTrackingById = (user_id: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM tracking WHERE user_id = ?`, [user_id], function (err) {
      if (err) {
        console.error("Error deleting tracking by ID:", err);
        reject(false);
      } else if (this.changes === 0) {
        console.log("No tracking record found with that ID.");
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const getTrackingListBatch = (
  offset: number,
  limit: number,
  callback: (
    error: Error | null,
    rows: {
      user_id: string;
      url: string;
      name: string;
      last_date_with_add: number;
      last_date: number;
    }[]
  ) => void
): void => {
  db.all(`SELECT * FROM tracking LIMIT ? OFFSET ?`, [limit, offset], callback);
};

export {
  createTables,
  addTracking,
  getListOfTracking,
  deleteTrackingById,
  deleteTrackingByName,
  getTrackingListBatch,
};
