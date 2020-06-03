const express = require('express')
const User = require('../models/user')
const { sendWelcomeEmail } = require('../emails/accounts')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()



router.post('/users', async(req, res) => {
    const user = new User(req.body)

    console.log(user)

    try {
        const token = await user.generateAuthToken()
        user.tokens = user.tokens.concat({ token })

        await user.save()
        res.send({
            status: 1,
            message: 'Registered User Successfully',
            token
        })

        // sendWelcomeEmail(user.email, user.name)
    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/users/login', async(req, res) => {
    try {

        const user = await User.findUserByCredentials(req.body.email, req.body.password)
        console.log(user)
        return res.send(user)
    } catch (e) {
        return res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)

        await req.user.save()

        res.send({
            status: 1,
            message: 'User logout successfully'
        })
    } catch (e) {
        return res.status(400).send(e)
    }
})


router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send({
            status: 1,
            message: 'Successfully logged out of all devices'
        })
    } catch (e) {
        res.status(400).send(e)
    }
})


router.get('/users/me', auth, async(req, res) => {
    try {
        const user = req.user.toObject()

        delete user.password
        delete user.tokens
        delete user.avatar

        res.send({
            status: 1,
            message: 'User details fetched successfully',
            user: user
        })
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/:id', async(req, res) => {
    console.log(req.params)
    const _id = req.params.id
    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/users/me', auth, async(req, res) => {
    console.log(req.user)
    console.log(req.body)

    const updateKeys = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'age', 'password']

    const isValidOperation = updateKeys.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send('Invalid Updates')
    }

    try {
        updateKeys.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()
            // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            // if (!user) {
            //     return res.status(404).send()
            // }

        const user = req.user.toObject()

        delete user.password
        delete user.tokens

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/user/me', auth, async(req, res) => {
    try {
        await req.user.remove()
        res.send({
            status: 1,
            message: 'User deleted successfully'
        })
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File format error'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

        req.user.avatar = buffer
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(400).send(e)
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async(req, res) => {
    try {
        req.user.avatar = undefined
        await req.user.save()

        res.send({
            status: 1,
            message: 'Avatar removed successfully'
        })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/:id/avatar', auth, async(req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error('No image found')
        }

        res.set('Content-Type', 'image/jpg')
        return res.send(user.avatar)
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
})

module.exports = router