let mongoose = require("mongoose");
// 分类表结构
const CategorySchema = new mongoose.Schema(
  {
    name: String, //分类名
    value: String, //分类值 以后有用吧 别名
    color: {
      type: String,
      default: "#5e7ce0",
    },
    isOpen: {
      //该分类是否可用
      type: Boolean,
      default: true,
    },
    createTime: Number,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Category", CategorySchema);
