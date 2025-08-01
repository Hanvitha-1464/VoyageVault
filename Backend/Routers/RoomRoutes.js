const express = require('express');
const router = express.Router();
const { createRoom,  joinRoom,  enterRoom, getUserRooms, getRoomDetails} = require('../Controllers/RoomController');
const { validateCreateRoom, validateJoinRoom, validateRoomName} = require('../Middleware/RoomValidation');
const auth = require('../Middleware/AuthMiddleware');

router.post('/create', auth, validateCreateRoom, createRoom);
router.post('/join', auth, validateJoinRoom, joinRoom);
router.post('/enter/:roomName', auth, validateRoomName, enterRoom);
router.get('/my-rooms',auth,getUserRooms);
router.get('/details/:roomName', auth, getRoomDetails);
module.exports = router;