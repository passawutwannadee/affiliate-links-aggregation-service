const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-user-config');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);
const fs = require('fs');
const path = require('path');

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

const editProfilePicture = async (req, res) => {
  const updateProfilePicture = async () => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.log(`error: ${JSON.stringify(err)}`);
        return res.status(500).json({ message: err });
      } else if (err) {
        console.log(`error: ${JSON.stringify(err)}`);
        return res.status(500).json({ message: err });
      } else {
        try {
          const profile_picture = req.file ? req.file.filename : null;
          console.log(req.file);

          const profile_data = {
            profile_picture: profile_picture,
          };

          console.log(req.userId);

          const insertProfilePicture = await db('users')
            .update(profile_data)
            .where('user_id', req.userId);

          res.json({
            status: 200,
            message: 'Profile picture updated successfully',
          });
        } catch (err) {
          console.error('Error updating profile picture: ', err);
          res.sendStatus(500);
        }
      }
    });
  };

  try {
    const getProfilePicture = await db('users')
      .select('profile_picture')
      .where('user_id', req.userId);

    const profilePicture = getProfilePicture[0].profile_picture;

    const filePath = path.join('./uploads/images/users', profilePicture);

    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err}`);
        } else {
          console.log(`File ${profilePicture} has been successfully deleted.`);
          updateProfilePicture();
        }
      });
    } else {
      console.log(`File ${profilePicture} does not exist.`);
      updateProfilePicture();
    }
  } catch (err) {
    res.json(err);
  }
};

module.exports = {
  getUsers,
  editProfilePicture,
};
