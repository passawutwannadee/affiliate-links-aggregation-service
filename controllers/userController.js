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
          `display_name, username, CONCAT_WS("","${process.env.USER_LINK_PATH}", profile_picture) as profile_picture`
        )
      )
      .from('users')
      .where('username', username)
      .whereNotExists(function () {
        this.select(db.raw(1))
          .from('user_ban')
          .leftJoin('users', 'user_ban.user_id', 'users.user_id')
          .where('username', username)
          .where('user_ban.ban_active', 1);
      });
    const users = await query;

    console.log('user', users.length);

    if (users.length === 0) {
      return res.status(404).json({ status: 404, message: 'User not found.' });
    }
    if (users.length === 1) {
      return res.json(users[0]);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
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

          const profile_data = {
            profile_picture: profile_picture,
          };

          const insertProfilePicture = await db('users')
            .update(profile_data)
            .where('user_id', req.userId);

          res.json({
            status: 200,
            message: 'Profile picture updated successfully',
          });
        } catch (err) {
          console.error('Error updating profile picture: ', err);
          res.status(500).json(err);
        }
      }
    });
  };

  try {
    const getProfilePicture = await db('users')
      .select('profile_picture')
      .where('user_id', req.userId);

    const profilePicture = getProfilePicture[0].profile_picture;

    if (profilePicture) {
      const filePath = path.join('./uploads/images/users', profilePicture);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          } else {
            console.log(
              `File ${profilePicture} has been successfully deleted.`
            );
            updateProfilePicture();
          }
        });
      }
    } else {
      console.log(`File ${profilePicture} does not exist.`);
      updateProfilePicture();
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const editProfile = async (req, res) => {
  const { display_name, username } = req.body;

  if (!display_name || !username) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const profile_data = {
      display_name: display_name,
      username: username,
    };

    console.log(req.userId);

    const checkUsername = await db('users')
      .select('username')
      .where('username', username)
      .whereNot('user_id', req.userId);

    if (checkUsername.length > 0) {
      return res
        .status(409)
        .json({ status: 409, message: 'Username already taken.' });
    } else {
      await db('users').update(profile_data).where('user_id', req.userId);

      return (
        res.status(200),
        res.json({ status: 200, message: 'Successfully updated profile.' })
      );
    }
  } catch (err) {
    res.status(500).json(err);
  }

  res.json({
    status: 200,
    message: 'Profile updated successfully',
  });
};

const getBanReason = async (req, res) => {
  try {
    const query = await db('user_ban')
      .leftJoin('bans', 'user_ban.ban_id', 'bans.ban_id')
      .leftJoin(
        'report_categories',
        'bans.report_category_id',
        'report_categories.report_category_id'
      )
      .leftJoin('ban_appeals', 'bans.ban_id', 'ban_appeals.ban_id')
      .leftJoin(
        'ticket_statuses',
        'ban_appeals.ticket_status_id',
        'ticket_statuses.ticket_status_id'
      )
      .select(
        'user_ban.ban_id',
        'bans.report_category_id as ban_reason_id',
        'report_category_name as ban_reason',
        'ticket_status'
      )
      .where('user_id', req.userId)
      .where('ban_active', 1);

    return res.json(query[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const banAppeal = async (req, res) => {
  const deletePicture = () => {
    if (appeal_picture) {
      const filePath = path.join('./uploads/images/appeals', appeal_picture);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            console.error('Error storing product in the database: ', err);
          } else {
            console.log(`File ${product_image} has been successfully deleted.`);
            console.error('Error storing product in the database: ', err);
          }
        });
      }
    }
  };

  const { ban_id, appeal_information } = req.body;

  const appeal_picture = req.file ? req.file.filename : null;

  if (!ban_id || !appeal_information) {
    deletePicture();

    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const checkBan = await db('user_ban')
      .where('user_ban.ban_id', ban_id)
      .where('user_ban.ban_active', 1)
      .where('user_ban.user_id', req.userId)
      .leftJoin('bans', 'user_ban.ban_id', 'bans.ban_id')
      .whereNot('bans.report_category_id', 14);

    if (checkBan.length === 0) {
      deletePicture();
      return res.status(400).json({ message: 'Ban does not exist.' });
    }

    if (checkBan.length === 1) {
      const checkAppeal = await db('ban_appeals').where(
        'ban_appeals.ban_id',
        ban_id
      );

      if (checkAppeal.length > 0) {
        deletePicture();
        return res
          .status(400)
          .json({ message: 'Appeal can only be sent once.' });
      }

      if (checkAppeal.length === 0) {
        const insertAppeal = await db('ban_appeals').insert({
          ban_id: ban_id,
          appeal_information: appeal_information,
          appeal_picture: appeal_picture,
        });
        return res
          .status(201)
          .json({ message: 'Successfully sent ban appeal.' });
      }
    }
  } catch (err) {
    console.log(err);
    deletePicture();
    return res.status(500).json(err);
  }
};

module.exports = {
  getUsers,
  editProfilePicture,
  editProfile,
  getBanReason,
  banAppeal,
};
