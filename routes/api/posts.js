const express = require('express');
const router = express.Router();

const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

// models
const Post    = require('../../models/Post');
const Profile = require('../../models/Profile');
const User    = require('../../models/User');


// @route   POST api/posts
// @desc    Create a  post
// @access   Private
router.post('/', [ 
    auth, [ 
        check('text', 'Text is required').not().isEmpty()
    ] 
], 
async (req, res) => {

    const errors = validationResult(req);
    if ( !errors.isEmpty() ) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id // %can we take this from user?
        });
        const post = await newPost.save();
        res.json(post);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {

    try {
        const posts = await Post.find().sort({ date: -1 }); // -1 is more recent first
        res.json(posts);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        //const post = await Post.findOne({ _id: req.params.id });
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch(err) {
        console.error(err.message);
        if ( err.kind === 'ObjectId' ) {
            // Deal with id that isn't a valid object id
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        //await Post.findOneAndRemove({ _id: req.params.id });
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Ensure user owns the post
        // NOTE: req.user.id is a string
        if ( post.user.toString() !== req.user.id ) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post deleted' });

    } catch(err) {
        console.error(err.message);
        if ( err.kind === 'ObjectId' ) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;
