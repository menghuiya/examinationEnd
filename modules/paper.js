let mongoose = require("mongoose");
//用户的表结构
const PaperSchema = new mongoose.Schema(
  {
    title: String, //试卷名称 到时候前端生成
    type: {
      // 试卷类型 user  系统 system
      type: String,
      default: "user",
    },
    category: String, // 分类
    subject: String, //科目几
    userId: mongoose.Schema.Types.ObjectId, //试题id
    total: {
      type: Number,
      default: 43,
    }, //试题总数，这个没意义 都是43
    right: {
      type: Number,
      default: 0,
    }, //正确数量，这里就不存错误的了
    start_time: Number, //开始时间
    end_time: Number, //结束时间
    isPass: {
      type: Boolean,
      default: false,
    }, //是否通过
    status: {
      type: Number,
      default: 1,
    }, //试卷状态 1未开始 2进行中 3结束
    create_time: Number,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Paper", PaperSchema);
