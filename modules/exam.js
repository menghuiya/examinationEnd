/**created by 梦回 */
let mongoose = require("mongoose");
//用户的表结构
const ExamSchema = new mongoose.Schema(
  {
    title: String, //标题
    desc: String, //描述
    type: String, //类型 单选还是多选
    category: String, // 分类
    knowledge: String, //知识来源
    subject: String, //科目几
    options: Array, //选项
    answer: mongoose.Schema.Types.Mixed, //答案 因为有可能为数组
    status: {
      //状态 是否可以被提取出来使用
      type: Boolean,
      default: true,
    },
    create_time: Number, //创建时间
  },
  { versionKey: false }
);

module.exports = mongoose.model("Exam", ExamSchema);
