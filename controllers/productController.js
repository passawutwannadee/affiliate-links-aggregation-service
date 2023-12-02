const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-product-config');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);

// Get products
const getProducts = async (req, res) => {
  try {
    const product_id = req.query.product_id;
    const user_id = req.query.user_id;

    if (!user_id && !product_id) {
      return res
        .status(400)
        .json({ error: 'user_id or product_id are required' });
    }

    let query = db('products');

    if (product_id) {
      query = query.where('products.product_id', product_id);
    }

    if (user_id) {
      query = query.where('products.user_id', user_id);
    }

    query
      .leftJoin(
        'product_links',
        'products.product_id',
        'product_links.product_id'
      )
      .select(
        db.raw(
          'products.product_id, products.product_name, products.product_description, products.product_image, products.category_id , GROUP_CONCAT(product_links.link) as links'
        )
      )
      .groupBy('products.product_id');

    const products = await query;

    products.forEach((row) => {
      row.links = row.links !== null ? row.links.split(',') : [];
    });

    res.json(products);
  } catch (err) {
    console.error('Error storing product in the database: ', err);
    res.sendStatus(500);
  }
};

// Product function
const createProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log(`error: ${JSON.stringify(err)}`);
      return res.status(500).json({ message: err });
    } else if (err) {
      console.log(`error: ${JSON.stringify(err)}`);
      return res.status(500).json({ message: err });
    } else {
      try {
        const {
          product_name,
          product_description,
          user_id,
          category_id,
          product_links,
        } = req.body;

        if (!product_name || !product_description || !user_id || !category_id) {
          return res.status(400).json({ message: 'All fields are required' });
        }

        const product_image = req.file ? req.file.filename : null;
        console.log(req.file);

        const product_data = {
          product_name: product_name,
          product_description: product_description,
          product_image: product_image,
          user_id: user_id,
          category_id: category_id,
        };

        // Check if the user already exists by searching for username
        const insertProductResult = await db('products')
          .returning('product_id')
          .insert(product_data);

        for (let i = 0; i < product_links.length; i++) {
          const link_data = {
            product_id: insertProductResult,
            link: product_links[i],
          };

          const insertLinkResult = await db('product_links').insert(link_data);
        }

        res.json({
          status: 'ok',
          message: 'Product created successfully',
        });
      } catch (err) {
        console.error('Error storing product in the database: ', err);
        res.sendStatus(500);
      }
    }
  });
};

// verifyEmail Function
const updateProduts = async (req, res) => {
  const { email_verify_token } = req.body;

  if (!email_verify_token) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const getUser = await db('users')
      .select('user_id')
      .where('email_verify_token', email_verify_token);

    const verify = await db('users')
      .where('user_id', getUser[0].user_id)
      .update({
        email_verify_token: null,
        email_verify: 1,
      });
    res.status(200).json({ message: 'Successfully verified email.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  getProducts,
  createProduct,
};
