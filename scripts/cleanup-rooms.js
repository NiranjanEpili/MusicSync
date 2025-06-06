const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');

// Your Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyB_yAD2uoloGUPU7QbXdmg6sA6gke1__Xo",
  authDomain: "musicsync-69339.firebaseapp.com",
  databaseURL: "https://musicsync-69339-default-rtdb.firebaseio.com",
  projectId: "musicsync-69339",
  storageBucket: "musicsync-69339.firebasestorage.app",
  messagingSenderId: "113150334014",
  appId: "1:113150334014:web:d2dbe6f70d7b7362d4ed6f"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function cleanupOldRooms() {
  try {
    console.log('Starting room cleanup...');
    
    const roomsRef = ref(database, 'rooms');
    
    // First, try to read the rooms
    let snapshot;
    try {
      snapshot = await get(roomsRef);
    } catch (error) {
      if (error.message.includes('Permission denied')) {
        console.log('⚠️  Permission denied for reading rooms. Please update database rules.');
        console.log('💡 You can manually clean rooms through Firebase Console.');
        process.exit(0);
      }
      throw error;
    }
    
    if (!snapshot.exists()) {
      console.log('✅ No rooms found in database.');
      process.exit(0);
    }
    
    const rooms = snapshot.val();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
    
    let deletedCount = 0;
    let errorCount = 0;
    
    console.log(`📊 Found ${Object.keys(rooms).length} rooms to check...`);
    
    for (const [roomId, roomData] of Object.entries(rooms)) {
      try {
        let shouldDelete = false;
        
        // Check if room has no users
        if (!roomData.users || Object.keys(roomData.users).length === 0) {
          console.log(`🏠 Room ${roomId}: Empty (no users)`);
          shouldDelete = true;
        } else {
          // Check if all users are old
          const users = roomData.users;
          const userList = Object.values(users);
          const allUsersOld = userList.every(user => {
            const userAge = now - (user.joinedAt || 0);
            return userAge > ONE_HOUR;
          });
          
          if (allUsersOld) {
            console.log(`⏰ Room ${roomId}: All users inactive (${userList.length} old users)`);
            shouldDelete = true;
          } else {
            console.log(`✅ Room ${roomId}: Active (${userList.length} users)`);
          }
        }
        
        if (shouldDelete) {
          await remove(ref(database, `rooms/${roomId}`));
          console.log(`🗑️  Deleted room: ${roomId}`);
          deletedCount++;
        }
        
      } catch (error) {
        if (error.message.includes('Permission denied')) {
          console.log(`⚠️  Permission denied for room ${roomId} - skipping`);
          errorCount++;
        } else {
          console.log(`❌ Error processing room ${roomId}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📈 Cleanup Summary:`);
    console.log(`   ✅ Deleted: ${deletedCount} rooms`);
    console.log(`   ⚠️  Errors: ${errorCount} rooms`);
    console.log(`   🏠 Total processed: ${Object.keys(rooms).length} rooms`);
    
    if (errorCount > 0) {
      console.log(`\n💡 To fix permission errors, update your database rules in Firebase Console.`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Firebase database rules');
    console.log('   2. Ensure your config is correct');
    console.log('   3. Check your internet connection');
    process.exit(1);
  }
}

cleanupOldRooms();
