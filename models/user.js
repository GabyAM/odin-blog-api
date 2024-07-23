const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [
            {
                validator: (value) => {
                    return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                        value
                    );
                },
                message: 'Invalid email format'
            }
        ]
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: (value) => value.length >= 8,
            message: 'Password must have at least 8 characters'
        }
    },
    is_admin: { type: Boolean, default: false },
    is_banned: { type: Boolean, default: false },
    image: { type: String, default: 'profile.png' },
    saved_posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
});

userSchema.pre('save', async function (next) {
    this.email = this.email.toLowerCase();

    if (this.isModified('password')) {
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(this.password, 10);
            this.password = hashedPassword;
            next();
        } catch (err) {
            next(err);
        }
    }

    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
