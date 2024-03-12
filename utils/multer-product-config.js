const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid');

module.exports = multerConfig = {
  config: {
    storage: multer.diskStorage({
      destination: (req, file, next) => {
        const folder = './uploads/images/products';
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder);
        }
        next(null, folder);
      },
      filename: (req, file, next) => {
        const ext = file.mimetype.split('/')[1];
        const date = new Date();
        console.log('uploaded');
        next(
          null,
          `${req.userId}-${uuid.v4().replace(/-/g, '')}-${date.getFullYear()}-${
            date.getMonth() + 1
          }-${date.getDate()}-${date
            .toTimeString()
            .split(' ')[0]
            .replaceAll(':', '')}.${ext}`
        );
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, next) => {
      const image = file.mimetype.startsWith('image/');
      if (image) {
        next(null, true);
      } else {
        next({ message: 'File type not supported' }, false);
      }
    },
  },
  keyUpload: 'product_image',
};
