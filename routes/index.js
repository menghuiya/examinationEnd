var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json({
    title: "欢迎来到这",
    desc: "这里没啥用",
  });
});

module.exports = router;
