let Exam = require("../modules/exam");
let Examorder = require("../modules/examorder");
let Auth = require("./adminAuth");
const ObjectId = require("mongodb").ObjectId;
const authController = require("../controllers/authController");
const Paper = require("../modules/paper");

//获取最热门试题
exports.hot = async (req, res) => {
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 5); //注意验证 是否为数字 //限制条数
  Exam.count().then(function (count) {
    //计算总页数
    let pages = Math.ceil(count / limit);
    //取值不能超过pages
    // page = Math.min(page, pages);
    if (page > pages) {
      return res.json({
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
    Exam.find()
      .limit(limit)
      .skip(skip)
      .sort({ see_count: -1 })
      .then(function (users) {
        let mockData = {
          status: 1,
          msg: "ok",
          data: users,
          dataCount: count,
        };
        // console.log(mockData);
        res.json(mockData);
      });
  });
};

//获取最新试题
exports.new = async (req, res) => {
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 5); //注意验证 是否为数字 //限制条数
  Exam.count().then(function (count) {
    //计算总页数
    let pages = Math.ceil(count / limit);
    //取值不能超过pages
    // page = Math.min(page, pages);
    if (page > pages) {
      return res.json({
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
    Exam.find()
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 })
      .then(function (users) {
        let mockData = {
          status: 1,
          msg: "ok",
          data: users,
          dataCount: count,
        };
        // console.log(mockData);
        res.json(mockData);
      });
  });
};

//试题点赞
exports.good = (req, res) => {
  let id = req.body.id;
  Exam.findOne({
    _id: id,
  })
    .then(async (examData) => {
      examData.good_count++;
      let result = await examData.save();
      console.log(result);
      if (result) {
        res.json({
          status: 1,
          good: result.good_count,
        });
      } else {
        res.json({
          status: 0,
          msg: "发生意外",
        });
      }
    })
    .catch((ere) => {
      res.json({
        status: 0,
        code: 1002,
        msg: err.message,
      });
    });
};

//试题修改
exports.put = async (req, res) => {
  let isLogin = Auth.test(req);
  if (!isLogin) {
    res.json({
      status: 0,
      code: 1005,
      msg: "非法访问!请先登录!",
    });
    return;
  }
  let id = req.body._id || "";
  if (req.body.title == "") {
    res.json({
      code: 500,
      msg: "标题不能为空",
    });
    return;
  }
  if (req.body.content == "") {
    res.json({
      code: 500,
      msg: "内容不能为空",
    });
    return;
  }
  Exam.update(
    {
      _id: id,
    },
    {
      title: req.body.title,
      des: req.body.des,
      cover: req.body.cover,
      content: req.body.content,
    }
  )
    .then(function () {
      res.json({
        status: 1,
        code: 200,
        msg: "试题修改成功",
      });
    })
    .catch((err) => {
      res.json({
        status: 0,
        err: err.message,
      });
    });
};

//试题删除
exports.delete = async (req, res) => {
  let isLogin = Auth.test(req);
  if (!isLogin) {
    res.json({
      status: 0,
      code: 1005,
      msg: "非法访问!请先登录!",
    });
    return;
  }
  let id = req.query.id || "";
  Exam.remove({
    _id: id,
  })
    .then(function () {
      res.json({
        status: 1,
        msg: "试题删除成功",
      });
    })
    .catch((err) => {
      res.json({
        status: 0,
        err: err.message,
      });
    });
};

//获取单个试题
exports.one = (req, res) => {
  let id = req.query.id || "";
  Exam.findOne({
    _id: id,
  })
    .then((examData) => {
      examData.see_count++;
      examData.save();
      res.json({
        status: 1,
        data: examData,
      });
    })
    .catch((err) => {
      res.json({
        status: 0,
        err: err.message,
      });
    });
};

//新增试题
exports.create = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  let examData = req.body;
  examData.create_time = Date.now();
  let result = await Exam(examData).save();
  if (result) {
    res.json({
      code: 200,
      status: 1,
      msg: "ok",
    });
  } else {
    res.status(500).json({
      status: 0,
      msg: "发生错误",
    });
  }
};

//获取试题列表
exports.list = async (req, res) => {
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 10); //注意验证 是否为数字 //限制条数
  Exam.estimatedDocumentCount().then(function (count) {
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
    Exam.find({}, { answer: 0, options: 0 })
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 })
      .then(function (users) {
        res.json({
          code: 200,
          status: 1,
          msg: "ok",
          data: users,
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
//获取试题列表
exports.random = async (req, res) => {
  const result = await Exam.aggregate()
    .match({
      subject: "k2",
      status: true,
      category: "js",
      type: "single",
    })
    .sample(28);
  const result1 = await Exam.aggregate()
    .match({
      subject: "k2",
      status: true,
      category: "js",
      type: "multiple",
    })
    .sample(15);
  res.json({
    code: 200,
    msg: "ok",
    data: {
      single: result,
      multer: result,
    },
  });
};

/**
 * 批量插入试题
 * @param {*} data
 * @param {*} paperId
 * @param {*} userID
 * @returns
 */
exports.addExamorder = async (data, paperId, userID) => {
  const create_time = Date.now();
  const addData = [];
  data.forEach((item) => {
    addData.push({
      paperId: paperId, //试卷id
      examId: item._id, //试题id
      userId: userID, //试题id
      result: false, //是否正确//考试结束后才会显示
      answer: item.type === "single" ? "" : [], //答案 因为有可能为数组
      realAnwser: item.answer, //答案 因为有可能为数组
      create_time: create_time, //创建时间
    });
  });
  let result = await Examorder.insertMany(addData);
  if (result) {
    return true;
  } else {
    return false;
  }
};

/**
 * 考试进入时获取试题
 * @param {*} req
 * @param {*} res
 */
exports.getEaxmByPaperId = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录",
    });
    return;
  }
  const papaerData = await Paper.findOne({ _id: ObjectId(req.query.id) });
  // 判断是不是同一用户
  if (!authController.compareUser(req, String(papaerData.userId))) {
    res.status(401).json({
      code: 401,
      msg: "当前用户id不一致",
    });
    return;
  }
  Examorder.aggregate([
    {
      $lookup: {
        from: "exams", //关联的表名
        localField: "examId", //本身的外键
        foreignField: "_id", //需要关联表的外键
        as: "detail",
      },
    },
    {
      $unwind: {
        path: "$detail", //和上面对应
        preserveNullAndEmptyArrays: true, //固定的
      },
    },
    { $match: { paperId: ObjectId(req.query.id) } },
    {
      $project: {
        realAnwser: 0,
        create_time: 0,
        result: 0,
        "detail._id": 0,
        "detail.status": 0,
        "detail.answer": 0,
      },
    },
  ]).then((exams) => {
    res.json({
      code: 200,
      message: "查询成功",
      data: exams,
    });
  });
};
