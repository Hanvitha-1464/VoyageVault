import React, { useState, useEffect } from 'react';
import { Users,  Plus,  LogIn,  Eye,  EyeOff,  X, Loader2} from 'lucide-react';

const RoomManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myRooms, setMyRooms] = useState([]);
  const [user, setUser] = useState({ username: '', email: '' });

  const [createForm, setCreateForm] = useState({
    roomName: '',
    roomPassword: ''
  });
  
  const [joinForm, setJoinForm] = useState({
    roomName: '',
    roomPassword: ''
  });

   useEffect(() => {
  const storedUser = localStorage.getItem('user'); 
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      setUser({
        username: userData.username || 'User',
        email: userData.email || 'user@example.com'
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUser({ username: 'User', email: 'user@example.com' });
    }
  } else {
    setUser({ username: 'User', email: 'user@example.com' });
  }

  fetchMyRooms();
}, []);

  const fetchMyRooms = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('No auth token found');
      setMyRooms([]);
      return;
    }

    const response = await fetch('https://voyagevault-1464.azurewebsites.net/api/rooms/my-rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setMyRooms(data.rooms || []);
    } else {
      console.error('Failed to fetch rooms:', response.status);
      setMyRooms([]);
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    setMyRooms([]);
  }
}; 
 const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentRoomToken');
    setUser({ username: '', email: '' });
    setMyRooms([]);

    window.location.href = '/login'; 
  }; 
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://voyagevault-1464.azurewebsites.net/api/rooms/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomName: createForm.roomName.trim(),
          roomPassword: createForm.roomPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCreateForm({ roomName: '', roomPassword: '' });
        setShowCreateModal(false);

        await fetchMyRooms();

        if (data.roomToken) {
          localStorage.setItem('currentRoomToken', data.roomToken);
        }
        
        alert(`Room "${data.room.roomName}" created successfully!`);
        
        window.location.href = `/itinerary/${encodeURIComponent(data.room.roomName)}`;
        
      } else {
        if (data.code === 'ROOM_EXISTS') {
          alert('A room with this name already exists. Please choose a different name.');
        } else if (data.code === 'VALIDATION_ERROR') {
          alert(data.message || 'Please check your input and try again.');
        } else {
          alert(data.message || 'Failed to create room. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://voyagevault-1464.azurewebsites.net/api/rooms/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomName: joinForm.roomName.trim(),
          roomPassword: joinForm.roomPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setJoinForm({ roomName: '', roomPassword: '' });
        setShowJoinModal(false);

         await fetchMyRooms();

        if (data.roomToken) {
          localStorage.setItem('currentRoomToken', data.roomToken);
        }
        
        alert(`Successfully joined room "${data.room.roomName}"!`);

        window.location.href = `/itinerary/${encodeURIComponent(data.room.roomName)}`;
        
      } else {
        if (data.code === 'ROOM_NOT_FOUND') {
          alert('Room not found. Please check the room name and try again.');
        } else if (data.code === 'INVALID_CREDENTIALS') {
          alert('Incorrect room name or password. Please try again.');
        } else {
          alert(data.message || 'Failed to join room. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const enterRoom = async (room) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://voyagevault-1464.azurewebsites.net/api/rooms/enter/${encodeURIComponent(room.roomName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (data.roomToken) {
          localStorage.setItem('currentRoomToken', data.roomToken);
        }
        window.location.href = `/itinerary/${encodeURIComponent(room.roomName)}`;
      } else {
        if (data.code === 'ACCESS_DENIED') {
          alert('You do not have access to this room.');
        } else {
          alert(data.message || 'Failed to enter room. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to enter room:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
           <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <img src="/images/VV.png" className="h-8 w-8 rounded-full" alt="VoyageVault Logo" />
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">VoyageVault</span>
            </a>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
                 <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            <span>Room Management</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Manage Your Rooms
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create or join collaborative spaces
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span>Create New Room</span>
            </div>
          </button>
          
          <button
            onClick={() => setShowJoinModal(true)}
            className="group relative px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <LogIn className="w-5 h-5" />
              </div>
              <span>Join Room</span>
            </div>
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">My Rooms</h2>
          
          {myRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Rooms Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create a new room or join an existing one to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                          {room.roomName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {room.isOwner ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => enterRoom(room)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Enter Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Room</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Set up your new collaborative space
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={createForm.roomName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, roomName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter room name (3-50 characters)"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={createForm.roomPassword}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, roomPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter secure password (min 4 characters)"
                      minLength={4}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleCreateRoom} 
                    disabled={isLoading || !createForm.roomName.trim() || !createForm.roomPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Create Room</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Join Room</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Enter room details to join
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={joinForm.roomName}
                    onChange={(e) => setJoinForm(prev => ({ ...prev, roomName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter room name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={joinForm.roomPassword}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, roomPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter room password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleJoinRoom}
                    disabled={isLoading || !joinForm.roomName.trim() || !joinForm.roomPassword}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Join Room</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;