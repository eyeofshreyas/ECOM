const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const promoteToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();

        console.log(`✓ User ${user.name} (${user.email}) has been promoted to admin`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node promoteToAdmin.js <email>');
    console.log('Example: node promoteToAdmin.js user@example.com');
    process.exit(1);
}

promoteToAdmin(email);
