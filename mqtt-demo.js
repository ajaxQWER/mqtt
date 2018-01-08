/*
*阿里云物联网套件nodejs连接示例
*Created by 薛将军 on 2018/1/8. 
*/

var mqtt = require('mqtt'); //mqtt
var request = require('request'); //request用于https认证
var crypto = require('crypto'); //加密模块

var productKey = 'qCPoDBNBc2G'; //产品key
var deviceName = 'Es3QaABKWQh520wCf1PR'; //设备名称
var clientId = Math.random().toString(16).substr(2, 8); //自id
var deviceSecret = 'vQmPvrRd4koqFnLM48FX7KMb3OTJJBd2'; //设备密码
var host = `mqtt://${productKey}.iot-as-mqtt.cn-shanghai.aliyuncs.com:1883`; //阿里mqtt host

var content = {
    productKey: productKey,
    deviceName: deviceName,
    clientId: clientId
}

//字典排序
function sign_hmac(ct) {
    var secretString = '';
    for (let key of Object.keys(ct).sort()) {
        secretString += key + content[key];
    }
    return secretString;
}
//加密 crypto.createHmac('sha1', deviceSecret).update('待加密字串').digest('hex');
var sign = crypto.createHmac('sha1', deviceSecret).update(sign_hmac(content)).digest('hex');

var url = 'https://iot-auth.cn-shanghai.aliyuncs.com/auth/devicename'

var requestForm = {
	productKey: productKey,
    deviceName: deviceName,
    sign: sign,
    clientId: clientId,
    signmethod: 'hmacsha1'
}

var params = {
	url: url,
	form: requestForm
}

//HTTPS认证
request.post(params, function(error, response, body) {
    if(error){
		console.log(error)
	}
    if (!error && response.statusCode == 200) {
    	var res = JSON.parse(body)

    	var options = {
    	    clientId: clientId,
    	    username: res.data.iotId,
    	    password: res.data.iotToken,

    	}

    	var client = mqtt.connect(host, options);
    	client.on('connect', function() {
    	    console.log('MQTT服务器链接成功!')
    	    client.subscribe(`/${productKey}/${deviceName}/send_push`)
    	})

    	client.on('error', function(err) {
    	    console.log(err)
    	})

    	//topic
    	client.on('message', function(topic, message) {
    	    // message is Buffer
    	    console.log('收到:' + topic + '消息:' + message.toString())
    	    client.end() //结束连接
    	})
    }
})