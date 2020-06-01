const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/create_task', auth, async(req, res) => {
    console.log(req)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.send({
            status: 1,
            message: 'Task created Successfully'
        })
    } catch (e) {
        res.status(400).send(e)
    }

})


router.get('/tasks', auth, async(req, res) => {

    const match = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: {
                    createdAt: -1
                }
            }
        }).execPopulate()
        const tasks = req.user.tasks
        res.send(tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async(req, res) => {
    console.log(req.params)

    const _id = req.params.id
    try {
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }

})

router.patch('/tasks/:id', auth, async(req, res) => {
    console.log(req.params.id)
    console.log(req.body)

    const allowedKeys = ['description', 'completed']
    const updateKeys = Object.keys(req.body)

    const isValidOperation = updateKeys.every((update) => allowedKeys.includes(update))

    if (!isValidOperation) {
        return res.status(400).send('Invalid Updates')
    }

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        updateKeys.forEach((taskKey) => task[taskKey] = req.body[taskKey])

        await task.save()

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/task/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(400).send()
        }
        res.send({
            status: 1,
            message: 'Task deleted successfully'
        })
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router