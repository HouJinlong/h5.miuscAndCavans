/**
 * Created by Administrator on 2017/5/10.
 */
//仿jq获取元素
function $(e){
    return document.querySelectorAll(e);
}
var lis=$('#list li');
//为音乐列表加事件
for(var i=0;i<lis.length;i++){
    lis[i].onclick= function () {
        for(var j=0;j<lis.length;j++){
            lis[j].className='';
        }
        this.className='selected';
        //调用加载函数
        load("/media/"+this.title);
    }
}
var btn=$('.btn li');
draw.type='column';
for(var i=0;i<btn.length;i++){
    btn[i].onclick= function () {
        for(var j=0;j<btn.length;j++){
            btn[j].className='';
        }
        this.className='active';
        draw.type=this.getAttribute('data-type');
    }
}
//创建ajax对象
var xhr  =  new  XMLHttpRequest();
//创建 webAudio对象
var ac =  new (window.AudioContext||window.webkitAudioContext)();
//创建 webAudio对象的音量控制对象
var gainNode = ac[ac.createGain?'createGain':'createGainNode']();
gainNode.connect(ac.destination);
var analyser = ac.createAnalyser();
var size = 128;//绘制canvas时要用
analyser.fftSize = size * 2;
analyser.connect(gainNode);
//解决播放问题
var source =null; //但只能解决有歌在放时，切换另一首歌不会2首同时播的问题；无法解决加载中连点几首的bug、‘
var count = 0;//和load()中的n配和确定只播放最后一次点击的歌
//封装加载事件
function load(url){
    var n = ++count;  //很巧妙先自加后运算  使得每次调用函数 时n和count都是相同的，这样在后边ajax加载完数据后根据n的值来播发放
    //以get方式传参，根据地址打开文件
    xhr.open("GET",url);
    xhr.responseType='arraybuffer';//数据格式二进制
    xhr.onload= function () {
        if(n!=count)return;  //就算在加载中连点了几首但是只有当n和全局的count相等时程序才继续运行   闭包类似
        //在ajax获取到数据后通过decodeAudioData解码然后传给bufferSource.buffer
        ac.decodeAudioData(xhr.response, function (buffer) {
            if(n!=count)return;   //这块同理，因为俩个都是异步函数      多一层保险
            source && source[source.stop?'stop':'noteOff'](); //如果source 存在（即不是null）那么说明有歌在放，那就调用先前拷贝的播放方法停止
            xhr.abort();//每次都终止上一次请求 开始新的请求
            //正确执行函数
            var bufferSource = ac.createBufferSource(); //创建webAudio对象的 bufferSource对象
            bufferSource.buffer = buffer;//赋给bufferSource.buffer
            //bufferSource.connect(ac.destination);  已经gainNode.connect(ac.destination); 所以
            //bufferSource.connect(gainNode);  已经analyser.connect(gainNode);所以
            bufferSource.connect(analyser);
            bufferSource[bufferSource.start?'start':'noteOn'](0);//调用  bufferSource的start()开始播放方法(兼容写法)
            source  = bufferSource; //拷贝了一分播放方法，用来下次关闭播发下一首
        },function(err){
            //错误执行函数
            console.log(err);
        });
    }
    xhr.send();
}

//调节音量函数
function changeVolume(percent){
    gainNode.gain.value = percent * percent;
}
//与音量控制绑定
$('#volume')[0].onchange= function () {
    changeVolume(this.value/this.max);
}

// 音频处理函数
visualizer();//自调用
 function visualizer(){
        var arr = new Uint8Array(analyser.frequencyBinCount);//当切歌时     获取到值 传给 函数 v
        requestAnimationFrame = window.requestAnimationFrame ||window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
        function v(){
            analyser.getByteFrequencyData(arr);
            draw(arr);
            requestAnimationFrame(v);
        }
        requestAnimationFrame(v);
    }
var box = $('#canvas')[0];
var canvas = document.createElement('canvas');
var cxt = canvas.getContext('2d');
box.appendChild(canvas);
var width,height,line,Dots=[];
function random(m,n){
    return Math.round(Math.random()*(n-m)+m);
}
function getDots(){ //生成坐标和颜色以对象形式存入数组
    Dots=[];
    for(var i=0;i<size;i++){
        var x = random(0,width);
        var y = random(0,height);
        var color ="rgb("+random(0,255)+","+random(0,255)+","+random(0,255)+")";
        Dots.push({
            x:x,
            y:y,
            color:color
        });
    }
}
function resize(){
    width =box.clientWidth;
    height =box.clientHeight;
    canvas.width = width;
    canvas.height = height;
    line = cxt.createLinearGradient(0,0,0,height); //柱状图的线性渐变
    line.addColorStop(0,'red');
    line.addColorStop(0.5,'yellow');
    line.addColorStop(1,'green');
    getDots()
}
resize();

function draw(arr){
    cxt.clearRect(0,0,width,height);
    var w = width/size;
    for(var i=0;i<size;i++){
        if(draw.type == "column"){
            cxt.fillStyle=line;
            var h = arr[i]/256*height;
            cxt.fillRect(w*i,height-h,w*0.8,h-20);
        }else{
           cxt.beginPath();
            var o = Dots[i];
            var r = arr[i]/256 * 50;
            if(draw.type == "dot_1"){
                cxt.arc(o.x, o.y, r ,0, Math.PI*2, true ); // 生成圆
            }else if(draw.type == "dot_2"){
                var dig = Math.PI / 5 * 4;
                for (var j = 0; j <= 5; j++) {  // 生成五角星
                    var X = Math.sin(j * dig);
                    var Y = Math.cos(j * dig);
                    cxt.lineTo(o.x + X * r, o.y + Y * r);
                }
            }
            var g=cxt.createRadialGradient(o.x, o.y,0, o.x, o.y,r);
            g.addColorStop(0,'#fff');
            g.addColorStop(1, o.color);
            cxt.fillStyle=g;
            cxt.fill();
            cxt.closePath();
        }
    }
}
window.onresize=resize;