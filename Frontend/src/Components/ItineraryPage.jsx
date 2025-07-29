import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar,
  Plus,
  Users,
  User,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ItineraryPlanner = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState({
    id: null,
    roomName: '',
    createdBy: ''
  });
  const [user, setUser] = useState({ username: '', email: '', id: null });

  const [activityForm, setActivityForm] = useState({
    place: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    // Get user data from localStorage like in RoomManagement
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          username: userData.username || 'User',
          email: userData.email || 'user@example.com',
          id: userData.id || null
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser({ username: 'User', email: 'user@example.com', id: null });
      }
    } else {
      setUser({ username: 'User', email: 'user@example.com', id: null });
    }

    // Get room information from URL
    const pathParts = window.location.pathname.split('/');
    const roomNameFromUrl = pathParts[pathParts.length - 1];
    const decodedRoomName = decodeURIComponent(roomNameFromUrl);
    
    if (decodedRoomName) {
      fetchRoomDetails(decodedRoomName);
    }
  }, []);

  useEffect(() => {
    if (roomData.id) {
      loadActivities();
    }
  }, [roomData.id]);

  const fetchRoomDetails = async (roomName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://voyagevault-1464.azurewebsites.net/api/rooms/details/${encodeURIComponent(roomName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoomData({
          id: data.room.id,
          roomName: data.room.roomName,
          createdBy: data.room.createdBy || 'Unknown'
        });
      } else {
        console.error('Failed to fetch room details:', response.status);
        setError('Failed to load room details');
        // Fallback to URL-based room data
        setRoomData({
          id: `room_${Date.now()}`,
          roomName: roomName,
          createdBy: 'Unknown'
        });
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
      setError('Network error while loading room details');
      // Fallback to URL-based room data
      setRoomData({
        id: `room_${Date.now()}`,
        roomName: roomName,
        createdBy: 'Unknown'
      });
    }
  };

  const loadActivities = async () => {
    setIsLoadingActivities(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        setActivities([]);
        return;
      }

      const response = await fetch(`https://voyagevault-1464.azurewebsites.net/api/itinerary?roomId=${roomData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data || []);
        console.log('Activities loaded from backend:', data);
      } else {
        console.error('Failed to load activities:', response.status);
        setError('Failed to load activities');
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Network error while loading activities');
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://voyagevault-1464.azurewebsites.net/api/itinerary/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setActivities(prev => prev.filter(activity => activity.activity_id !== activityId));
        console.log('Activity deleted successfully');
      } else {
        console.error('Failed to delete activity:', response.status);
        setError('Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      setError('Network error while deleting activity');
    }
  };

  const handleAddActivity = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('https://voyagevault-1464.azurewebsites.net/api/itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          place: activityForm.place.trim(),
          date: activityForm.date,
          startTime: activityForm.startTime,
          endTime: activityForm.endTime,
          addedBy: user.id,
          roomId: roomData.id,
          username: user.username // Include username in the request
        })
      });
      
      if (response.ok) {
        const newActivity = await response.json();
        setActivities(prev => [newActivity, ...prev]);
        setActivityForm({
          place: '',
          date: '',
          startTime: '',
          endTime: ''
        });
        console.log('Activity added successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to add activity:', response.status);
        setError(errorData.message || 'Failed to add activity');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      setError('Network error while adding activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRooms = () => {
    window.location.href = '/rooms';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isFormValid = () => {
    return activityForm.place.trim() && 
           activityForm.date && 
           activityForm.startTime && 
           activityForm.endTime &&
           activityForm.endTime > activityForm.startTime;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToRooms}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Back to Rooms"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  VoyageVault
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {roomData.roomName || 'Loading...'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created by {roomData.createdBy}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            <span>Itinerary Planning</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Plan Your Adventure
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add activities and create your perfect itinerary for {roomData.roomName}
          </p>
        </div>

        {/* Add Activity Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Activity</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Place Name *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={activityForm.place}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, place: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter place name"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={activityForm.date}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={activityForm.startTime}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={activityForm.endTime}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddActivity}
              disabled={isLoading || !isFormValid()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Adding Activity...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Activity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Planned Activities</h2>
          
          {isLoadingActivities ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Activities Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Add your first activity to start planning your itinerary
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.activity_id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {activity.place}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(activity.start_time)} - {formatTime(activity.end_time)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Added by {activity.username || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {(user.id === activity.added_by || user.username === activity.username) && (
                      <button
                        onClick={() => handleDeleteActivity(activity.activity_id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete activity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlanner;