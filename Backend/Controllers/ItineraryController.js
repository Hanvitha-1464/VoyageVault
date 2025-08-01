const db = require('../Config/db'); 

const getActivities = async (req, res) => {
  try {
    const { roomId } = req.query;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Room ID is required' });
    }
    
    const query = `
      SELECT a.*, u.username 
      FROM activities a 
      JOIN users u ON a.added_by = u.id 
      WHERE a.room_id = ?
      ORDER BY a.date ASC, a.start_time ASC
    `;
    const [activities] = await db.execute(query, [roomId]);
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

const addActivity = async (req, res) => {
  try {
    const { place, date, startTime, endTime, addedBy, roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Room ID is required' });
    }
    
    const query = `
      INSERT INTO activities (place, date, start_time, end_time, added_by, room_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [place, date, startTime, endTime, addedBy, roomId]);
    const [newActivity] = await db.execute(`
      SELECT a.*, u.username 
      FROM activities a 
      JOIN users u ON a.added_by = u.id 
      WHERE a.activity_id = ?
    `, [result.insertId]);
    
    res.status(201).json(newActivity[0]);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ message: 'Failed to add activity' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user?.id; // Assuming you have user info from auth middleware
    
    // Optional: Check if user has permission to delete (either creator or room member)
    const checkQuery = `
      SELECT a.added_by, a.room_id 
      FROM activities a 
      WHERE a.activity_id = ?
    `;
    const [activityCheck] = await db.execute(checkQuery, [activityId]);
    
    if (activityCheck.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Optional: Add permission check
    // if (userId && activityCheck[0].added_by !== userId) {
    //   return res.status(403).json({ message: 'Not authorized to delete this activity' });
    // }
    
    const query = 'DELETE FROM activities WHERE activity_id = ?';
    const [result] = await db.execute(query, [activityId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Failed to delete activity' });
  }
};

module.exports = {
  getActivities,
  addActivity,
  deleteActivity
};