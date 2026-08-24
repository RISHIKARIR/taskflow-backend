const authService = require('../services/auth.service.js');



async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    console.log(name,'oknnok')
    console.log(email,"mfpf")
    console.log(password,"huibvyi")
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required ', code: 'VALIDATION_ERROR', details: {} });
    }

    const result = await authService.registerUser({ name, email, password });
    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS', details: {} });
    }
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR', details: {} });
  }
}



async function login(req, res) {
  try {


    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required',
        code: 'VALIDATION_ERROR',
        details: {},
      });
    }
 
    const result = await authService.loginUser({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS', details: {} });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR', details: {} });
  }
}


async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required', code: 'VALIDATION_ERROR', details: {} });
    }
 
    const result = await authService.refreshTokens({ refreshToken });
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      return res.status(401).json({ error: 'Refresh token invalid or expired', code: 'INVALID_TOKEN', details: {} });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR', details: {} });
  }

}


  async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required', code: 'VALIDATION_ERROR', details: {} });
    }
 
    await authService.logoutUser({ refreshToken });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR', details: {} });
  }
}




module.exports = { register,login,refresh,logout};

