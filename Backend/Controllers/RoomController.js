const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../Config/db');

const generateRoomToken = (room,userId) => {
    return jwt.sign(
        {
            roomId:room.id,
            roomName:room.room_name,
            userId:userId,
        },
        process.env.JWT_SECRET,
        {expiresIn:'24h'}
    );
};

const createRoom = async (req,res) => {
    let connection;
    try{
        const {roomName,roomPassword}=req.body;
        const userId=req.user.userId;

        if(!roomName || !roomPassword){
            return res.status(400).json({
                error:'Missing required fields',
                code:'VALIDATION_ERROR',
                message:'ROOM name and Password is required'
            });
        }

        if(roomName.length<3){
            return res.status(400).json({
                error:'Room name too short',
                code:'VALIDATION_ERROR',
                message:'Room name must be atleast 3 characters'
            });
        }

        if(roomName.length>50){
            return res.status(400).json({
                error:'Room name too long',
                code:'VALIDATION_ERROR',
                message:''
            });
        }

        if(roomPassword.length<4){
            return res.status(400).json({
                error:'Password is too weak',
                code:'VALIDATION_ERROR',
                message:'Room password must be atleast 4 characters long'
            });
        }

        connection = await pool.getConnection();

        const [existingRooms] = await connection.execute(
            'SELECT id FROM rooms WHERE room_name= ?',
            [roomName.trim()]
        );

        if(existingRooms.length>0){
            return res.status(409).json({
                error:'Room already exists',
                code:'ROOM_EXISTS',
                message:'Room name is already taken'
            });
        }

        const saltRounds=10;
        const hashedPassword=await bcrypt.hash(roomPassword,saltRounds);
        
        const [result] = await connection.execute(
            'INSERT INTO rooms (room_name,room_password,created_by) VALUES (?,?,?)',
            [roomName.trim(),hashedPassword,userId]
        );

        const roomId = result.insertId;

        await connection.execute(
            'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
            [roomId, userId]
        );

        await connection.commit();

        const [newRoom] = await connection.execute(
            'SELECT r.id, r.room_name, r.created_by, u.username as creator_username FROM rooms r JOIN users u ON r.created_by = u.id WHERE r.id=?',
            [result.insertId]
        );

        const room=newRoom[0];
        const roomToken = generateRoomToken(room,userId);

        res.status(201).json({
            success:true,
            message:'Room created successfully',
            roomToken,
            room:{
                id:room.id,
                roomName:room.room_name,
                createdBy:room.creator_username, 
                isOwner:true
            }
        });
    }catch(error){
        console.error('Create room error:',error);
        if(error.code==='ER_DUP_ENTRY'){
            return res.status(409).json({
                error:'Room already exists',
                code:'ROOM_EXISTS',
                message:'Room name is already taken'
            });
        }

        res.status(500).json({
            error:'Failed to create room',
            code:'CREATE_ROOM_ERROR',
            message:'An error occured while creating room'
        });
    }finally{
        if(connection){
            connection.release();
        }
    }
};

const joinRoom=async(req,res)=>{
    let connection;
    try{
        const {roomName,roomPassword}=req.body;
        const userId=req.user.userId;

        if(!roomName || !roomPassword){
            return res.status(400).json({
                error:'Missing credentials',
                code:'VALIDATION_ERROR',
                message:'Room name or password is missing'
            });
        }

        connection = await pool.getConnection();

        const [rooms]=await connection.execute(
            'SELECT r.id, r.room_name, r.room_password, r.created_by, u.username as creator_username FROM rooms r JOIN users u ON r.created_by = u.id WHERE r.room_name=?',
            [roomName.trim()],
        )

        if(rooms.length === 0){
            return res.status(400).json({
                error:'Room not found',
                code:'ROOM_NOT_FOUND',
                message:'Room not found'
            });
        }

        const room=rooms[0];

        const isPasswordValid=await bcrypt.compare(roomPassword,room.room_password);

        if(!isPasswordValid){
            return res.status(401).json({
                error:'Invalid credentials',
                code:'INVALID_CREDENTIALS',
                message:'RoomId or Password is incorrect'
            });
        }
         
        const [existingMember] = await connection.execute(
            'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
            [room.id, userId]
        );

        if (existingMember.length === 0) {
          await connection.execute(
            'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
            [room.id, userId]
          );
        }

        const roomToken = generateRoomToken(room, userId);
    
        res.json({
          success: true,
          message: 'Successfully joined room',
          roomToken,
          room: {
            id: room.id,
            roomName: room.room_name,
            createdBy: room.creator_username, 
            isOwner: room.created_by === userId
          }
        });
    }catch(error){
        console.error('Join room error',error);
        res.status(500).json({
            error:'Failed to join room',
            code:'JOIN_ROOM_ERROR',
            message:'An error occured while joining the room.'
        });
    }finally{
        if(connection){
            connection.release();
        }
    }
};

const enterRoom = async (req,res) => {
    let connection;

    try{
        const {roomName} = req.params;
        const userId=req.user.userId;

        connection = await pool.getConnection();

        const [rooms] = await connection.execute(
            'SELECT r.id, r.room_name, r.created_by, u.username as creator_username FROM rooms r JOIN users u ON r.created_by = u.id LEFT JOIN room_members rm ON r.id = rm.room_id WHERE r.room_name=? AND (r.created_by=? OR rm.user_id=?)',
            [roomName.trim(),userId,userId]
        );

        if(rooms.length===0){
            return res.status(404).json({
                error:'Room not found or access denied',
                code:'ACCESS_DENIED',
                message:'Room does not exists or you do not have access to enter room'
            });
        }
        const room=rooms[0];
        const roomToken = generateRoomToken(room,userId);

        res.json({
            success:true,
            message:'Successfully entered room',
            roomToken,
            room:{
                id:room.id,
                roomName:room.room_name,
                createdBy: room.creator_username, 
                isOwner:room.created_by===userId
            }
        });
    }catch(error){
        console.error('Enter room error:',error);
        res.status(500).json({
            error:'Failed to enter room',
            code:'ENTER_ROOM_ERROR',
            message:'An error occured while entering the room'
        });
    }finally{
        if(connection){
            connection.release();
        }
    }
};

const getUserRooms=async(req,res)=>{
    let connection;
    try{
        const userId=req.user.userId;
        connection=await pool.getConnection();

        const[rooms]=await connection.execute(
            `SELECT DISTINCT r.id, r.room_name, r.created_by, u.username as creator_username,
            CASE WHEN r.created_by=? THEN 1 ELSE 0 END as isOwner
            FROM rooms r
            JOIN users u ON r.created_by = u.id
            LEFT JOIN room_members rm on r.id=rm.room_id
            WHERE r.created_by=? OR rm.user_id=?`,
            [userId,userId,userId]
        );

        const formattedRooms=rooms.map(room=>({
            id:room.id,
            roomName:room.room_name,
            createdBy: room.creator_username, 
            isOwner:Boolean(room.isOwner)
        }));

        res.json({
            success:true,
            rooms:formattedRooms
        });
    }catch(error){
        console.error('Get user rooms error:',error);
        res.status(500).json({
            error:'Failed to fetch user rooms',
            code:'FETCH_ROOMS_ERROR',
            message:'An error occured while fetching user rooms'
        });
    }finally{
        if(connection){
            connection.release();
        }
    }
};

const getRoomDetails = async (req, res) => {
    let connection;
    try {
        const { roomName } = req.params;
        const userId = req.user.userId;

        connection = await pool.getConnection();

        const [rooms] = await connection.execute(
            'SELECT r.id, r.room_name, r.created_by, u.username as creator_username FROM rooms r JOIN users u ON r.created_by = u.id LEFT JOIN room_members rm ON r.id = rm.room_id WHERE r.room_name = ? AND (r.created_by = ? OR rm.user_id = ?)',
            [roomName.trim(), userId, userId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                error: 'Room not found or access denied',
                code: 'ACCESS_DENIED',
                message: 'Room does not exist or you do not have access'
            });
        }

        const room = rooms[0];

        res.json({
            success: true,
            room: {
                id: room.id,
                roomName: room.room_name,
                createdBy: room.creator_username, 
                isOwner: room.created_by === userId
            }
        });
    } catch (error) {
        console.error('Get room details error:', error);
        res.status(500).json({
            error: 'Failed to fetch room details',
            code: 'FETCH_ROOM_DETAILS_ERROR',
            message: 'An error occurred while fetching room details'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    createRoom,
    joinRoom,
    enterRoom,
    getUserRooms,
    getRoomDetails
};