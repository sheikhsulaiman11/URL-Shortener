import jwt from 'jsonwebtoken';


// Middleware to protect routes
 export function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) return res.redirect('/login');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.redirect('/login');
    }
}

// If the user is already logged in, skip login/register pages
 export function redirectIfLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect('/'); 
  } catch {
    res.clearCookie('token');
    next();
  }
}


