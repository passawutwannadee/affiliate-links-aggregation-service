const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-product-config');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);
const fs = require('fs');
const path = require('path');

// Get products
const getProducts = async (req, res) => {
  try {
    const product_id = req.query.product_id;
    const username = req.query.username;

    if (!username && !product_id) {
      return res
        .status(400)
        .json({ error: 'username or product_id are required' });
    }

    let query = db('products');

    if (product_id) {
      query = query
        .where('products.product_id', product_id)
        .leftJoin(
          'product_links',
          'products.product_id',
          'product_links.product_id'
        )
        .select(
          db.raw(
            `products.product_id, products.product_name, users.display_name, users.username, CONCAT("${process.env.USER_LINK_PATH}", 
          users.profile_picture) as profile_picture, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}", 
          products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
          )
        );
    }

    if (username) {
      query = query
        .where('users.username', username)
        .leftJoin(
          'product_links',
          'products.product_id',
          'product_links.product_id'
        )
        .select(
          db.raw(
            `products.product_id, products.product_name, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}", 
            products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
          )
        );
    }

    query
      .leftJoin('users', 'products.user_id', 'users.user_id')
      .groupBy('products.product_id');

    const products = await query;

    products.forEach((row) => {
      row.links = row.links !== null ? row.links.split(',') : [];
    });

    res.json(products);
  } catch (err) {
    console.error('Error getting product from the database: ', err);
    res.sendStatus(500);
  }
};

// Get products
const getProductCategories = async (req, res) => {
  try {
    const getCategories = await db('categories').select(
      'category_id',
      'category_name'
    );

    return res.status(200).json(getCategories);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create products
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
          category_id,
          product_links,
        } = req.body;

        if (!product_name || !product_description || !category_id) {
          const product_image = req.file ? req.file.filename : null;

          const filePath = path.join(
            './uploads/images/products',
            product_image
          );

          if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file: ${err}`);
                console.error('Error storing product in the database: ', err);

                return res
                  .status(400)
                  .json({ message: 'All fields are required' });
              } else {
                console.log(
                  `File ${product_image} has been successfully deleted.`
                );
                console.error('Error storing product in the database: ', err);

                return res
                  .status(400)
                  .json({ message: 'All fields are required' });
              }
            });
          }
        }

        const product_image = req.file ? req.file.filename : null;
        console.log(req.file);

        const product_data = {
          product_name: product_name,
          product_description: product_description,
          product_image: product_image,
          user_id: req.userId,
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

        return res.status(201).json({
          status: 201,
          message: 'Product created successfully',
        });
      } catch (err) {
        const product_image = req.file ? req.file.filename : null;

        const filePath = path.join('./uploads/images/products', product_image);

        if (fs.existsSync(filePath)) {
          // Delete the file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err}`);
              console.error('Error storing product in the database: ', err);
              res.sendStatus(500);
            } else {
              console.log(
                `File ${product_image} has been successfully deleted.`
              );
              console.error('Error storing product in the database: ', err);
              res.sendStatus(500);
            }
          });
        }
      }
    }
  });
};

// Edit products
const editProducts = async (req, res) => {
  try {
    return res.status(200).json(getCategories);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Remove products
const removeProducts = async (req, res) => {
  const productId = req.query.id;

  if (!productId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const getProductPicture = await db('products')
      .select('product_image')
      .where('product_id', productId);

    console.log(getProductPicture);

    if (!getProductPicture[0]) {
      return res.status(204).json({ message: 'Product not found' });
    }

    if (getProductPicture[0]) {
      const productImage = getProductPicture[0].product_image;

      const filePath = path.join('./uploads/images/products', productImage);

      const deleteProduct = await db('products')
        .del()
        .where('product_id', productId)
        .where('products.user_id', req.userId);

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
        return res
          .status(200)
          .json({ message: 'Successfully deleted product.' });
      }
    }
  } catch (err) {
    console.error('Error deleting product from the database: ', err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  getProducts,
  createProduct,
  removeProducts,
  getProductCategories,
};
