const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');


// @route   GET api/auth
// @desc    Test route
// @acess   Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // req.user set via middleware
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    POST api/auth
// @desc     Authenticate user & get token (aka login)
// @access   Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], 
async (req, res) => {
    //console.log(req.body); 
    const errors = validationResult(req);
    if ( !errors.isEmpty() ) {
        return res.status(400).json({ errors: errors.array() }); //bad request
    }

    const { email, password } = req.body;

    try { 
        let user = await User.findOne({ email }); 

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials (1)' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password); // plain-text password (from request) +  encrypted from DB for compare

        if ( !isMatch ) {
            return res.status(400).json({ errors: [{ msg: 'Invaild credentials (2)' }] });
        }
        
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if (err) {
                    throw err;
                }
                res.json({ token });
            }
        );

        //res.send('User registered');

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;
