import jwt from 'jsonwebtoken';

class Authenticator {
    SECRET_KEY;
    constructor(SECRET_KEY) {
        this.SECRET_KEY = SECRET_KEY;
        console.log('Authenticator initialized with secret', SECRET_KEY);
    }
    // Middleware to authenticate JWT token
    authenticateToken(req, res, next) {
        const SECRET_KEY = 'your_secret_key'; // Replace with your secret key
        let token = req.headers['authorization'];
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trim(); // Remove 'Bearer ' from the token
        }

        if (!token) {
            return res.status(401).json({ message: 'Access token is missing or invalid!' });
        }
        //console.log('Token:', token);

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token!' });
            }
            req.userId = decoded.userId;
            next();
        });
    }
}

const SECRET_KEY = 'your_secret_key'; // Replace after putting on github
const authenticator = new Authenticator(SECRET_KEY);

export { authenticator, SECRET_KEY };