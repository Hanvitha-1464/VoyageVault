const express = require('express');
const router = express.Router();
const { getActivities, addActivity, deleteActivity } = require('../Controllers/ItineraryController');
const {  validateGetActivities, validateAddActivity, validateDeleteActivity, handleValidationErrors } = require('../Middleware/ItineraryValidation');

router.get('/',validateGetActivities,handleValidationErrors, getActivities);

router.post('/', validateAddActivity, handleValidationErrors, addActivity);

router.delete('/:activityId', validateDeleteActivity, handleValidationErrors, deleteActivity);

module.exports = router;

