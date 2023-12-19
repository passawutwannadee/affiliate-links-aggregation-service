const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-product-config');

const getUsers = async (req, res) => {
  const username = req.query.username;

  try {
    // if (!req.userId) {
    //   console.log(req.userId);
    //   let getUsername = db('users');

    //   getUsername
    //     .select('username')
    //     .from('users')
    //     .where('users.user_id', req.userId);

    //   const usernameQuery = await getUsername;

    //   username = usernameQuery[0].username;
    // }

    let query = db('users');
    query
      .select(
        db.raw(
          `display_name, username, CONCAT_WS("${process.env.PRODUCT_LINK_PATH}", profile_picture) as profile_picture`
        )
      )
      .from('users')
      .where('username', username);

    const users = await query;
    res.json(users[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

module.exports = {
  getUsers,
};
