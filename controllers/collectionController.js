// const db = require('../database/db');
// const multer = require('multer');
// const multerConfig = require('../utils/multer-product-config');
// const upload = multer(multerConfig.config).single(multerConfig.keyUpload);

// // Product function
// const createProduct = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       console.log(`error: ${JSON.stringify(err)}`);
//       return res.status(500).json({ message: err });
//     } else if (err) {
//       console.log(`error: ${JSON.stringify(err)}`);
//       return res.status(500).json({ message: err });
//     } else {
//       try {
//         const {
//           product_name,
//           product_description,
//           user_id,
//           category_id,
//           product_links,
//         } = req.body;

//         if (!product_name || !product_description || !user_id || !category_id) {
//           return res.status(400).json({ message: 'All fields are required' });
//         }

//         const product_image = req.file ? req.file.filename : null;
//         console.log(req.file);

//         const product_data = {
//           product_name: product_name,
//           product_description: product_description,
//           product_image: product_image,
//           user_id: user_id,
//           category_id: category_id,
//         };

//         // Check if the user already exists by searching for username
//         const insertProductResult = await db('products')
//           .returning('product_id')
//           .insert(product_data);

//         for (let i = 0; i < product_links.length; i++) {
//           const link_data = {
//             product_id: insertProductResult,
//             link: product_links[i],
//           };

//           const insertLinkResult = await db('product_links').insert(link_data);
//         }

//         res.json({
//           status: 'ok',
//           message: 'Product created successfully',
//         });
//       } catch (err) {
//         console.error('Error storing product in the database: ', err);
//         res.sendStatus(500);
//       }
//     }
//   });
// };

// module.exports = {
//   getCollections,
// };
