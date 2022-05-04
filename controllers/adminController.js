let Admin = require("../modules/admin");
let User = require("../modules/user");
let Category = require("../modules/category");
const ObjectId = require("mongodb").ObjectId;
const authController = require("../controllers/authController");
//增加后台账号
exports.add = async (req, res) => {
  const baseData = await User.find({ role: "admin" });
  if (baseData) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  const result = await User({
    username: "admin",
    password: "admin",
    role: "admin",
    create_time: Date.now(),
  }).save();
  res.json({
    code: 200,
    msg: "新增成功，记得修改接口地址",
    data: result,
  });
};

/**
 * 获取分类列表
 * @param {*} req
 * @param {*} res
 */
exports.examcateList = async (req, res) => {
  Category.find({})
    .sort({ _id: -1 })
    .then(function (cates) {
      res.json({
        code: 200,
        msg: "ok",
        data: cates,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: 0,
        msg: "发生错误",
        err,
      });
    });
};

/**
 * 获取分类列表
 * @param {*} req
 * @param {*} res
 */
exports.cateList = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 10); //注意验证 是否为数字 //限制条数
  Category.estimatedDocumentCount().then(function (count) {
    //计算总页数
    let pages = Math.ceil(count / limit);
    //取值不能超过pages
    // page = Math.min(page, pages);
    if (page > pages) {
      return res.json({
        code: 200,
        status: 0,
        msg: "ok",
        data: [],
        dataCount: count,
      });
    }
    //取值不能小于1
    page = Math.max(page, 1);
    //限定上一页下一页取值
    let skip = (page - 1) * limit;
    Category.find({})
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 })
      .then(function (cates) {
        res.json({
          code: 200,
          msg: "ok",
          data: cates,
          dataCount: count,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: 0,
          msg: "发生错误",
          err,
        });
      });
  });
};

/**
 * 新增分类
 * @param {*} req
 * @param {*} res
 */
exports.addCate = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  let cateData = req.body;
  cateData.createTime = Date.now();
  let result = await Category(cateData).save();
  if (result) {
    res.json({
      code: 200,
      status: 1,
      msg: "新增成功",
    });
  } else {
    res.status(500).json({
      status: 0,
      msg: "新增成功",
    });
  }
};

/**
 * 更新分类
 * @param {*} req
 * @param {*} res
 */
exports.updateCate = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  const cateData = req.body.cateData;
  const cateId = req.body.id;
  console.log(cateId);
  Category.updateOne(
    { _id: ObjectId(cateId) },
    {
      ...cateData,
    }
  )
    .then(() => {
      res.status(200).json({
        code: 200,
        msg: "更新成功",
      });
    })
    .catch((err) => {
      res.status(500).json({
        code: 200,
        msg: "更新失败",
        err: err,
      });
    });
};

/**
 * 删除分类
 * @param {*} req
 * @param {*} res
 */
exports.deleteCate = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  const cateId = req.body.id;
  Category.remove({ _id: ObjectId(cateId) })
    .then(() => {
      res.status(200).json({
        code: 200,
        msg: "删除成功",
      });
    })
    .catch((err) => {
      res.status(500).json({
        code: 200,
        msg: "删除失败",
        err: err,
      });
    });
};
