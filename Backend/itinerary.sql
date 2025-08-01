CREATE TABLE IF NOT EXISTS activities (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    place VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    added_by INT NOT NULL,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE activities ADD COLUMN room_id INT NOT NULL;
ALTER TABLE activities ADD FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE activities ADD INDEX idx_room_id (room_id);