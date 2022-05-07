const Paper = require("../modules/paper");
const Exam = require("../modules/exam");
const examController = require("../controllers/examController");
const authController = require("../controllers/authController");
const Examorder = require("../modules/examorder");
const ObjectId = require("mongodb").ObjectId;
//获取试题列表
const random = async (filters) => {
  const single = await Exam.aggregate([
    {
      $match: {
        $or: [
          { ...filters },
          { ...filters, category: "all" },
          { type: "single" },
        ],
      },
    },
  ]).sample(28);
  const multer = await Exam.aggregate([
    {
      $match: {
        $or: [
          { ...filters },
          { ...filters, category: "all" },
          { type: "multiple" },
        ],
      },
    },
  ]).sample(15);
  return [...single, ...multer];
};

//试题删除
exports.delete = async (req, res) => {
  let id = req.query.id || "";
  Paper.remove({
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
  Paper.findOne({
    _id: id,
  })
    .then((paperData) => {
      paperData.see_count++;
      paperData.save();
      res.json({
        status: 1,
        data: paperData,
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
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录后新增",
    });
    return;
  }
  let paperData = req.body;
  const sessionUser = authController.userData(req);
  paperData.userId = sessionUser._id;
  paperData.create_time = Date.now();
  let result = await Paper(paperData).save();
  if (result) {
    // 还要处理试题
    const data = await random({
      subject: paperData.subject,
      status: true,
      category: paperData.category,
    });
    if (data.length < 43) {
      const deleteRes = await Paper.remove({ _id: result._id });
      res.status(500).json({
        code: 500,
        status: 0,
        msg: "题库数量不足，无法新增，请联系管理员新增试题后再次创建",
        err: null,
      });

      return;
    }
    // 插入数据中
    const isInsert = examController.addExamorder(
      data,
      result._id,
      paperData.userId
    );
    console.log(isInsert);
    res.json({
      code: 200,
      status: 1,
      msg: "ok",
      data: result,
    });
  } else {
    res.status(500).json({
      status: 0,
      msg: "发生错误",
      err: result,
    });
  }
};

/**
 * 开始答题
 * @param {*} req
 * @param {*} res
 */
exports.updateStatus = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录",
    });
    return;
  }
  const paperId = req.body.id;
  const papaerData = await Paper.findOne({ _id: ObjectId(paperId) });
  // 判断是不是同一用户
  if (!authController.compareUser(req, String(papaerData.userId))) {
    res.status(401).json({
      code: 401,
      msg: "当前用户id不一致",
    });
    return;
  }
  // 更新一下此次试卷;
  Paper.updateOne(
    { _id: ObjectId(paperId) },
    {
      right: 0,
      status: 2,
    }
  ).then(() => {
    res.status(200).json({
      code: 200,
      msg: "提交成功",
      data: null,
    });
  });
};

//获取试题列表
exports.list = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录",
    });
    return;
  }
  const sessionUser = authController.userData(req);
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 10); //注意验证 是否为数字 //限制条数
  Paper.countDocuments({
    userId: ObjectId(sessionUser._id),
  }).then(function (count) {
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
    Paper.find(
      {
        userId: ObjectId(sessionUser._id),
      },
      { answer: 0, options: 0 }
    )
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

const getEaxmByPaperId = async (paperId) => {
  const originData = await Examorder.find({ paperId: ObjectId(paperId) });
  return originData;
};

/**
 * 提交试卷；
 * @param {*} req
 * @param {*} res
 */
exports.handlePaper = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录",
    });
    return;
  }
  const paperId = req.body.id;
  const paperData = req.body.paperData;

  const papaerData = await Paper.findOne({ _id: ObjectId(paperId) });
  // 判断是不是同一用户
  if (!authController.compareUser(req, String(papaerData.userId))) {
    res.status(401).json({
      code: 401,
      msg: "当前用户信息不一致",
    });
    return;
  }

  // 先获取原始试题内容包含答案
  const originData = await getEaxmByPaperId(paperId);
  //开始比对答案
  const compareData = [];
  let totalScore = 0,
    rightScore = 0;
  for (let i = 0; i < originData.length; i++) {
    let item = originData[i];
    const userIetm = paperData.find((v) => v._id === String(item._id));
    if (Array.isArray(userIetm.answer)) {
      item.answer = [...userIetm.answer];
      totalScore += 3;
      //多选比较 因为有可能顺序不一样 所以先sort排序一下
      const a = [...item.realAnwser].sort().join("-");
      const b = [...userIetm.answer].sort().join("-");
      if (a === b) {
        rightScore += 3;
        item.result = true;
      } else {
        item.result = false;
      }
    } else {
      item.answer = userIetm?.answer || "";
      totalScore += 2;
      if (item.realAnwser === userIetm.answer) {
        rightScore += 2;
        item.result = true;
      } else {
        item.result = false;
      }
    }
    const test = await item.save();
    compareData.push(test);
    if (!test) {
      console.log(test);
    }
  }

  const right = compareData.filter((v) => v.result).length;
  const subjectMap = {
    k2: 0.7,
    k3: 0.85,
    k4: 0.7,
  };
  const baseData = await Paper.findOne({ _id: ObjectId(paperId) });
  const isPass = rightScore / totalScore >= subjectMap[baseData.subject];
  // 更新一下此次试卷;
  Paper.updateOne(
    { _id: ObjectId(paperId) },
    {
      right: right,
      status: 3,
      isPass: isPass,
    }
  ).then((paperData) => {
    res.status(200).json({
      code: 200,
      msg: "提交成功",
      data: {
        total: compareData.length,
        right,
        totalScore,
        rightScore,
      },
    });
  });
};

/**
 * 考完获取数据
 * @param {*} req
 * @param {*} res
 */
exports.getCheckEaxmByPaperId = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "请先登录",
    });
    return;
  }

  const baseData = await Paper.findOne({ _id: ObjectId(req.query.id) });
  // 判断是不是同一用户
  if (!authController.compareUser(req, String(baseData.userId))) {
    res.status(401).json({
      code: 401,
      msg: "当前用户信息不一致",
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
  ]).then((exams) => {
    res.json({
      code: 200,
      message: "查询成功",
      data: {
        ...baseData._doc,
        results: exams,
      },
    });
  });
};

/**
 * 获取排行榜
 * @param {*} req
 * @param {*} res
 */
exports.rank = async (req, res) => {
  const type = req.query.type || "all"; //排行榜类型
  const match = [];
  if (type === "pass") {
    match[0] = { $match: { isPass: true } };
  }
  if (type === "nopass") {
    match[0] = { $match: { isPass: false } };
  }
  Paper.aggregate([
    ...match,
    {
      $group: {
        _id: "$userId",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $lookup: {
        from: "users", //关联的表名
        localField: "_id", //本身的外键
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

    {
      $project: {
        "detail._id": 0,
        "detail.role": 0,
        "detail.password": 0,
        "detail.create_time": 0,
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])
    .then((exams) => {
      res.json({
        code: 200,
        message: "查询成功",
        data: exams,
      });
    })
    .catch((err) => {
      res.status(500).json({
        code: 500,
        message: "查询失败",
        data: err,
      });
    });
};
