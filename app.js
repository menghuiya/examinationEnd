const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
//加载数据库模块
let mongoose = require("mongoose");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();
app.use(
  session({
    secret: "MHKEXINTEST", //字符串加密
    resave: false,
    name: "KEXINID" /*保存在本地cookie的一个名字 默认connect.sid  可以不设置*/,
    cookie: { maxAge: 86400000 }, //过期时间
    saveUninitialized: true, //无论是否使用,都默认使用,强制将未初始化的 session 存储。  默认值是true  建议设置成true
    rolling: true, //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
  })
);
app.use("/public", express.static(__dirname + "/public"));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", require("./routes/api"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(500).json({
    code: "MH0000",
    msg: "系统繁忙,请稍后再试",
    data: null,
  });
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//监听http请求
mongoose.connect("mongodb://127.0.0.1:27017/kexin", function (err) {
  if (err) {
    console.log("数据库连接失败");
  } else {
    console.log("数据连接成功");
  }
});

module.exports = app;
