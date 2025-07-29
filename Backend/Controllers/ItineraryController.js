const db = require('../Config/db'); 

const getActivities = async (req, res) => {
  try {
    const query = `
      SELECT a.*, u.username 
      FROM activities a 
      JOIN users u ON a.added_by = u.id 
      ORDER BY a.date ASC, a.start_time ASC
    `;
    const [activities] = await db.execute(query);
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};
const addActivity = async (req, res) => {
  try {
    const { place, date, startTime, endTime, addedBy } = req.body;
    
    const query = `
      INSERT INTO activities (place, date, start_time, end_time, added_by) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [place, date, startTime, endTime, addedBy]);
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