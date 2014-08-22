var net = require('net'),zlib = require('zlib');
var fs = require('fs'), ini = require('ini');
var Agl = {client:{},fate:{},rootpath:process.argv[2]};
var Aglm={host:"127.0.0.1",ports:{},cgitimeout:120,status:2};
var Acgi = {};
process.on('message',function(obj){
	console.log('pid:',obj);
});
Afpm = module.exports = function(){}
Afpm.run = function(){
	var config = ini.parse(fs.readFileSync(Agl.rootpath+'config/Anmp.ini', 'utf-8'));
	var pi=0;
	for(var p in config.pool){
		//if(pi>=5){break;}
		if(p.length>1){
			var id = parseInt(p.split('_')[1]);
			Aglm.ports[id] = {};
			var child = config.pool[p].split(',')[0];
			//if(child>5){child=5;}
			for (var i=0; i < child; i++) {
				Aglm.ports[id][9000+(id*100)+i]=0;
			};
			Afpm.pool(id);
		}
		pi++;
	}
}
Afpm.pool = function(id){
	net.createServer(function (socket) {
		socket.on("connect",function(){
			try{
				Afpm.poll(id,socket);
			}catch(err){
				console.log(err);
			}
		});
	}).listen(8900+parseInt(id), "0.0.0.0");
}
Afpm.poll = function(id,socket,type){
	if(!type) type=1;
	var port=1;
	for(var p in Aglm.ports[id]){
		if(port==1){port=p;continue;}
		if(Aglm.ports[id][port]>Aglm.ports[id][p]){
			port = p;
		}
	}
	Afpm.port1(id,port);
	Afpm.cgi(id,socket,port,type);
}
Afpm.port1 = function(id,port){
	Aglm.ports[id][port]++;
}
Afpm.port2 = function(id,port){
	if(Aglm.ports[id][port]>0) Aglm.ports[id][port]--;
}
Afpm.cgiend = function(sid){
	if(!Acgi[sid]) return;
	var now = new Date().getTime();
	Acgi[sid].end = now-Acgi[sid].time;
	setTimeout(function() {Afpm.cgidel(sid);}, 500);
}
Afpm.cgidel = function(sid){
	delete Acgi[sid];
}
Afpm.cgi = function(id,socket,port,type){
	var sid = new Date().getTime()+""+parseInt(Math.random()*(999-100+1) + 100);
	Acgi[sid]={port:port,time:0,end:0};
	var db=net.createConnection(port,Aglm.host);
	db.on("connect",function(){
		Acgi[sid].time=new Date().getTime();
		Afpm.cgitimeout(id,socket,db,sid);//Connection Timeout detection
		console.log(port,"connected");
	});
	db.on("data",function(data){
		if(!socket || !data) return;
		socket.write(data);
	});
	db.on("error",function(data){
		console.log("client error:"+data);
		Afpm.port2(id,port);Afpm.cgiend(sid);
		db.destroy();
		if(type==1) Afpm.poll(id,socket,2);//2 times
		else socket.destroy();
		return;
	});
	db.on("end",function(){
		//console.log(port,"sever end");
		socket.destroy();
	});
	socket.on("data", function (data) {
		db.write(data);
		if(Aglm.status==1){
			var str = data.toString('utf8',0,data.legnth);
			try{
				Acgi[sid].req = str.match(/REQUEST_URI\/([\w\d\.\?%_,-=]+)/)[1];
				Acgi[sid].doc = str.match(/DOCUMENT_URI\/([\w\d\.\?%_,-=]+)/)[1];
				Acgi[sid].addr = str.match(/REMOTE_ADDR([0-9.]+)/)[1];
				Acgi[sid].cport = str.match(/REMOTE_PORT([0-9]+)/)[1];
				Acgi[sid].host = str.match(/HTTP_HOST([0-9.a-zA-Z-_]+)/)[1];
				Acgi[sid].port = str.match(/SERVER_PORT([0-9]+)/)[1];
			}catch(e){}
		}
	});
	socket.on("close",function(){
		Afpm.port2(id,port);Afpm.cgiend(sid);
		//console.log(port,"connect closed");
		db.destroy();
	});
	socket.on("error",function(data){
		console.log("socket error:"+data);
		Afpm.port2(id,port);Afpm.cgiend(sid);
		db.destroy();socket.destroy();
		return;
	});
}

Afpm.cgitimeout = function(id,socket,db,sid,type){
	if(!Acgi[sid].end || Acgi[sid].end>0){return;}
	var nowtime = new Date().getTime();
	if(nowtime-Acgi[sid].time >= Agl.cgitimeout*1000){
		Afpm.port2(id,port);Afpm.cgiend(sid);
		socket.destroy();db.destroy();
	}else{
		if(Acgi[sid].time > 0){
			setTimeout(function() {Afpm.cgitimeout(id,socket,db,sid,1);}, 1000);
		}
	}
	return;
}
