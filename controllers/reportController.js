const db = require('../database/db');

// Get products
const getReports = async (req, res) => {
  console.log('hello');
  // try {
  //   const product_id = req.query.product_id;
  //   const username = req.query.username;

  //   if (!username && !product_id) {
  //     return res
  //       .status(400)
  //       .json({ error: 'username or product_id are required' });
  //   }

  //   let query = db('products');

  //   if (product_id) {
  //     query = query
  //       .where('products.product_id', product_id)
  //       .leftJoin(
  //         'product_links',
  //         'products.product_id',
  //         'product_links.product_id'
  //       )
  //       .select(
  //         db.raw(
  //           `products.product_id, products.product_name, users.display_name, users.username, CONCAT("${process.env.USER_LINK_PATH}",
  //         users.profile_picture) as profile_picture, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}",
  //         products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
  //         )
  //       );
  //   }

  //   if (username) {
  //     query = query
  //       .where('users.username', username)
  //       .leftJoin(
  //         'product_links',
  //         'products.product_id',
  //         'product_links.product_id'
  //       )
  //       .select(
  //         db.raw(
  //           `products.product_id, products.product_name, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}",
  //           products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
  //         )
  //       );
  //   }

  //   query
  //     .leftJoin('users', 'products.user_id', 'users.user_id')
  //     .groupBy('products.product_id');

  //   const products = await query;

  //   products.forEach((row) => {
  //     row.links = row.links !== null ? row.links.split(',') : [];
  //   });

  //   res.json(products);
  // } catch (err) {
  //   console.error('Error getting product from the database: ', err);
  //   res.sendStatus(500);
  // }
};

const createReports = async (req, res) => {
  const {
    report_category_id,
    report_information,
    username,
    product_id,
    collection_id,
  } = req.body;

  if (product_id && collection_id) {
    return res
      .status(400)
      .json({ message: 'Cannot report both product and collection.' });
  }

  if (!report_category_id || !report_information || !username) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const getReporter = await db('users')
      .select('email')
      .where('user_id', req.userId);

    const getUser = await db('users')
      .select('user_id')
      .where('username', username);

    if (product_id) {
      const getProduct = await db('products')
        .select('product_id')
        .where('product_id', product_id);

      if (getProduct.length === 0) {
        return res.status(404).json({ message: 'Product does not exist.' });
      }
    }

    if (collection_id) {
      const getCollection = await db('collections')
        .select('collection_id')
        .where('collection_id', collection_id);

      if (getCollection.length === 0) {
        return res.status(404).json({ message: 'Collection does not exist.' });
      }
    }

    // const getUser = await getUserQuery;

    if (getUser.length === 0) {
      return res.status(404).json({ message: 'User does not exist.' });
    }

    if (getUser[0]['user_id'] === req.userId) {
      return res.status(400).json({ message: 'You cannot report yourself.' });
    }

    const reportData = {
      reporter_email: getReporter[0]['email'],
      report_category_id: report_category_id,
      report_information: report_information,
      product_id: product_id,
      collection_id: collection_id,
      user_id: getUser[0]['user_id'],
    };

    const insertReport = await db('user_reports').insert(reportData);

    return res
      .status(201)
      .json({ status: 201, message: 'Report ticket successfully created' });
  } catch (err) {
    console.error('Error storing product in the database: ', err);
    return res.sendStatus(500);
  }
};

const getReportCategories = async (req, res) => {
  const report_category_parent_id = req.query.parentId;

  if (!report_category_parent_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let query = db('report_categories').select(
      'report_category_id',
      'report_category_name',
      'report_category_name as value',
      'report_category_name as label'
    );

    if (report_category_parent_id !== '0') {
      query = query.where(
        'report_category_parent_id',
        report_category_parent_id
      );
    }

    const getCategories = await query;

    return res.status(200).json(getCategories);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

module.exports = {
  getReports,
  createReports,
  getReportCategories,
};
