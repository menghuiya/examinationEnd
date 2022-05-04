let mongoose = require("mongoose");
//用户的表结构
const AdminSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    create_time: {
      type: String,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Admin", AdminSchema);
