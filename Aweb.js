var io = require('socket.io').listen(8893);
var Acan = require('./acan');
var acans = new Acan;
var db_options = {host: '127.0.0.1',port: 3306,user: 'au',password: 'ly&100200',database: 'fate'};
var Adb = new Acan.mysql(db_options);
//聊天系统
Achat = function(){};
Achat.prototype = {
// {} {type:,uid:,msg:,time:,touid:,status}
	run:function(socket,obj){
		if(typeof(obj)=='object'){
			this.write(socket,obj);
		}
	},
	//处理消息发送
	write:function(socket,obj){
		obj.status=1;
		//消息写入数据库
		Adb.query("INSERT INTO `acan_fate_chat` (`fid`,`tfid`,`time`,`note`,`nid`,`status`) VALUES('"+obj.fid+"','"+obj.tfid+"','"+obj.time+"','"+obj.note+"','"+obj.nid+"',1)",
			function(results) {
				var id = results.insertId;
				if(results.affectedRows==1){
					obj.status=2;
				}
				socket.emit('Achat',obj);
				//如果对方在线，直接发送给对方，并更新状态
				if(Agl.fate[obj.tfid] && Agl.fate[obj.tfid].socket_id && io.sockets.sockets[Agl.fate[obj.tfid].socket_id]){
					var rs = io.sockets.sockets[Agl.fate[obj.tfid].socket_id].emit('Achat',obj);
					Adb.query("UPDATE `acan_fate_chat` SET status=2 WHERE id="+id);
				}
			}
		);
		return;
	},
	//根据UID获取信息
	getmsgs:function(socket,fid){
		Adb.query("SELECT * FROM `acan_fate_chat` WHERE status=1 and tfid="+fid,
			function(rs, fields) {
				if(Acan.count(rs)>0){
					for(var i in rs){
						socket.emit('Achat',rs[i]);
						Adb.query("UPDATE `acan_fate_chat` SET status=2 WHERE id="+rs[i].id);
					}
				}
			}
		);
	},
};
var Agl = {client:{},fate:{}};
var Achat = new Achat;
io.sockets.on('connection', function (socket) {
	Agl.client[socket.id] = {login:false,Auth:{},ip:socket.manager.handshaken[socket.id].address.address};
	socket.on('message', function (data) {
		console.log(data);
	});
	//处理聊天信息
	socket.on('Achat', function (obj) {
		if(Agl.client[socket.id].login==true) Achat.run(socket,obj);
	});
	//本地代理请求
	socket.on('Aajax', function (obj) {
		var url = "http://127.0.0.1:93/"+obj.url;
		console.log(url);
		if(obj.url=='weibo-login'){obj.data.Auth = {"ip":Agl.client[socket.id].ip};}//赋予此次登入IP
		if(!obj.data.Auth && obj.Auth) obj.data.Auth = obj.Auth;
		if(obj.data.Auth.uid && Agl.client[socket.id].uid>0 && obj.data.Auth.uid != Agl.client[socket.id].uid){
			socket.emit('Aajax',obj.ajax_id,{status:0,msg:"请重新登入"});
			return;
		}
		console.log(obj.data);
		acans.http.post(url,obj.data,function(data) {
			var odata = Acan.json_obj(data);
			//登入认证
			if(obj.url=='weibo-login'){
				if(odata.status==1){
					if(Agl.client[socket.id] && Agl.client[socket.id].fid>0 && Agl.client[socket.id].fid!=odata.Auth.fid){
						delete Agl.fate[Agl.client[socket.id].fid];
					}
					Agl.client[socket.id].login=true;
					Agl.client[socket.id].Auth=odata.Auth;
					Agl.client[socket.id].uid=odata.Auth.uid;
					Agl.client[socket.id].fid=odata.Auth.fid;
					Agl.fate[odata.Auth.fid]={'socket_id':socket.id};
					Achat.getmsgs(socket,odata.Auth.fid);
				}else{
					Agl.client[socket.id].login=false;
				}
			}
			socket.emit('Aajax',obj.ajax_id,odata);
		});
	});
	//连接错误
	socket.on('anything', function (obj) {
		console.log('anything',obj);
	});
	//断开连接
	socket.on('disconnect', function () {
		console.log("断开连接:"+socket.id);
		if(Agl.client[socket.id].fid) delete Agl.fate[Agl.client[socket.id].fid];//删除断开的全局用户对象
		delete Agl.client[socket.id];//删除断开的全局通信对象
	});
});