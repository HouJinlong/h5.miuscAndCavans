var express = require('express');
var router = express.Router();
//获取路径，找到放音乐的文件夹
var path = require("path");
var media = path.join(__dirname,"../public/media");
/* GET home page. */
router.get('/', function(req, res, next) {
  //启动查找模块
  var fs = require("fs");
  fs.readdir(media, function (err,names) {
      if(err){
        console.log(err)
      }else{
        res.render('index', { title: '可视化音乐',music:names });
      }
  })
});

module.exports = router;
