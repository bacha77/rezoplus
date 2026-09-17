const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'freight.db');
const db = new sqlite3.Database(dbPath);

const generateFakeHistory = () => {
  db.all('SELECT id, name FROM carriers', (err, carriers) => {
    if (err) {
      console.error(err);
      return;
    }

    if (carriers.length === 0) {
      console.log('No carriers found. Upload the CSV first!');
      return;
    }

    db.serialize(() => {
      carriers.forEach((carrier) => {
        // Generate 10 past data points
        let currentScore = Math.floor(Math.random() * 30) + 10; // Start at 10-40
        const now = Date.now();

        for (let i = 10; i >= 1; i--) {
          // Subtract 1 week (7 days) for each step back in time
          const pastDate = new Date(now - (i * 7 * 24 * 60 * 60 * 1000)).toISOString();
          
          // Randomly fluctuate the score
          const change = Math.floor(Math.random() * 15) - 5; // -5 to +10
          currentScore = Math.max(0, Math.min(100, currentScore + change));

          db.run(
            'INSERT INTO carrier_history (carrier_id, insurance_status, authority_status, safety_score, timestamp) VALUES (?, ?, ?, ?, ?)',
            [carrier.id, 'ACTIVE', 'AUTHORIZED', currentScore, pastDate]
          );
        }
      });
      console.log(`Successfully generated fake historical data for ${carriers.length} carriers!`);
    });
  });
};

generateFakeHistory();
