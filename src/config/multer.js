require("dotenv").config();

const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const path = require("path");
const crypto = require("crypto");

const storageTypes = {
  //Regras para storage local
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "..", "tmp", "uploads"));
    },
    filename: (req, file, cb) => {
      //o Crypto define uma hash para tornar a key única do file
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        file.key = `${hash.toString("hex")}-${file.originalname}`;

        cb(null, file.key);
      });
    }
  }),
  //Regras para storage no aws S3
  s3: multerS3({
    s3: new aws.S3(),
    // Local de Storage na S3
    bucket: process.env.AWS_BUCKET,
    // Tipo do conteúdo armazenado
    contentType: multerS3.AUTO_CONTENT_TYPE,
    //Regra de acesso
    acl: "public-read",
    key: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        const filename = `${hash.toString("hex")}-${file.originalname}`;

        cb(null, filename);
      });
    }
  })
};

module.exports = {
  dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
  // Define qual storage vai usar a partir do dotenv (local ou s3)
  storage: storageTypes[process.env.STORAGE_TYPE],
  // Limit do size do arquivo para upload (2mb)
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    //Define as extensões validas para os arquivos
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  }
};
