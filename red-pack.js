// Polyfill for RequestAnimationFrame & CancelAnimationFrame
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

(function() {

    // 切红包控制类
    function RedPackController(bottom, backgroundColor, zIndex, moveColor) {
        this.bottom = bottom || 0
        this.backgroundColor = backgroundColor || 'rgba(0,0,0,.6)'
        this.zIndex = zIndex || 1
        this.moveColor = moveColor || '#fff'
        // 初始化图片DOM
        this.img = new Image()
        this.imgTop = new Image()
        this.imgBottom = new Image()
        this.coinImg = new Image()
        this.img.src = 'origin.png'
        this.imgTop.src = 'top.png'
        this.imgBottom.src = 'bottom.png'
        this.coinImg.src = 'coin.png'

        this.winWidth = document.documentElement.clientWidth
        this.winHeight = document.documentElement.clientHeight
        this.canvas = null

        this.ctx = null
        // 红包
        this.redPacks = []
        // 手指move点
        this.movePoints = []
        // 红包裂开点
        this.splitPoints = []
        // 硬币点
        this.coinPoints = []
        // 初始化
        this.init = function () {
            this.canvas = document.createElement('canvas')
            this.canvas.id = 'red-pack-canvas'
            this.canvas.style.background = this.backgroundColor
            this.canvas.style.zIndex = this.zIndex
            this.canvas.style.position = 'absolute'
            this.canvas.width = this.winWidth
            this.canvas.height = this.winHeight - this.bottom
            document.body.appendChild(this.canvas)
            this.ctx = this.canvas.getContext('2d')
            var that = this
            // 添加事件
            this.canvas.addEventListener('touchmove', function (e) {
                var touch = e.touches[0]
                var obj = {
                    'x': touch['clientX'],
                    'y': touch['clientY'],
                    'count': 20
                }
                if(that.movePoints.length >= 22){
                    that.movePoints.shift()
                }
                that.movePoints.push(obj)
                e.preventDefault()
                e.stopPropagation()
            })

            this.canvas.addEventListener('touchend', function (e) {
                that.movePoints = []
                e.preventDefault()
                e.stopPropagation()
            })
        }
        this.init()
    }

    // 描绘鼠标轨迹
    RedPackController.prototype.paintTrack = function (ctx) {
        for(var k = 0; k < this.movePoints.length - 2; k++) {
            ctx.lineWidth = 2 + 9 * k / (this.movePoints.length - 3)
            ctx.beginPath()
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = this.moveColor
            ctx.moveTo(this.movePoints[k]['x'], this.movePoints[k]['y'])
            ctx.lineTo(this.movePoints[k + 1]['x'], this.movePoints[k + 1]['y'])
            ctx.stroke()
        }
    }

    // 生成红包
    RedPackController.prototype.gR = function (direction) {

        // x轴初始速度为0.8
        var vx = 0.2
        // x轴方向加速度，区分正负
        var ax = this.random(0.15, 0.2)
        ax = direction ? -ax : ax
        // y轴初始速度
        var vy = this.random(5, 8)
        // y轴方向加速度，区分正负
        var ay = 0
        // 红包大小
        var size = this.random(20, 60)
        var pack = new RedPack(this.winWidth, this.winHeight, vx, vy, ax, ay, size)
        if(this.redPacks.length >= 6){
            this.redPacks.splice(0, 1)
        }
        this.redPacks.push(pack)
    }

    // 生成随机数
    RedPackController.prototype.random = function (m, n) {

        return parseFloat((Math.random() * (n-m) + m).toFixed(2))
    }

    // 红包类
    function RedPack(winWidth, winHeight, vx, vy, ax, ay, width) {
        this.x = winWidth / 2 - width / 2
        this.y = winHeight / 2 + 100
        this.ax = ax
        this.vx = vx
        this.vy = vy
        this.ay = ay
        this.w = width
        this.h = parseFloat((width / 3 * 4).toFixed(2))
    }

    // 红包位置自更新
    RedPack.prototype.update = function (ctx, img) {
        //速度每一帧都加上加速度的值
        this.vx += this.ax
        this.x += this.vx
        this.vy += this.ay
        this.y -= this.vy
        this.x = parseFloat(this.x.toFixed(2))
        this.y = parseFloat(this.y.toFixed(2))
        this.vx = parseFloat(this.vx.toFixed(2))
        ctx.drawImage(img, this.x, this.y, this.w, this.h)
    }

    // 分裂点类
    function Splitor(x, y, w, h, speed, direction) {
        var deg = direction * Math.PI / 180
        this.tx = x
        this.ty = y
        this.bx = x
        this.by = y

        // 水平方向速度
        this.vtx = -speed * Math.cos(deg)
        this.vbx = this.vtx
        // 垂直方向速度
        this.vty = speed * Math.sin(deg)
        this.vby = this.vty

        // 摩擦力加速度
        this.ax = 0.1
        // 重力加速度
        this.ay = 0.45

        this.w = w
        this.h = h
    }

    // 红包分裂位置更新
    Splitor.prototype.update = function (ctx, imgTop, imgBottom) {

        this.vtx = this.vtx >= 0 ? (this.vtx - this.ax) : 0
        this.tx -= this.vtx

        this.vbx -= this.ax
        this.bx += this.vbx

        this.vty -= this.ay
        this.ty -= this.vty

        this.vby += this.ay
        this.by += this.vby

        ctx.drawImage(imgTop, this.tx, this.ty, this.w, this.h)
        ctx.drawImage(imgBottom, this.bx, this.by, this.w, this.h)
    }

    // 硬币类
    function Coin(x, y, r, direction) {
        // 硬币初始速度大小
        var coinSpeed = 10
        var deg = direction * Math.PI / 180
        this.x = x
        this.y = y
        this.r = r

        // 水平方向速度
        this.vx = coinSpeed * Math.cos(deg)
        // 垂直方向速度
        this.vy = coinSpeed * Math.sin(deg)

        // 摩擦力加速度
        this.ax = 0.1
        // 重力加速度
        this.ay = 0.45
    }

    // 硬币位置自更新
    Coin.prototype.update = function (ctx, coinImg) {

        this.vx -= this.ax
        this.x += this.vx

        this.vy -= this.ay
        this.y -= this.vy
        ctx.drawImage(coinImg, this.x, this.y, this.r, this.r)
    }

    // 判断鼠标轨迹与卡片是否相交
    RedPackController.prototype.judgeIntersect = function () {
        var index = []
        var _Reds = this.redPacks.slice(0)
        for(var i = 0; i < _Reds.length; i++){
            if(_Reds[i]['x'] + _Reds[i]['w'] < 0) {
                continue
            }
            for(var k = 0; k < this.movePoints.length; k++) {
                var inX = this.movePoints[k]['x'] >= _Reds[i]['x'] && this.movePoints[k]['x'] <= (_Reds[i]['x'] + _Reds[i]['w'])
                var inY = this.movePoints[k]['y'] >= _Reds[i]['y'] && this.movePoints[k]['y'] <= (_Reds[i]['y'] + _Reds[i]['h'])
                if(inX && inY){
                    index.push(i)
                    break
                }
            }
        }
        for (k = 0; k < index.length; k++){
            this.redPacks[index[k]] && this.gS(index[k])
            this.redPacks[index[k]] && this.gC(index[k])
            this.redPacks.splice(index[k], 1)
        }
    }

    // 生成红包分裂点
    RedPackController.prototype.gS = function (k) {
        var speed = this.random(8, 10)
        var direction = this.random(100, 160)
        this.splitPoints.push(new Splitor(this.redPacks[k].x, this.redPacks[k].y, this.redPacks[k].w, this.redPacks[k].h, speed, direction))
    }

    // 生成红包分裂时硬币
    RedPackController.prototype.gC = function (k) {
        var direction1 = this.random(10, 80)
        var direction2 = this.random(10, 80)
        var direction3 = this.random(10, 170)
        var r1 = this.random(10, 18)
        var r2 = this.random(10, 18)
        var r3 = this.random(10, 18)
        this.coinPoints.push(
            new Coin(this.redPacks[k].x, this.redPacks[k].y, r1, direction1),
            new Coin(this.redPacks[k].x, this.redPacks[k].y, r2, direction2),
            new Coin(this.redPacks[k].x, this.redPacks[k].y, r3, direction3)
        )
    }

    // 入口-开启绘画
    RedPackController.prototype.start = function (callback) {
        // 开始时间
        var startTime = new Date().getTime()
        var that = this
        this.img.onload = function () {
            var t = 0
            setInterval(function () {
                that.gR(t % 2 !== 0)
                t++
            }, 300)
        }

        var loop = true

        // 主线程
        function drawFrame(){
            if (!loop) {
                that.ctx.clearRect(0, 0, that.winWidth, that.winHeight - that.bottom)
                setTimeout(function () {
                    document.body.remove(that.canvas)
                    typeof callback === 'function' && callback()
                }, 20)
                return
            }
            window.requestAnimationFrame(drawFrame)
            that.ctx.clearRect(0, 0, that.winWidth, that.winHeight - that.bottom)
            for(var k = 0; k < that.redPacks.length; k++) {
                that.redPacks[k].update(that.ctx, that.img)
            }

            that.paintTrack(that.ctx)

            for(var i = 0; i < that.splitPoints.length; i++){
                that.splitPoints[i].update(that.ctx, that.imgTop, that.imgBottom)
            }

            for(i = 0; i < that.coinPoints.length; i++){
                that.coinPoints[i].update(that.ctx, that.coinImg)
            }

            // 判断是否切中
            that.judgeIntersect()
        }

        drawFrame()

        // 清除滑动痕迹
        setInterval(function () {
            that.movePoints.splice(0, 1)
            var t = new Date().getTime()
            // 6秒结束游戏
            if(t - startTime >= 6.5 * 1000){
                loop = false
            }
        }, 24)
    }

    window.RedPackController = RedPackController

}());
