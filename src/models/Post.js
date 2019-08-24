const mongoose = require("mongoose");
const aws = require("aws-sdk");
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

//Não é passado parameters pra classe, pois os mesmos estão definidos no dotenv
const s3 = new aws.S3();

const PostSchema = new mongoose.Schema({
  name: String,
  size: Number,
  key: String,
  url: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* Verifica se há uma url definida para a imagem referente ao storage de aws e caso
não tenha, ou seja, seja local, define o path de armazenamento como url*/
PostSchema.pre("save", function() {
  if (!this.url) {
    this.url = `${process.env.APP_URL}/files/${this.key}`;
  }
});

/*Tem por finalidade remover a imagem do storage da aws S3 ou local antes de remover do MongoDB*/
PostSchema.pre("remove", function() {
  if (process.env.STORAGE_TYPE === "s3") {
    return s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET,
        Key: this.key
      })
      .promise();
  } else {
      //promisify tranforma antigas callback functions em async
      return promisify(fs.unlink)(path.resolve(__dirname, '..', '..', 'tmp', 'uploads', this.key))
  }
});

module.exports = mongoose.model("Post", PostSchema);
