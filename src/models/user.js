const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})


userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    return token
}


userSchema.statics.findUserByCredentials = async(email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        return {
            status: 0,
            message: 'Invalid Credentials'
        }
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return {
            status: 0,
            message: 'Invalid Credentials'
        }
    }

    const token = await user.generateAuthToken()

    user.tokens = user.tokens.concat({ token })

    await user.save()

    const data = {
        status: 1,
        message: 'Successfully logged in',
        token
    }

    return data
}

// hashing the password before saving
userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})


//Delete task when user is removed
userSchema.pre('remove', async function(next) {
    const user = this

    await Task.deleteMany({
        owner: user._id
    })

    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User