const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header, access denied" });
  }

  // Check if token starts with 'Bearer '
  let token;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  } else {
    token = authHeader; // Support tokens without Bearer prefix for flexibility
  }

  if (!token) {
    return res.status(401).json({ message: "No auth token, access denied" });
  }

  try {
    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified.id;
    req.userEmail = verified.email; // Also store email for convenience
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired, please login again" });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      return res.status(401).json({ message: "Token verification failed" });
    }
  }
}

module.exports = auth;
