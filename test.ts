import Lrhmise from "./src";

const lrhmise = new Lrhmise((resolve, reject) => {
  setTimeout(() => {
    resolve("成功");
  }, 5000);
}).then(
  (data) => {
    console.log("success", data);
  },
  (err) => {
    console.log("faild", err);
  }
);
