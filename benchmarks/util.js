module.exports = {
  log: function(msg) {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerText = msg;
      document.body.append(div);
    }
    console.log(msg);
  }
};
