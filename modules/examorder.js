/**created by 梦回 */
let mongoose = require("mongoose");
//用户的表结构
const ExamorderSchema = new mongoose.Schema(
  {
    paperId: mongoose.Schema.Types.ObjectId, //试卷id
    examId: mongoose.Schema.Types.ObjectId, //试题id
    userId: mongoose.Schema.Types.ObjectId, //试题id
    result: Boolean, //是否正确//考试结束后才会显示
    answer: mongoose.Schema.Types.Mixed, //用户答案 因为有可能为数组
    realAnwser: mongoose.Schema.Types.Mixed, //真正答案 因为有可能为数组
    create_time: Number, //创建时间
  },
  { versionKey: false }
);

module.exports = mongoose.model("Examorder", ExamorderSchema);
