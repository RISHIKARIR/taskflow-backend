
 function requireRole(...allowedRoles) {
   
   return (req, res, next) => {
    console.log("hititng");
    console.log(allowedRoles, "allowed roles");
    if (!req.user) {
     
      return res.status(401).json({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        details: {},
      });
    }

    console.log(req.user, "user role");

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden, You are not allowed to perform this",
        code: "FORBIDDEN",
        details: {},
      });
    }

    next();
  };
}


module.exports = requireRole;

