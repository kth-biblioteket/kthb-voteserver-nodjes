var jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    var apikey = req.body.apikey || req.query.apikey || req.headers['x-api-key'];
    if (!apikey && !token)
        return res.status(403).send({ auth: false, message: 'No token/key provided.' });
    
    if (apikey) {
        if(apikey != process.env.APIKEY){
            return res.json({ success: false, message: 'Failed to authenticate apikey.' });
        } else {
            next();
        }
    } else {
        if (token) {
            jwt.verify(token, process.env.SECRET, function(err, decoded) {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                req.userId = decoded.id;
                next();
            });
        }
    }
}

module.exports = verifyToken;