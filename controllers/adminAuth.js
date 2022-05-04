const test = (req) => {
  if (!req.session.user) {
    return false;
  } else {
    return true;
  }
};
module.exports = { test };
