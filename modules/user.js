let mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10; // 默认 10
//用户的表结构
const UserSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    avatar: String,
    role: {
      type: String,
      default: "member",
    },
    isban: {
      type: Boolean,
      default: false,
    },
    ip: String,
    create_time: Number,
  },
  { versionKey: false }
);

UserSchema.pre("save", function (next) {
  console.log("写入操作......");
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

UserSchema.methods = {
  comparePassword: (_pass, password) => {
    //验证方法
    // _pass传递过来的密码，password是数据库中的密码
    return new Promise((res, rej) => {
      bcrypt.compare(_pass, password, (err, isMath) => {
        //compare官方方法
        if (!err) {
          res(isMath); // isMath返回true和false,true代表验证通过
        } else {
          rej(err);
        }
      });
    });
  },
};

module.exports = mongoose.model("User", UserSchema);
