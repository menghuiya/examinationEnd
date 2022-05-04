const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const userController = require("../controllers/userController");
const examController = require("../controllers/examController");
const paperController = require("../controllers/paperController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//增加管理员账号 记得改路由或删掉
router.get("/addAdmin", adminController.add);

//用户列表
router.get("/users", userController.list);

//文件上传
router.all("/upload", function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*");
  //允许的header类型
  res.header("Access-Control-Allow-Headers", "*");
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
  if (req.method.toLowerCase() == "options") res.sendStatus(200);
  //让options尝试请求快速结束
  else next();
});
let storage = multer.diskStorage({
  //确定图片存储的位置
  destination: function (req, file, cb) {
    cb(null, "./public/upload/images");
  },
  //确定图片存储时的名字,注意，如果使用原名，可能会造成再次上传同一张图片的时候的冲突
  filename: function (req, file, cb) {
    cb(null, "upload_" + Date.now() + path.extname(file.originalname));
  },
});
//生成的专门处理上传的一个工具，可以传入storage、limits等配置
let upload = multer({ storage: storage });
//接收上传图片请求的接口
router.post("/upload", upload.single("file"), function (req, res, next) {
  //图片已经被放入到服务器里,且req也已经被upload中间件给处理好了（加上了file等信息）
  //线上的也就是服务器中的图片的绝对地址
  let url = "/public/upload/images/" + req.file.filename;
  res.json({
    code: 200,
    message: "上传成功",
    url: url,
  });
});

//获取分类列表-其他页面
router.get("/examcate", adminController.examcateList);
//获取分类列表-管理页使用
router.get("/category", adminController.cateList);
//新增分类
router.post("/category", adminController.addCate);
//更新分类
router.put("/category", adminController.updateCate);
//删除分类
router.delete("/category", adminController.deleteCate);

//新增试卷
router.post("/paper", paperController.create);
//获取试卷列表
router.get("/papers", paperController.list);
//获取试卷试题
router.get("/paperexam", examController.getEaxmByPaperId);
//开始考试
router.post("/updatepaper", paperController.updateStatus);
//提交试卷
router.post("/paperexam", paperController.handlePaper);
//考完查看试卷试题
router.get("/checkpaper", paperController.getCheckEaxmByPaperId);

//获取试题列表
router.get("/exams", examController.list);
//新增试题
router.post("/exam", examController.create);
//获取随机试题
router.get("/examrandom", examController.random);
// //获取单个试题
// router.get("/exam", examController.one);
// //删除试题
// router.delete("/exam", examController.delete);
// //修改试题
// router.put("/exam", examController.put);
// //获取最新试题
// router.get("/articles", examController.new);
// //获取热门试题
// router.get("/hotart", examController.hot);
// //试题点赞
// router.post("/article/good", examController.good);

//用户注册
router.post("/register", userController.add);
//用户登录
router.post("/login", userController.login);
//用户退出
router.post("/logout", userController.logout);
//用户更新
router.put("/user", userController.update);
//删除用户
router.delete("/user", userController.delete);

//获取排行榜
router.get("/rank", paperController.rank);

module.exports = router;
