/**
 * 判断是不是管理员
 * @param {*} req
 * @returns
 */
const isAdmin = (req) => {
  if (req.session.user && req.session.user.role === "admin") {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否登录
 * @param {*} req
 * @returns
 */
const isLogin = (req) => {
  if (req.session.user) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是不是同一用户
 * @param {*} req
 * @returns
 */
const compareUser = (req, userId) => {
  const seesionUserData = req.session.user;
  if (seesionUserData._id === userId) {
    return true;
  } else {
    return false;
  }
};

/**
 * 返回用户信息
 * @param {*} req
 * @returns
 */
const userData = (req) => {
  return req.session.user;
};

/**
 * 通过req的hearers来获取客户端ip
 * @param {*} req
 * @returns
 */
const getIp = function (req) {
  let ip =
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddres ||
    req.socket.remoteAddress ||
    "";
  if (ip.split(",").length > 0) {
    ip = ip.split(",")[0];
  }
  return ip;
};

module.exports = { isAdmin, isLogin, compareUser, userData, getIp };
