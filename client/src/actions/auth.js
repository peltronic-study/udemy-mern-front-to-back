import axios from 'axios';
import { setAlert } from './alert';  //want to use alert to show errors from server!
import setAuthToken from '../utils/setAuthToken';
import { 
    REGISTER_SUCCESS, 
    REGISTER_FAIL,
    USER_LOADED,
    AUTH_ERROR
} from '../actions/types';


// Load User
export const loadUser = () => async dispatch => {
    // check if there is token, if there is, put in header...
    if (localStorage.token) {
        setAuthToken(localStorage.token);
    }

    try {
        const res = await axios.get('/api/auth');
        dispatch({
            type: USER_LOADED,
            payload: res.data
        });
    } catch(err) {
        dispatch({
            type: AUTH_ERROR
        });
    }
}

// %TODO: compare with actions/alert.js
export const register = ({ name, email, password }) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
    };

    const body = JSON.stringify({ name, email, password });

    try {
        const res = await axios.post('/api/users',body, config);
        dispatch({
            type: REGISTER_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach(error => dispatch(setAlert(error.msg, 'danger'))); // %NOTE!
        }
        dispatch({
            type: REGISTER_FAIL
        });
    }
}
