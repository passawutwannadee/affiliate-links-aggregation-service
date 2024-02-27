const db = require('../database/db');
const fs = require('fs');
const path = require('path');

const getUserReports = async (req, res) => {
  const status = req.query.status;
  const user_id = req.query.user_id;
  const report_id = req.query.report_id;
  const products = req.query.products;
  const collections = req.query.collections;
  const username = req.query.username;
  const cateogry_id = req.query['category-id'];
  const status_id = req.query['status-id'];

  try {
    let getUserReports = db('user_reports')
      .select(
        'report_id',
        'reporter_email',
        'report_information',
        'user_reports.ticket_status_id',
        'ticket_status',
        'product_id',
        'collection_id'
      )
      .select('user_reports.  user_id', 'username')
      .leftJoin('users', 'user_reports.user_id', 'users.user_id')
      .leftJoin(
        'report_categories',
        'user_reports.report_category_id',
        'report_categories.report_category_id'
      )
      .leftJoin(
        'ticket_statuses',
        'user_reports.ticket_status_id',
        'ticket_statuses.ticket_status_id'
      );

    if (status) {
      getUserReports = getUserReports.where('report_status', status);
    }

    if (user_id) {
      getUserReports = getUserReports.where('user_id', user_id);
    }

    if (report_id) {
      getUserReports = getUserReports.where('report_id', report_id);
    }

    console.log(products);

    if (products !== 'true' && collections !== 'true') {
      getUserReports = getUserReports
        .whereNull('product_id')
        .whereNull('collection_id');
    }

    if (products === 'true') {
      getUserReports = getUserReports
        .whereNotNull('product_id')
        .select('report_category_name as product_report_category');
    }

    if (collections === 'true') {
      getUserReports = getUserReports
        .whereNotNull('collection_id')
        .select('report_category_name as collection_report_category');
    }

    if (collections !== 'true' && products !== 'true') {
      getUserReports = getUserReports.select(
        'report_category_name as user_report_category'
      );
    }

    const result = await getUserReports;

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

const banUser = async (req, res) => {
  const { user_id, report_category_id, ban_reason_detail } = req.body;

  if (!user_id || !report_category_id || !ban_reason_detail) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    if (user_id === req.userId) {
      return res.status(400).json({ message: 'You cannot ban yourself.' });
    }

    const checkBan = await db('user_ban')
      .where('ban_active', 1)
      .where('user_id', user_id);

    const checkAdmin = await db('users')
      .where('user_id', user_id)
      .where('role_id', 2);

    if (checkBan.length === 0 && checkAdmin.length === 0) {
      const banReason = await db('bans')
        .insert({
          report_category_id: report_category_id,
          ban_reason_detail: ban_reason_detail,
        })
        .returning('ban_id');

      const banUser = await db('user_ban').insert({
        user_id: user_id,
        ban_id: banReason[0],
      });

      const resolved = await db('user_reports')
        .update({ ticket_status_id: 2 })
        .where('user_id', user_id);

      return res.status(201).json({ message: 'Succesfully banned user.' });
    }

    if (checkBan.length > 0) {
      return res.status(409).json({ message: 'User already banned.' });
    }

    if (checkAdmin.length > 0) {
      return res.status(409).json({ message: 'User is an admin.' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const warnUser = async (req, res) => {
  const removeProducts = async (productId) => {
    try {
      const getProductPicture = await db('products')
        .select('product_image')
        .where('product_id', productId);

      console.log(getProductPicture);

      if (!getProductPicture[0]) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (getProductPicture[0]) {
        const productImage = getProductPicture[0].product_image;

        const filePath = path.join('./uploads/images/products', productImage);

        const deleteProduct = await db('products')
          .del()
          .where('product_id', productId);

        if (deleteProduct === 0) {
          return res.status(204).json({ message: 'Product not found' });
        }

        if (deleteProduct === 1) {
          if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file: ${err}`);
              } else {
                console.log(
                  `File ${productImage} has been successfully deleted.`
                );
              }
            });
          } else {
            console.log(`File ${productImage} does not exist.`);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Error deleting product from the database: ', err);
      return res.status(500).json({ message: err });
    }
  };

  const {
    user_id,
    report_category_id,
    warn_reason_detail,
    product_id,
    collection_id,
  } = req.body;

  console.log(req.body);

  if (!product_id && !collection_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!user_id || !report_category_id || !warn_reason_detail) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    if (user_id === req.userId) {
      return res.status(400).json({ message: 'You cannot ban yourself.' });
    }

    const checkBan = await db('user_ban')
      .where('ban_active', 1)
      .where('user_id', user_id);

    const checkAdmin = await db('users')
      .where('user_id', user_id)
      .where('role_id', 2);

    if (checkBan.length === 0 && checkAdmin.length === 0 && product_id) {
      const getProductPicture = await db('products')
        .select('product_image')
        .where('product_id', product_id);

      if (!getProductPicture[0]) {
        return res.status(404).json({ message: 'Product not found' });
      }

      console.log(getProductPicture);

      if (getProductPicture[0]) {
        const productImage = getProductPicture[0].product_image;

        const filePath = path.join('./uploads/images/products', productImage);

        const deleteProduct = await db('products')
          .del()
          .where('product_id', product_id);

        if (deleteProduct === 0) {
          return res.status(204).json({ message: 'Product not found' });
        }

        console.log('-----------------------------------2');

        if (deleteProduct === 1) {
          if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file: ${err}`);
              } else {
                console.log(
                  `File ${productImage} has been successfully deleted.`
                );
              }
            });
          } else {
            console.log(`File ${productImage} does not exist.`);
          }
          const warnReason = await db('warns').insert({
            report_category_id: report_category_id,
            warn_reason_detail: warn_reason_detail,
            user_id: user_id,
          });

          const resolved = await db('user_reports')
            .update({ ticket_status_id: 2 })
            .where('user_id', user_id)
            .where('product_id', product_id);

          const checkWarn = await db('warns').where('user_id', user_id);

          if (checkWarn.length > 2) {
            const banReason = await db('bans')
              .insert({
                report_category_id: report_category_id,
                ban_reason_detail: 'This user recieved 3 or more warnings.',
              })
              .returning('ban_id');

            const banUser = await db('user_ban').insert({
              user_id: user_id,
              ban_id: banReason[0],
            });
          }

          return res
            .status(201)
            .json({ message: 'Succesfully warned user and removed product.' });
        }
      }
    }

    if (checkBan.length === 0 && checkAdmin.length === 0 && collection_id) {
      const deleteCollection = await db('collections')
        .del()
        .where('collection_id', collection_id);

      if (deleteCollection === 0) {
        return res.status(204).json({ message: 'Collection not found' });
      }

      if (deleteCollection === 1) {
        const warnReason = await db('warns').insert({
          report_category_id: report_category_id,
          warn_reason_detail: warn_reason_detail,
          user_id: user_id,
        });

        const resolved = await db('user_reports')
          .update({ ticket_status_id: 2 })
          .where('user_id', user_id)
          .where('collection_id', collection_id);

        const checkWarn = await db('warns').where('user_id', user_id);

        if (checkWarn.length > 2) {
          const banReason = await db('bans')
            .insert({
              report_category_id: report_category_id,
              ban_reason_detail: 'This user recieved 3 or more warnings.',
            })
            .returning('ban_id');

          const banUser = await db('user_ban').insert({
            user_id: user_id,
            ban_id: banReason[0],
          });
        }

        return res
          .status(201)
          .json({ message: 'Succesfully warned user and removed collection.' });
      }
    }

    if (checkBan.length > 0) {
      return res.status(409).json({ message: 'User already banned.' });
    }

    if (checkAdmin.length > 0) {
      return res.status(409).json({ message: 'User is an admin.' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getBanAppeals = async (req, res) => {
  try {
    const banAppealQuerry = await db('ban_appeals')
      .leftJoin('user_ban', 'ban_appeals.ban_id', 'user_ban.ban_id')
      .leftJoin('bans', 'user_ban.ban_id', 'bans.ban_id')
      .leftJoin('users', 'user_ban.user_id', 'users.user_id')
      .leftJoin(
        'report_categories',
        'bans.report_category_id',
        'report_categories.report_category_id'
      )
      .leftJoin(
        'ticket_statuses',
        'ban_appeals.ticket_status_id',
        'ticket_statuses.ticket_status_id'
      )
      .select(
        'appeal_id',
        'appeal_information',
        'ban_appeals.ticket_status_id',
        'ticket_status',
        'user_ban.user_id',
        'username',
        'display_name',
        'ban_appeals.ban_id',
        'report_category_name as ban_reason',
        'ban_reason_detail'
      );

    return res.status(200).json(banAppealQuerry); //
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const unbanUser = async (req, res) => {
  const { appeal_id, ban_id, user_id } = req.body;

  if (!user_id || !ban_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const unbanQuery = await db('user_ban')
      .update({ ban_active: 0 })
      .where('user_id', user_id)
      .where('ban_id', ban_id);

    if (unbanQuery === 0) {
      return res.status(404).send({ message: 'Ban not found' });
    }

    if (unbanQuery === 1) {
      const resolved = await db('ban_appeals')
        .update({ ticket_status_id: 2 })
        .where('appeal_id', appeal_id);

      return res.status(200).send({ message: 'Successfully unban user' });
    }
  } catch (err) {
    return res.status(500).send({ message: 'Internal server error.' });
  }
};

const getTicketStatuses = async (req, res) => {
  try {
    const get = await db('ticket_statuses').select(
      'ticket_status as value',
      'ticket_status as label'
    );

    return res.status(200).json(get);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

const updateTicket = async (req, res) => {
  const { report_id, appeal_id, ticket_status_id } = req.body;

  if (!report_id && !appeal_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (report_id && appeal_id) {
    return res.status(400).json({ message: 'Only report or appeal' });
  }

  if (!ticket_status_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    if (report_id) {
      const update = await db('user_reports')
        .update({ ticket_status_id: ticket_status_id })
        .where('report_id', report_id)
        .where('ticket_status_id', 1);

      if (update === 0) {
        return res
          .status(400)
          .json({ message: 'Ticket does not exist or already been closed' });
      }

      if (update === 1) {
        return res.status(200).json({ message: 'Successfully updated ticket' });
      }
    }

    if (appeal_id) {
      const update = await db('ban_appeals')
        .update({ ticket_status_id: ticket_status_id })
        .where('appeal_id', appeal_id)
        .where('ticket_status_id', 1);

      if (update === 0) {
        return res
          .status(400)
          .json({ message: 'Ticket does not exist or already been closed' });
      }

      if (update === 1) {
        return res.status(200).json({ message: 'Successfully updated ticket' });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getUserReports,
  getBanAppeals,
  banUser,
  unbanUser,
  warnUser,
  getTicketStatuses,
  updateTicket,
};
