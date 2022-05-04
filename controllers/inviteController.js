const Invite = require("../modules/invite");
const User = require("../modules/user");
const request = require("request");
const fs = require("fs");
const Auth = require("./adminAuth");

/* GET users listing. */
//  获取openId
const APPID = "wxee1453d298681518";
const SECRET = "4d4e859d2de5e8a123bc5ca7258daa43";
// session标识
const authorization_code = "demo";

//用户登录
exports.login = async (req, res) => {
  if (req.body.code) {
    let options = {
      method: "get",
      url: `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${req.body.code}&grant_type=${authorization_code}`,
    };
    request(options, (error, response, body) => {
      if (error) {
        //请求异常时，返回错误信息
        res.json({
          status: "error",
        });
      } else {
        let _data = JSON.parse(body);

        User.findOne({
          openid: _data.openid,
        }).then(async (info) => {
          if (info) {
            res.json({
              status: 0,
              data: info,
            });
          } else {
            const result = await User({
              openid: _data.openid,
              name: req.body.name,
              create_time: Date.now(),
            }).save();
            res.json({
              status: 0,
              data: result,
            });
          }
        });
      }
    });
  }
};

//分享海报
exports.codeimg = (req, res) => {
  const q_data = req.query;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  request(url, (error, response, body) => {
    if (error) {
      //请求异常时，返回错误信息
      res.json({
        status: "error",
      });
    } else {
      let _data = JSON.parse(body);
      let baseUrl = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${_data.access_token}`;
      const option = {
        url: baseUrl,
        json: true,
        method: "POST",
        body: {
          scene: q_data.scene,
          page: q_data.page,
          width: q_data.width,
        },
        resposeType: "arrayBuffer",
      };
      let imgname = Date.now();
      request(option).pipe(
        fs
          .createWriteStream(`./public/upload/sharecode/code_${imgname}.png`)
          .on("finish", () => {
            let domin = req.protocol + "://" + req.get("host");
            res.json({
              status: 1,
              data: domin + `/public/upload/sharecode/code_${imgname}.png`,
            });
          })
      );
    }
  });
};

//添加邀请码
exports.add = async (req, res) => {
  let isLogin = Auth.test(req);
  if (!isLogin) {
    res.json({
      status: 0,
      code: 1005,
      msg: "非法访问!请先登录!",
    });
    return;
  }
  let codes = req.body.code.split(",");
  for (item of codes) {
    console.log(item);
    const result = await Invite({
      code: item,
      create_time: Date.now(),
    }).save();
    if (!result) {
      return res.json({
        status: 0,
        msg: "发生错误",
      });
    }
  }
  res.json({
    status: 1,
    msg: "ok",
  });
};

//邀请码列表
exports.list = async (req, res) => {
  let isLogin = Auth.test(req);
  if (!isLogin) {
    res.json({
      status: 0,
      code: 1005,
      msg: "非法访问!请先登录!",
    });
    return;
  }
  let page = Number(req.body.page || 1); //注意验证 是否为数字
  let limit = Number(req.body.limit || 5); //注意验证 是否为数字 //限制条数
  Invite.count().then(function (count) {
    //计算总页数
    let pages = Math.ceil(count / limit);
    //取值不能超过pages
    page = Math.min(page, pages);
    //取值不能小于1
    page = Math.max(page, 1);
    //限定上一页下一页取值
    let skip = (page - 1) * limit;
    Invite.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "openid",
          foreignField: "openid",
          as: "user",
        },
      },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]).then(function (invites) {
      let mockData = {
        status: 1,
        msg: "ok",
        data: invites,
        dataCount: count,
      };
      // console.log(mockData);
      res.json(mockData);
    });
  });
};

//获取邀请码
const formatdate = (val) => {
  if (!val) {
    console.log("结束异常");
    return "";
  }
  val = new Date(Number(val));
  let year = val.getFullYear(); //取得4位数的年份
  let month = val.getMonth() + 1; //取得日期中的月份，其中0表示1月，11表示12月
  let date = val.getDate();
  let hour = val.getHours();
  let minu = val.getMinutes();
  let sec = val.getSeconds();
  return year + "-" + month + "-" + date + " " + hour + ":" + minu + ":" + sec;
};
// 订阅信息
const subscribe = async (codedata) => {
  let userData = await User.findOne({
    openid: codedata.openid,
  });
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  request(url, (error, response, body) => {
    if (error) {
      //请求异常时，返回错误信息
      res.json({
        status: 0,
        error: "error",
      });
    } else {
      let _data = JSON.parse(body);
      let baseUrl = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${_data.access_token}`;
      console.log(baseUrl);
      const options = {
        url: baseUrl,
        json: true,
        method: "POST",
        data: {
          touser: codedata.openid,
          template_id: "VJMvLZeNk5iMd_w7urLakZqt2lQ4hAPuFQGWGv9pKBw",
          page: "/pages/invite/invite",
          miniprogram_state: "developer",
          lang: "zh_CN",
          data: {
            name1: {
              value: userData.name,
            },
            time2: {
              value: formatdate(codedata.send_time),
            },
            character_string3: {
              value: codedata.code,
            },
            thing4: {
              value: "永久",
            },
            thing5: {
              value: "请在有效时间内填写!",
            },
          },
        },
      };
      request(options, (error, response, body) => {
        if (error) {
          //请求异常时，返回错误信息
          console.log("订阅信息发送失败");
          res.json({
            status: 0,
            error: "error",
          });
        } else {
          console.log("订阅信息发送成功");
        }
      });
    }
  });
};

exports.send = (req, res) => {
  let openid = req.query.openid;
  Invite.findOne({
    openid: openid,
  }).then((i_data) => {
    if (i_data) {
      res.json({
        status: 1,
        msg: "已经存在",
        code: 1002,
        data: i_data,
      });
    } else {
      Invite.find({
        isSend: false,
      })
        .limit(1)
        .then((ii_data) => {
          ii_data.length > 0
            ? Invite.updateOne(
                {
                  _id: ii_data[0]._id,
                },
                {
                  openid: openid,
                  isSend: true,
                  send_time: Date.now(),
                }
              ).then((codedata) => {
                subscribe(codedata);
                res.json({
                  status: 1,
                  code: 1001,
                  data: ii_data[0],
                });
              })
            : res.json({
                status: 1,
                code: 1002,
                data: {
                  code: "暂无邀请码,请联系管理员添加",
                  create_time: Date.now(),
                  send_time: Date.now(),
                },
              });
        });
    }
  });
};

exports.subcode = (req, res) => {
  let openid = req.query.openid;
  Invite.findOne({
    openid: openid,
  }).then((codedata) => {
    if (codedata) {
      res.json({
        status: 1,
        code: 1001,
        data: codedata,
      });
    } else {
      res.json({
        status: 0,
        code: 1002,
        data: "数据异常!",
      });
    }
  });
};
