
//db update for issue logic - commit message

await connection.execute(`
      ALTER TABLE issues
      ADD description_pic_AI VARCHAR(255) NULL;
    `);
await connection.execute(`
      ALTER TABLE issues
      ADD createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
await connection.execute(`
      ALTER TABLE issues
      ADD validation boolean DEFAULT FALSE;
    `);
await connection.execute(`
      ALTER TABLE issues
      ADD REASON_TEXT VARCHAR(255) NULL;
    `);

await connection.execute(`
      CREATE TABLE IF NOT EXISTS issues(
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20),
        coordinate VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        photo TEXT(60000),
        emergency BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
        assigned_department VARCHAR(100) NULL
        description_pic_AI VARCHAR(255) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validation boolean DEFAULT FALSE,
        REASON_TEXT VARCHAR(255) NULL
      )
    `);//And finally last 4 lines of this.


//For collection logic
//db update for issue collection logic - commit message
await connection.execute(`
      ALTER TABLE issues
      ADD same_collection VARCHAR(255) NULL;
    `);
// Create ISSUES table
await connection.execute(`
      CREATE TABLE IF NOT EXISTS issues(
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20),
        coordinate VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        photo TEXT(60000),
        emergency BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
        assigned_department VARCHAR(100) NULL,
        description_pic_AI VARCHAR(255) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validation boolean DEFAULT FALSE,
        REASON_TEXT VARCHAR(255) NULL,
        same_collection VARCHAR(255) NULL
      )
    `);

//last line is added



//commit: db update for user role enum expansion for department specific roles 
// this line from user table
//role ENUM('admin', 'govt_authority', 'citizen', 'police', 'health', 'fire', 'water', 'electricity') DEFAULT 'citizen',

await connection.execute(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin', 'govt_authority', 'citizen', 'police', 'health', 'fire', 'water', 'electricity') DEFAULT 'citizen'
    `);

//----x----