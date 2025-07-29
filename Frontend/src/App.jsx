import {BrowserRouter as Router,Routes,Route} from 'react-router-dom';
import HomePage from './Components/homepage';
import About from './Components/about';
// import Authentication from './Components/Authentication';
import RoomManagement from './Components/RoomManagement';
import Login from './Components/login';
import Signup from './Components/signup';
import ItineraryPage from './Components/ItineraryPage'; 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About/>} />
        {/* <Route path="/login" element={<Authentication/>} /> */}
        <Route path="/rooms" element={<RoomManagement />} />
        <Route path="/room/:roomName" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/itinerary/:roomName" element={<ItineraryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
