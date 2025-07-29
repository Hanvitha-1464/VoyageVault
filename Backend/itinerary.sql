CREATE TABLE IF NOT EXISTS activities (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    place VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    added_by INT NOT NULL,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);