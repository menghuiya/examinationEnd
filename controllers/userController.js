let User = require("../modules/user");
const authController = require("../controllers/authController");
const ObjectId = require("mongodb").ObjectId;
//用户列表
exports.list = async (req, res) => {
  let page = Number(req.query.page || 1); //注意验证 是否为数字
  let limit = Number(req.query.limit || 5); //注意验证 是否为数字 //限制条数

  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  User.estimatedDocumentCount().then(function (count) {
    //计算总页数
    let pages = Math.ceil(count / limit);
    //取值不能超过pages
    page = Math.min(page, pages);
    //取值不能小于1
    page = Math.max(page, 1);
    //限定上一页下一页取值
    let skip = (page - 1) * limit;
    User.find({}, { password: 0 })
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

// 用户注册
exports.add = async (req, res) => {
  const userData = req.body;
  const ip = authController.getIp(req);
  const ipUser = await User.find({ ip: ip });
  if (userData.username === "admin") {
    res.status(500).json({
      code: 500,
      msg: "该昵称不可用",
      err: null,
    });
    return;
  }

  if (!authController.isAdmin(req) && ipUser.length > 5) {
    res.status(500).json({
      code: 500,
      msg: "用户注册账号不能超过5个",
      err: null,
    });
    return;
  }

  const findUser = await User.findOne({ username: userData.username });
  if (findUser) {
    res.status(500).json({
      code: 500,
      msg: "该账户名已被注册，请更换名称",
      err: null,
    });
    return;
  }

  // 非管理员无法指定类型  强制转换为普通用户
  if (!authController.isAdmin(req)) {
    userData.role = "member";
  }
  const result = await User({
    ...userData,
    ip: ip,
    create_time: Date.now(),
  }).save();
  if (result) {
    if (!authController.isAdmin(req)) {
      req.session.user = {
        _id: result._id,
        username: result.username,
        role: result.role,
      };
    }
    res.status(200).json({
      code: 200,
      msg: "注册成功",
      data: {
        _id: result._id,
        username: result.username,
        avatar: result.avatar,
      },
    });
  } else {
    res.status(500).json({
      code: 500,
      msg: "注册失败",
      err: result,
    });
  }
};

exports.login = async (req, res) => {
  const loginData = req.body;
  console.log(authController.getIp(req));
  try {
    const userData = await User.findOne({
      username: loginData.username,
    });
    if (userData.isban) {
      throw "该账户已被封禁，请重新注册或者联系管理作者！";
      return;
    }
    if (userData) {
      // 因为我上面插入数据库的时候设置了账户名不能重复
      const newUser = new User();
      const compareData = await newUser.comparePassword(
        loginData.password,
        userData.password
      );
      if (compareData) {
        // 返回true账户密码存在
        req.session.user = {
          _id: userData._id,
          username: userData.username,
          role: userData.role,
        };
        res.status(200).json({
          code: 200,
          msg: "ok",
          data: {
            _id: userData._id,
            username: userData.username,
            avatar: userData.avatar,
          },
        });
      } else {
        // 否则是账户存在密码错误
        throw "用户密码错误！";
      }
    } else {
      // 账户名不存在
      throw "用户名密码不存在";
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: err,
    });
  }
};

/**
 * 退出登录
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.logout = (req, res, next) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  req.session.destroy((err) => {
    if (!(err === null)) {
      console.log(err);
    }
  }); //通过destroy销毁session
  res.json({
    code: 200,
    msg: `退出成功`,
    data: null,
  });
};

/**
 * 用户更新
 * @param {*} req
 * @param {*} res
 * @returns
 */
exports.update = async (req, res) => {
  // 没有登录无法进行修改
  if (!authController.isLogin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  const userData = req.body.userData;
  const id = req.body.id;
  const findUser = await User.findOne({ _id: ObjectId(id) });
  if (!findUser) {
    res.status(500).json({
      code: 500,
      msg: "该账户不存在！",
      err: null,
    });
    return;
  }
  findUser.username = userData.username;
  findUser.password = userData.password;
  findUser.avatar = userData.avatar;

  // 管理员可以指定类型
  if (authController.isAdmin(req)) {
    findUser.role = userData.role;
  }

  const result = await findUser.save();
  if (result) {
    res.status(200).json({
      code: 200,
      msg: "注册成功",
      data: result,
    });
  } else {
    res.status(500).json({
      code: 500,
      msg: "注册失败",
      err: result,
    });
  }
};

/**
 * 删除用户
 * @param {*} req
 * @param {*} res
 */
exports.delete = async (req, res) => {
  // 非管理员无法进入
  if (!authController.isAdmin(req)) {
    res.status(401).json({
      code: 401,
      msg: "非法访问",
    });
    return;
  }
  const cateId = req.body.id;
  User.remove({ _id: ObjectId(cateId) })
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
