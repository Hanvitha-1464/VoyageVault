const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../Config/db');

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const signup = async (req, res) => {
  let connection;
  
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        message: 'Username, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'VALIDATION_ERROR',
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password too weak',
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long'
      });
    }

    connection = await pool.getConnection();

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS',
        message: 'Username or email is already registered'
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const [newUser] = await connection.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = newUser[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Signup error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS',
        message: 'Username or email is already registered'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create account',
      code: 'SIGNUP_ERROR',
      message: 'An error occurred while creating your account. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const login = async (req, res) => {
  let connection;
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        code: 'VALIDATION_ERROR',
        message: 'Username/email and password are required'
      });
    }

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Username/email or password is incorrect'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Username/email or password is incorrect'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      message: 'An error occurred during login. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getProfile = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR',
      message: 'An error occurred while fetching your profile. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updateProfile = async (req, res) => {
  let connection;
  
  try {
    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username && !email) {
      return res.status(400).json({
        error: 'No data to update',
        code: 'VALIDATION_ERROR',
        message: 'Please provide username or email to update'
      });
    }

    connection = await pool.getConnection();

    if (username || email) {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || '', email || '', userId]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'Username or email already exists',
          code: 'USER_EXISTS',
          message: 'Username or email is already taken by another user'
        });
      }
    }

    let updateFields = [];
    let updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username.trim());
    }

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address'
        });
      }
      updateFields.push('email = ?');
      updateValues.push(email.trim().toLowerCase());
    }

    updateValues.push(userId);

    await connection.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updatedUsers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    const user = updatedUsers[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Username or email already exists',
        code: 'USER_EXISTS',
        message: 'Username or email is already taken'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'UPDATE_ERROR',
      message: 'An error occurred while updating your profile. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const changePassword = async (req, res) => {
  let connection;
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        message: 'Current password and new password are required'
      });
    }

    // New password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password too weak',
        code: 'VALIDATION_ERROR',
        message: 'New password must be at least 6 characters long'
      });
    }

    connection = await pool.getConnection();

    // Get current user password
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR',
      message: 'An error occurred while changing your password. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const refreshToken = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = users[0];
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR',
      message: 'An error occurred while refreshing your token. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const logout = async (req, res) => {
  // For stateless JWT, logout is handled on the client side
  // But we can update last_logout timestamp for tracking
  let connection;
  
  try {
    connection = await pool.getConnection();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR',
      message: 'An error occurred during logout'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
};