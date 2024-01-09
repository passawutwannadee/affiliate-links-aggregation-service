const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-product-config');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);

// Get products
const getCollections = async (req, res) => {
  try {
    const collectionId = req.query.collectionId;
    const username = req.query.username;

    if (!username && !collectionId) {
      return res
        .status(400)
        .json({ error: 'username or collectionId is required' });
    }

    let query = db('collections')
      .leftJoin('users', 'collections.user_id', 'users.user_id')
      .groupBy('collections.collection_id');

    if (collectionId) {
      query.where('collections.collection_id', collectionId).select(
        db.raw(
          `collections.collection_id, collections.collection_name, users.display_name, CONCAT("${process.env.USER_LINK_PATH}", 
          users.profile_picture) as profile_picture, collection_description`
        )
      );

      const collection = await query;

      if (collection.length === 0) {
        return res
          .status(404)
          .json({ status: 404, message: 'Resource not found.' });
      }

      const products = await db('product_collection')
        .where('collection_id', collectionId)
        .leftJoin(
          'products',
          'product_collection.product_id',
          'products.product_id'
        )
        .leftJoin(
          'product_links',
          'products.product_id',
          'product_links.product_id'
        )
        .leftJoin('users', 'products.user_id', 'users.user_id')
        .select(
          db.raw(
            `products.product_id, products.product_name, users.username, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}", 
          products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
          )
        )
        .groupBy('products.product_id');

      if (collection.length === 1) {
        const result = [];
        result.push(collection[0]);
        result.push(products);

        collection[0]['products'] = products;

        return res.status(200).json(collection[0]);
      }
    }

    if (username) {
      query
        .where('users.username', username)
        .select(
          db.raw(
            `collections.collection_id, collections.collection_name, collections.collection_description`
          )
        );
      const collection = await query;
      res.status(200).json(collection);
    }
  } catch (err) {
    console.error('Error getting product from the database: ', err);
    res.sendStatus(500);
  }
};

// Product function
const createCollections = async (req, res) => {
  const { collection_name, collection_description, products } = req.body;

  if (!collection_name || !collection_description || !products) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    for (let i = 0; i < products.length; i++) {
      const getProduct = await db('products')
        .select('product_name')
        .where('product_id', products[i])
        .where('user_id', req.userId);

      if (!getProduct[0]) {
        return res.status(400).json({
          status: 400,
          message: 'Please insert only product that exist',
        });
      }
    }

    const collection_data = {
      collection_name: collection_name,
      collection_description: collection_description,
      user_id: req.userId,
    };

    const insertCollectionResult = await db('collections')
      .returning('collection_id')
      .insert(collection_data);

    const collectionId = insertCollectionResult[0];

    for (let i = 0; i < products.length; i++) {
      const product_data = {
        collection_id: collectionId,
        product_id: products[i],
      };

      const insertCollectionResult = await db('product_collection').insert(
        product_data
      );
    }

    return res
      .status(201)
      .json({ status: 201, message: 'Collection successfully added' });
  } catch (err) {
    console.error('Error storing product in the database: ', err);
    return res.sendStatus(500);
  }
};

// Remove products
const removeCollections = async (req, res) => {
  const collectionId = req.query.collectionId;

  if (!collectionId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const deleteCollection = await db('collections')
      .del()
      .where('collection_id', collectionId)
      .where('collections.user_id', req.userId);

    if (deleteCollection === 0) {
      return res.status(204).json({ message: 'Product not found' });
    }

    if (deleteCollection === 1) {
      return res.status(200).json({ message: 'Successfully deleted product.' });
    }
  } catch (err) {
    console.error('Error deleting product from the database: ', err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  createCollections,
  getCollections,
  removeCollections,
};
