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
    const limit = parseInt(req.query._limit) || null;
    const page = parseInt(req.query._page) || 1;
    const offset = (page - 1) * limit;
    let category_id = parseInt(req.query.category_id);
    const product_name = req.query['product-name'];

    if (category_id === 0) {
      category_id = null;
    }

    console.log('category', category_id);

    if (!username && !product_id) {
      return res
        .status(400)
        .json({ error: 'username or product_id are required' });
    }

    let query = db('products');

    if (product_id) {
      query = query
        .where('products.product_id', product_id)
        .whereNotExists(function () {
          this.select(db.raw(1))
            .from('user_ban')
            .leftJoin('users', 'user_ban.user_id', 'users.user_id')
            .leftJoin('products', 'users.user_id', 'products.user_id')
            .where('products.product_id', product_id)
            .where('user_ban.ban_active', 1);
        });
    }

    if (username) {
      query = query
        .where('users.username', username)
        .whereNotExists(function () {
          this.select(db.raw(1))
            .from('user_ban')
            .leftJoin('users', 'user_ban.user_id', 'users.user_id')
            .where('users.username', username)
            .where('user_ban.ban_active', 1);
        });
    }

    if (limit && page) {
      query = query.limit(limit).offset(offset);
    }

    if (category_id) {
      query = query.where('products.category_id', category_id);
    }

    if (product_name) {
      query = query.where('product_name', 'like', `%${product_name}%`);
    }

    query
      .leftJoin('users', 'products.user_id', 'users.user_id')
      .groupBy('products.product_id')
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

    let products = await query;

    if (products.length === 0 && product_id) {
      return res
        .status(204)
        .json({ status: 204, message: 'Product not found.' });
    }
    products.forEach((row) => {
      row.links = row.links !== null ? row.links.split(',') : [];
    });

    if (limit && page) {
      let query = db('products')
        .count('product_id as totalCount') // Assuming 'id' is the primary key of your table
        .first()
        .leftJoin('users', 'products.user_id', 'users.user_id')
        .where('users.username', username)
        .whereNotExists(function () {
          this.select(db.raw(1))
            .from('user_ban')
            .leftJoin('users', 'user_ban.user_id', 'users.user_id')
            .where('users.username', username)
            .where('user_ban.ban_active', 1);
        });

      if (category_id) {
        query = query.where('products.category_id', category_id);
      }

      if (product_name) {
        query = query.where('product_name', 'like', `%${product_name}%`);
      }

      let totalCount = await query;

      console.log(totalCount.totalCount);
      const hasNextPage = totalCount.totalCount > offset + limit;
      const nextPage = hasNextPage ? page + 1 : null;
      const hasPreviousPage = totalCount.totalCount <= offset + limit;
      const previousPage = hasPreviousPage ? page - 1 : null;

      return res.json({
        data: products,
        next_page: nextPage,
        previous_page: previousPage,
      });
    } else {
      return res.json(products);
    }
  } catch (err) {
    console.error('Error getting product from the database: ', err);
    return res.sendStatus(500);
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
  try {
    const { product_name, product_description, category_id, other_category } =
      req.body;

    let product_links = req.body.product_links;

    product_links = product_links.slice(0, 4);

    const product_image = req.file ? req.file.filename : null;

    if (!product_image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (category_id === '16' && !other_category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (category_id !== '16' && other_category) {
      return res
        .status(400)
        .json({ message: 'Other category field not required' });
    }

    if (
      !product_name ||
      !product_description ||
      !category_id ||
      !product_links
    ) {
      const filePath = path.join('./uploads/images/products', product_image);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            console.error('Error storing product in the database: ', err);

            return res.status(400).json({ message: 'All fields are required' });
          } else {
            console.log(`File ${product_image} has been successfully deleted.`);
            console.error('Error storing product in the database: ', err);

            return res.status(400).json({ message: 'All fields are required' });
          }
        });
      }
    } else {
      const product_data = {
        product_name: product_name,
        product_description: product_description,
        product_image: product_image,
        user_id: req.userId,
        category_id: category_id,
        other_category: other_category,
      };

      const insertProductResult = await db('products')
        .returning('product_id')
        .insert(product_data);

      req.body.productId = insertProductResult;

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
    }
  } catch (error) {
    console.log(error);
    const product_image = req.file ? req.file.filename : null;

    if (product_image) {
      const filePath = path.join('./uploads/images/products', product_image);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            console.error('Error storing product in the database: ', error);
            return res.sendStatus(500);
          } else {
            console.log(`File ${product_image} has been successfully deleted.`);
            console.error('Error storing product in the database: ', err);
            return res.sendStatus(500);
          }
        });
      }
    } else {
      return res.sendStatus(500);
    }
  }
};

// Edit products
const editProducts = async (req, res) => {
  const { product_id, product_name, product_description, category_id } =
    req.body;

  let product_links = req.body.product_links;

  product_links = product_links.slice(0, 4);

  console.log('run function');

  const product_image = req.file ? req.file.filename : null;

  console.log(product_image);

  let filePath;

  if (product_image) {
    filePath = path.join('./uploads/images/products', product_image);
  }

  try {
    if (
      !product_id ||
      !product_name ||
      !product_description ||
      !category_id ||
      !product_links
    ) {
      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            return res.status(400).json({ message: 'All fields are required' });
          } else {
            return res.status(400).json({ message: 'All fields are required' });
          }
        });
      }
    } else {
      const getProduct = await db('products')
        .where('product_id', product_id)
        .where('user_id', req.userId);

      if (getProduct.length === 0) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            return res.status(204).json({ message: 'Product does not exist.' });
          } else {
            console.log(`File ${product_image} has been successfully deleted.`);
            return res.status(204).json({ message: 'Product does not exist.' });
          }
        });
      } else {
        let product_data;

        if (product_image) {
          product_data = {
            product_name: product_name,
            product_description: product_description,
            product_image: product_image,
            user_id: req.userId,
            category_id: category_id,
          };

          const getOldImage = await db('products')
            .select('product_image')
            .where('product_id', product_id)
            .where('user_id', req.userId);

          if (getOldImage.length === 1) {
            const oldFilePath = path.join(
              './uploads/images/products',
              getOldImage[0]['product_image']
            );

            console.log(getOldImage[0]['product_image']);

            if (fs.existsSync(oldFilePath)) {
              // Delete the file
              fs.unlink(oldFilePath, (err) => {
                if (err) {
                  console.error(`Error deleting file: ${err}`);
                } else {
                  console.log(
                    `Successfully deleted ${getOldImage[0]['product_image']}`
                  );
                }
              });
            }
          }
        }

        if (!product_image) {
          product_data = {
            product_name: product_name,
            product_description: product_description,
            user_id: req.userId,
            category_id: category_id,
          };
        }

        const updateProductResult = await db('products')
          .where('product_id', product_id)
          .where('user_id', req.userId)
          .update(product_data);

        let deleteLinkQuery = db('product_links')
          .where('product_id', product_id)
          .delete();

        for (let i = 0; i < product_links.length; i++) {
          const link_data = {
            product_id: product_id,
            link: product_links[i],
          };

          const insertLinkResult = await db('product_links')
            .insert(link_data)
            .onConflict('link')
            .ignore();

          deleteLinkQuery.whereNot('link', product_links[i]);
        }

        const deleteLinks = await deleteLinkQuery;

        return res.status(201).json({
          status: 201,
          message: 'Product created successfully',
        });
      }
    }
  } catch (error) {
    const product_image = req.file ? req.file.filename : null;

    if (product_image) {
      const filePath = path.join('./uploads/images/products', product_image);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
            console.error('Error storing product in the database: ', error);
            res.sendStatus(500);
          } else {
            console.log(`File ${product_image} has been successfully deleted.`);
            console.error('Error storing product in the database: ', error);
            res.sendStatus(500);
          }
        });
      }
    } else {
      return res.sendStatus(500);
    }
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
      .select('product_image', 'product_name')
      .where('product_id', productId);

    console.log('get product', getProductPicture[0]);

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

        const deleteReports = await db('user_reports')
          .where('product_id', productId)
          .del();

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
  editProducts,
  removeProducts,
  getProductCategories,
};
