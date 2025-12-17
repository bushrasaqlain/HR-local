const checkRole = (role) => {
    return (req, res, next) => {
        if(!req.user) return res.status(401).json({message: "UnAuthorized"});

        if(req.user.accountType !== role) return res.status(403).json({message: "Forbidden"});

        next();
    };
};

module.exports = checkRole;