const bcrypt = require('bcryptjs');

module.exports = {
  register: async (req, res) => {
      //deconstruct username, password, isAdmin
    const { username, password, isAdmin } = req.body
    //get db insance
    const db = req.app.get('db')
    //setting result to the response of get_user
    const result = await db.get_user([username])
    //checks to see if the user exists
    const existingUser = result[0]
    //handles if there is an existing user
    if (existingUser) {
      return res.status(409).send('Username taken')
    }
    //adds same 
    const salt = bcrypt.genSaltSync(10)
    //takes in the password and salt then hashed them
    const hash = bcrypt.hashSync(password, salt)
    // sets registered user to the response of register_user with the passed params
    const registeredUser = await db.register_user([isAdmin, username, hash])
    const user = registeredUser[0]
    req.session.user = { isAdmin: user.is_admin, username: user.username, id: user.id };
    return res.status(200).send(req.session.user);
  },

  login: async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await req.app.get('db').get_user([username]);
    const user = foundUser[0];
    if (!user) {
      return res.status(401).send('User  not found. Please register as a new user before logging in.');
    }
    const isAuthenticated = bcrypt.compareSync(password, user.hash);
    if (!isAuthenticated) {
      return res.status(403).send('Incorrect password');
    }
    req.session.user = { isAdmin: user.is_admin, id: user.id, username: user.username };
    return res.send(req.session.user);
  },
  logout: (req, res) => {
    req.session.destroy();
    return res.sendStatus(200);
  }
};
