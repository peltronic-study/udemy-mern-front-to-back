const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

// models
const Profile = require('../../models/Profile');
const User = require('../../models/User');


// @route   GET api/profile
// @desc    Get all profiles
// @acess   Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user (id)
// @acess   Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/me
// @desc    Get current user's profile
// @acess   Private
router.get('/me', auth, async (req, res) => {
    try {
        // key 'user' corresponds to FK in Profile Schema
        // 'populate' with name & avatar of user from User model
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']); 

        if ( !profile ) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        } 

        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access   Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
]], 
async (req, res) => {
    const errors = validationResult(req);
    if ( !errors.isEmpty() ) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id; // ???
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    /*
    console.log(profileFields.skills);
    return res.send('Hello');
    */

    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if ( profile ) {
            // update (NOTE how we do findOneAndUpdate not just update (%TODO)
            // see: https://docs.mongodb.com/manual/reference/operator/update/
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields },
                { new: true }
            );
        } else {
            // store
            profile = new Profile(profileFields);
            await profile.save();
        }
        return res.json(profile);
    
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @acess   Private
router.put(
    '/experience', 
    [
        auth, 
        [
            check('title', 'Title required').not().isEmpty(),
            check('company', 'Company required').not().isEmpty(),
            check('from', 'From date required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if ( !errors.isEmpty() ) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure body data
        const { title, company, location, from, to, current, description } = req.body;
        const newExp = { title, company, location, from, to, current, description };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/profile/experience/:exp_Id
// @desc    Delete experience from profile
// @acess   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        console.log(req.params.exp_id);

        // Get remove index
        //   ~ indexOf() returns the first index at which a given array element can be found, or -1 if not present
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id); // %TODO: ???
        if (removeIndex > 0) {
            console.log('Removing '+removeIndex);
            profile.experience.splice(removeIndex,1); // remove
            await profile.save();
        } else {
            console.error('Illegal index '+removeIndex);
        }

        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @acess   Private
router.put(
    '/education', 
    [
        auth, 
        [
            check('school', 'school required').not().isEmpty(),
            check('degree', 'degree required').not().isEmpty(),
            check('fieldofstudy', 'Field of Study required').not().isEmpty(),
            check('from', 'From date required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if ( !errors.isEmpty() ) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure body data
        const { school, degree, fieldofstudy, from, to, current, description } = req.body;
        const newEdu = { school, degree, fieldofstudy, from, to, current, description };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/profile/education/:exp_Id
// @desc    Delete education from profile
// @acess   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        console.log(req.params.edu_id);

        // Get remove index
        //   ~ indexOf() returns the first index at which a given array element can be found, or -1 if not present
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id); // %TODO: ???
        if (removeIndex > 0) {
            console.log('Removing '+removeIndex);
            profile.education.splice(removeIndex,1); // remove
            await profile.save();
        } else {
            console.error('Illegal index '+removeIndex);
        }

        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/profile/user/:user_id
// @desc    Delete profile, user, and posts
// @acess   Private
router.delete('/', auth, async (req, res) => {
    try {
        // %TODO: remove users posts

        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id }); // it's in the request due to the auth middleware (?)

        // Remove user
        await User.findOneAndRemove({ _id: req.user.id }); // 
        res.json({ msg: 'User deleted' });

    } catch(err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
