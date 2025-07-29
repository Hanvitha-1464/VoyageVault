const validateCreateRoom = (req, res, next) => {
  const { roomName, roomPassword } = req.body;
  const errors = [];

  if (!roomName || roomName.trim().length === 0) {
    errors.push('Room name is required');
  } else if (roomName.length < 3) {
    errors.push('Room name must be at least 3 characters long');
  } else if (roomName.length > 50) {
    errors.push('Room name must be less than 50 characters');
  } else if (!/^[a-zA-Z0-9_\s\-]+$/.test(roomName)) {
    errors.push('Room name can only contain letters, numbers, spaces, underscores, and hyphens');
  }

  // Room password validation
  if (!roomPassword) {
    errors.push('Room password is required');
  } else if (roomPassword.length < 4) {
    errors.push('Room password must be at least 4 characters long');
  } else if (roomPassword.length > 50) {
    errors.push('Room password must be less than 50 characters');
  }


  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateJoinRoom = (req, res, next) => {
  const { roomName, roomPassword } = req.body;
  const errors = [];

  if (!roomName || roomName.trim().length === 0) {
    errors.push('Room name is required');
  } else if (roomName.length > 100) {
    errors.push('Room name must be less than 100 characters');
  }

  if (!roomPassword) {
    errors.push('Room password is required');
  } else if (roomPassword.length > 50) {
    errors.push('Room password must be less than 50 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateRoomName = (req, res, next) => {
  const { roomName } = req.params;
  const errors = [];

  if (!roomName || roomName.trim().length === 0) {
    errors.push('Room Name is required');
  } else if (roomName.length > 100) {
    errors.push('Room Name must be less than 100 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

module.exports = { 
  validateCreateRoom, 
  validateJoinRoom, 
  validateRoomName 
};