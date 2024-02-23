const db = require('../database/db');
const multer = require('multer');
const multerConfig = require('../utils/multer-product-config');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);

// Get products
const getCollections = async (req, res) => {
  try {
    const collectionId = req.query.collectionId;
    const username = req.query.username;
    const limit = parseInt(req.query._limit) || null;
    const page = parseInt(req.query._page) || 1;
    const offset = (page - 1) * limit;

    if (!username && !collectionId) {
      return res
        .status(400)
        .json({ error: 'username or collectionId is required' });
    }

    let query = db('collections')
      .leftJoin('users', 'collections.user_id', 'users.user_id')
      .groupBy('collections.collection_id');

    if (collectionId) {
      query
        .where('collections.collection_id', collectionId)
        .select(
          db.raw(
            `collections.collection_id, collections.collection_name, users.display_name, users.username, CONCAT("${process.env.USER_LINK_PATH}", 
          users.profile_picture) as profile_picture, collection_description`
          )
        )
        .whereNotExists(function () {
          this.select(db.raw(1))
            .from('user_ban')
            .leftJoin('users', 'user_ban.user_id', 'users.user_id')
            .leftJoin('collections', 'collections.user_id', 'users.user_id')
            .where('collections.collection_id', collectionId)
            .where('user_ban.ban_active', 1);
        });

      const collection = await query;

      if (collection.length === 0 && collectionId) {
        return res
          .status(404)
          .json({ status: 404, message: 'Collection not found.' });
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
            `products.product_id, products.product_name, users.display_name, users.username, CONCAT("${process.env.USER_LINK_PATH}", 
            users.profile_picture) as profile_picture, products.product_description, CONCAT("${process.env.PRODUCT_LINK_PATH}", 
            products.product_image) as product_image, products.category_id , GROUP_CONCAT(product_links.link) as links`
          )
        )
        .groupBy('products.product_id');

      products.forEach((row) => {
        row.links = row.links !== null ? row.links.split(',') : [];
      });

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
        .leftJoin(
          'product_collection',
          'collections.collection_id',
          'product_collection.collection_id'
        )
        .leftJoin(
          'products',
          'product_collection.product_id',
          'products.product_id'
        )
        .select(
          db.raw(
            `collections.collection_id, collections.collection_name, collections.collection_description, GROUP_CONCAT("${process.env.PRODUCT_LINK_PATH}", products.product_image) as product_images`
          )
        )
        .whereNotExists(function () {
          this.select(db.raw(1))
            .from('user_ban')
            .leftJoin('users', 'user_ban.user_id', 'users.user_id')
            .where('users.username', username)
            .where('user_ban.ban_active', 1);
        });

      if (limit && page) {
        query = query.limit(limit).offset(offset);
      }

      const collection = await query;

      collection.forEach((row) => {
        row.product_images =
          row.product_images !== null ? row.product_images.split(',') : [];
      });

      if (limit && page) {
        const totalCount = await db('collections')
          .count('collection_id as totalCount') // Assuming 'id' is the primary key of your table
          .first()
          .leftJoin('users', 'collections.user_id', 'collections.user_id')
          .where('users.username', username)
          .whereNotExists(function () {
            this.select(db.raw(1))
              .from('user_ban')
              .leftJoin('users', 'user_ban.user_id', 'users.user_id')
              .where('users.username', username)
              .where('user_ban.ban_active', 1);
          });

        const hasNextPage = totalCount.totalCount > offset + limit;
        const nextPage = hasNextPage ? page + 1 : null;
        const hasPreviousPage = totalCount.totalCount <= offset + limit;
        const previousPage = hasPreviousPage ? page - 1 : null;

        return res.json({
          data: collection,
          next_page: nextPage,
          previous_page: previousPage,
        });
      } else {
        return res.status(200).json(collection);
      }
    }
  } catch (err) {
    console.error('Error getting product from the database: ', err);
    return res.sendStatus(500);
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

// Product function
const manageCollection = async (req, res) => {
  const { collection_id, products, collection_name, collection_description } =
    req.body;

  if (
    !collection_id ||
    !products ||
    !collection_name ||
    !collection_description
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const collection_data = {
    collection_name: collection_name,
    collection_description: collection_description,
    user_id: req.userId,
  };

  const insertCollectionResult = await db('collections')
    .update(collection_data)
    .where('collection_id', collection_id)
    .where('user_id', req.userId);

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

    const removeFromCollection = await db('product_collection')
      .where('collection_id', collection_id)
      .whereNotIn('product_id', products)
      .del();

    for (let i = 0; i < products.length; i++) {
      const product_data = {
        collection_id: collection_id,
        product_id: products[i],
      };

      const insertCollectionResult = await db('product_collection')
        .insert(product_data)
        .where('user_id', req.userId)
        .onConflict('collection_id', 'product_id')
        .ignore();
    }

    return res.status(201).json({
      status: 201,
      message: 'Successfully added product(s) to collection.',
    });
  } catch (err) {
    console.error(
      'Error storing products to collection in the database: ',
      err
    );
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
      return res.status(204).json({ message: 'Collection not found' });
    }

    if (deleteCollection === 1) {
      return res.status(200).json({ message: 'Successfully deleted product.' });
    }
  } catch (err) {
    console.error('Error deleting collection from the database: ', err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  createCollections,
  manageCollection,
  getCollections,
  removeCollections,
};
