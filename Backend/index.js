const express = require('express');
const app=express();
const cors = require('cors');
const path=require('path');
const bodyParser=require('body-parser');
require('dotenv').config();
const db= require('./Config/db');
const port=process.env.PORT || 8080;
const authRoutes=require("./Routers/AuthRoutes");
const roomRoutes=require("./Routers/RoomRoutes");
const itineraryRoutes=require("./Routers/ItineraryRoutes");
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"], 
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(bodyParser.json());
app.use(express.json());
app.get('/',(req,res)=>{
    res.send('Travel Planner server is up and running!');
});
app.use('/api',authRoutes);
app.use('/api/rooms',roomRoutes);
app.use('/api/itinerary',itineraryRoutes);   

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "Frontend", "dist")));

  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth")) {
      return next(); 
    }
    res.sendFile(path.resolve(__dirname, "Frontend", "dist", "index.html"));
  });
}

app.listen(port,()=>{
     console.log(`Server listening at http://localhost:${port}`);
});
