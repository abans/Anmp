var spawn = require('child_process').spawn,exec = require('child_process').exec,fork = require('child_process').fork,Aexe={};
var fs = require('fs'),os = require('os'),crypto = require('crypto');
var Ahtml = Acan.html();

var Acon = module.exports = function(){};
Acan.log = function(type,note){
	var path = Agl.rootpath+'temp/anmp.log';
	var data = Acan.time('Y-m-d H:i:s')+' ['+type+'] '+note+"\n";
	fs.appendFileSync(path, data, encoding='utf8');
}
Acon.cron = function(){}
Acon.cron.ready = function(){
	var nowtime = Acan.time();
	var nowMinute = Acan.time('i');
	var nowhour = Acan.time('H');
	var nowday = Acan.time('d');
	var nowweek = Acan.time('w');
	if(!Agl.cron) Agl.cron = {last:nowtime,minute:nowMinute,hour:nowhour,day:nowday,week:nowday,month:Acan.time('m')};
	if(Acan.time('H')=='00'){
		if(Agl.cron.day!=nowday){
			Acon.cron.day();
			Agl.cron.day = Acan.time('d');
		}
		if(nowday=='01'){
			if(Agl.cron.month != Acan.time('m')){
				Acon.cron.month();
				Agl.cron.month = Acan.time('m');
			}
		}
		if(nowweek=='01'){
			if(Agl.cron.week != nowday){
				Acon.cron.week();
				Agl.cron.week = nowday;
			}
		}
	}
	if(Acan.time('i')=='00'){
		if(Agl.cron.hour!=nowhour){
			Acon.cron.hour();
			Agl.cron.hour = nowhour;
		}
	}
	if(Agl.cron.minute!=nowMinute){
		Acon.cron.minute();
		Agl.cron.minute = nowMinute;
	}
	setTimeout(function() {Acon.cron.ready();}, 500);
}
Acon.cron.minute = function(){
	console.log('cron minute');
	if(!Agl.cron.mi){
		Agl.cron.mi = 1;
	}else{
		if(Agl.cron.mi>30){
			Acon.nginx('reload');
			Agl.cron.mi=0;
		}
		Agl.cron.mi++;
	}
}
Acon.cron.hour = function(){
	console.log('cron hour')
}
Acon.cron.day = function(){
	setTimeout(function() {
		if(Agl.nginx && Agl.nginx.log_cycle==1){
			Acon.nginx_log();
		}
		//Acon.runexe('taskkill',['/PID',Aexe['afpm'].pid,'/F']);
	}, 1);
}
Acon.cron.week = function(){
	setTimeout(function() {
		if(Agl.nginx.log_cycle==2){
			Acon.nginx_log();
		}
	}, 1);
}
Acon.cron.month = function(){
	setTimeout(function() {
		if(Agl.nginx.log_cycle==3){
			Acon.nginx_log();
		}
	}, 1);
}
Acon.vip = function(){}
Acon.vip.ready = function(){
	var mail = /([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-]+)/g;
	var path = Agl.rootpath+'config/Anmp.vip';
	if(!fs.existsSync(path)){
		fs.writeFileSync(path,Acan.obj_json({mail:'',end:0,ip:0,mac:0}));
	}
	Agl.vip = Acan.json_obj(fs.readFileSync(path, 'utf-8'));
	if(mail.test(Agl.vip.mail)){
		Acon.vip.check();
	}
	setTimeout(function(){Acon.vip.poll();}, 5000);
}
Acon.vip.poll = function(){
	if(Agl.vip){
		if(Agl.vip.end>Acan.time('s')){
			Acon.vip.check(2);
		}else{
			Acon.vip.renew();
		}
	}
	setTimeout(function() {Acon.vip.poll();}, 3600*1000);
}
Acon.vip.is = function(){
	if(Agl.vip.end>Acan.time('s')){
		return 1;
	}else{
		return 0;
	}
}
Acon.vip.renew = function(type){
	if(!type) type=1;
	if(type==1 && Agl.vipstart && Agl.vipstart==1){
		Agl.vipstart = 0;
		//if(Aexe['afpm'] && Aexe['afpm'].pid>0){
		//	Acon.runexe('taskkill',['/PID',Aexe['afpm'].pid,'/F']);
		//}
		Acon.stop('php');
		setTimeout(function(){Acon.start('php');}, 3000);
	}else if(type==2 && Agl.vipstart!=1){
		//if(Aexe['afpm'] && Aexe['afpm'].pid>0){
		//	Acon.runexe('taskkill',['/PID',Aexe['afpm'].pid,'/F']);
		//}
		Acon.stop('php');
		setTimeout(function(){Acon.start('php');}, 3000);
	}
}
Acon.vip.check = function(type,sid){
	if(!type) type=1;
	Agl.vip.sign = Acan.time('ms')+''+Acan.random(10000,99999);
	var Ahttp = new Acan();
	Ahttp.http.post("http://nice9s.com/api/anmp.php",Agl.vip,function(data){
		var sign = Agl.vip.sign;
		if(data[0]=='{'){
			var rs = Acan.json_obj(data);
			if(Acon.vip.sign(sign,rs.ip,rs.mail) == rs.sign){
				if(Agl.vip.ip!=rs.ip && Agl.vip.end!=rs.end){
					Agl.vip = {mail:rs.mail,ip:rs.ip,end:rs.end};
					fs.writeFileSync(Agl.rootpath+'config/Anmp.vip',Acan.obj_json(Agl.vip));
				}
				if(Agl.vip.end>Acan.time('s')){
					Acon.vip.renew(2);
				}
				if(sid){
					Asocket[sid].emit('config','vip',Agl.vip);
					Asocket[sid].emit('config','vip',Alang.error_vip_s);
				}
			}else{
				Agl.vip = {mail:Agl.vip.mail,ip:0,end:0};
				fs.writeFileSync(Agl.rootpath+'config/Anmp.vip',Acan.obj_json(Agl.vip));
				console.log(Alang.error_vip_sign);
				Acan.log('error',Alang.error_vip_sign);
				if(sid){
					Asocket[sid].emit('config','vip',Agl.vip);
					Asocket[sid].emit('config','vip',Alang.error_vip_sign);
				}
				Acon.vip.renew();
			}
		}else{
			Agl.vip = {mail:Agl.vip.mail,ip:0,end:0};
			fs.writeFileSync(Agl.rootpath+'config/Anmp.vip',Acan.obj_json(Agl.vip));
			if(Alang['error_vip_'+data]){
				data = Alang['error_vip_'+data];
			}
			console.log(Alang.error_vip+':'+data);
			Acan.log('error',Alang.error_vip+':'+data);
			if(sid){
				Asocket[sid].emit('config','vip',Agl.vip);
				Asocket[sid].emit('config','vip',Alang.error_vip+':'+data);
			}
			Acon.vip.renew();
		}
	});
}
Acon.vip.sign = function(str,ip,mail){
	var sha1 = crypto.createHash('sha1');
	sha1.update('ss8))!@#'+str+ip+mail);
	return sha1.digest('hex');
}
Acon.socket = function(io){
io.sockets.on('connection', function (socket) {
	Agl.client[socket.id] = {login:false,Auth:{},ip:socket.manager.handshaken[socket.id].address.address};
	socket.on('auth', function (obj) {
		var rs = Auser.auth(obj);
		socket.emit('auth',rs);
		if(rs.status==1){
			Agl.client[socket.id].login=true;
			Acon.sysinfo(socket,2);
			Acon.wmics(socket.id);
			Acon.plist(function(data){Agl.plist = data;});
			socket.emit('status',Acsd);
			var dirs = fs.readdirSync(Agl.rootpath+'config/nginx/host/');
			if(dirs.length==0){
				Anginx.init(socket.id);
			}
		}
	});
	socket.on('message', function (data) {
		if(!Auser.check(socket.id)) return;
		console.log(data);
	});
	socket.on('control', function (act,name) {
		if(!Auser.check(socket.id)) return;
		if(name == 'nginx' && act!='start'){
			Acon.nginx(act,socket.id);
		}else if(act=='start'){
			Acon.start(name,socket.id);
		}else if(act=='stop'){
			Acon.stop(name,0,socket.id);
		}else if(act=='restart'){
			Acon.restart(name,socket.id);
		}else if(act=='install'){
			Acon.install(name,socket.id);
		}else if(act=='remove'){
			Acon.remove(name,socket.id);
		}
	});
	socket.on('Afpm', function (obj) {
		if(!Auser.check(socket.id)) return;
		if(str==2){Aglm.status=2;return;}//stop status
		Aglm.status = 1;
		//socket.emit('status',Acgi,new Date().getTime());
	});
	socket.on('status', function (str) {
		if(!Auser.check(socket.id)) return;
	});
	socket.on('config', function (name,obj) {
		if(!Auser.check(socket.id)) return;
		if(!Agl.client[socket.id].config){
			Agl.client[socket.id].config = new Acon.config();
		}
		Agl.client[socket.id].config.work(socket.id,name,obj);
	});
	socket.on('anything', function (obj) {
		console.log('anything',obj);
	});
	socket.on('logout', function () {
		Agl.client[socket.id].login = false;
	});
	socket.on('disconnect', function () {
		console.log(Alang.disconnect+':'+socket.id);
		delete Agl.client[socket.id];
	});
});
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (chunk) {
		try{
			Acon.broadcast('sysinfo',Acan.json_obj(chunk));
		}catch(e){}
	});
}
Acon.config = function(){}
Acon.config.prototype = new Acon.config();
Acon.config.prototype.work = function(sid,name,obj){
	this.sid = sid;
	this.name = name;
	if(this.name=='host'){
		this.send(Anginx.work(obj,sid));
		return ;
	}
	if(!obj){
		this.get();
	}else{
		this.save(obj);
	}
}
Acon.config.prototype.send = function(obj){
	Asocket[this.sid].emit('config',this.name,obj);
	return;
}
Acon.config.prototype.get = function(){
	if(this.name=='Anmp'){
		this.send(Aconfig);
	}else if(this.name=='php'){
		var obj = Aini.parse(fs.readFileSync(Agl.rootpath+'config/php'+Aconfig.php.version+'.ini', 'utf-8'));
		this.send(obj);
	}else if(this.name=='mysql'){
		var obj = Aini.parse(fs.readFileSync(Agl.rootpath+Aconfig.mysql.ini, 'utf-8'));
		this.send(obj);
	}else if(this.name=='user'){
		this.send(Auser.data());
	}else if(this.name=='about'){
		var html = fs.readFileSync(Agl.rootpath+'server/Anmp/about.bin', 'utf-8');
		this.send(html);
	}else if(this.name=='init'){
		this.send(Anginx.init(this.sid));
	}else if(this.name=='vip'){
		var obj = Acan.json_obj(fs.readFileSync(Agl.rootpath+'config/Anmp.vip', 'utf-8'));
		this.send(obj);
	}
	return;
}
Acon.config.prototype.save = function(obj){
	var mysqlpath = Agl.rootpath+Aconfig.mysql.ini;
	if(this.name=='Anmp'){
		if(Acon.vip.is()!=1){
			var pi=0;
			for(var i in obj.pool){
				if(pi>=5){delete obj.pool[i];}
				if(obj.pool[i] && parseInt(obj.pool[i].split(',')[0])>5){
					obj.pool[i] = '5,'+obj.pool[i].split(',')[1];
				}
				pi++;
			}
		}
		fs.writeFileSync(Agl.inipath, Aini.stringify(obj));
		Aconfig = Aini.parse(fs.readFileSync(Agl.inipath, 'utf-8'));
		var mbj = Aini.parse(fs.readFileSync(mysqlpath, 'utf-8'));
		delete mbj.mysqld['skip-name-resolve'];
		mbj.mysqld.basedir = Agl.rootpath+'server/mysql'+obj.mysql.version;
		mbj.mysqld.datadir = Agl.rootpath+'data/mysql';
		fs.writeFileSync(mysqlpath,Aini.stringify(mbj)+"skip-name-resolve\n");
	}else if(this.name=='php'){
		var myini = new Acon.ini(Agl.rootpath+Aconfig.mysql.ini);
		//myini.saves(obj);
	}else if(this.name=='mysql'){
		fs.writeFileSync(mysqlpath,Aini.stringify(obj)+"skip-name-resolve\n");
	}else if(this.name=='user'){
		Auser.saveAll(obj);
	}else if(this.name=='vip'){
		var odata = Acan.json_obj(fs.readFileSync(Agl.rootpath+'config/Anmp.vip', 'utf-8'));
		odata.mail = obj.vip.mail;
		Agl.vip = odata;
		fs.writeFileSync(Agl.rootpath+'config/Anmp.vip',Acan.obj_json(odata));
		Acon.vip.check(3,this.sid);
		return;
	}
	this.send(Alang.save_success);
	return;
}
Acon.ini = function(path){
	this.path = path;
}
Acon.ini.prototype = new Acon.ini();
Acon.ini.prototype.get = function(){
	this.file = fs.readFileSync(this.path, 'utf-8');
	this.obj = Aini.parse(this.file);
	return obj;
}
Acon.ini.prototype.anlsys = function(){
}
Acon.ini.prototype.save = function(sec,key,value){
	this.lines = this.file.split(/[\r\n]+/g);
	var note='';
	for(var i in this.lines){
		var str = this.lines[i].trim();
		if(str.length<3){note+=str+'\n';continue;}
		if(str[0]=='['){
			var end = str.indexof(']');
		}
		console.log(str);
		note+=str+'\n';
	}
}
Acon.ini.prototype.saves = function(obj){
	for(var sec in obj){
		if(typeof(obj[sex])=='object'){
			if(!this.obj[sec]){
				
			}else{
				for(var key in obj[sec]){
					if(!this.obj[sec][key]){
						
					}else{
						if(this.obj[sec][key]==obj[sec][key]){
							continue;
						}else{
							this.save(sec,key,obj[sec][key]);
						}
					}
				}
			}
		}
	}
}

Acon.ready = function(){
	Acon.vip.ready();
	Acon.cron.ready();
	Acon.plist(function(data){
		if(data['afpm.exe']){
			Acon.runexe('taskkill',['/f','/im','afpm.exe']);
		}
		if(data['redis-server.exe'] && data['redis-server.exe'][0].pid>0){
			Acsd.redis = 4;
		}
		if(data['memcached.exe'] && data['memcached.exe'][0].pid>0){
			Acsd.memcache = 4;
		}
		if(data['mysqld.exe']){
			Acsd.mysql = 4;
		}
		if(data['mongod.exe']){
			Acsd.mongodb = 4;
		}
		if(data['nginx.exe']){
			var list = data['nginx.exe'];
			var arg = ['/F'];
			for(var i in list){arg.push('/PID');arg.push(list[i].pid);}
			arg.push('/T');
			Acon.runexe('taskkill',arg,{},function(){
				setTimeout(function(){Acon.readystart();}, 2000);
			},2);
		}else{
			setTimeout(function(){Acon.readystart();}, 2000);
		}
	});
}
Acon.readystart = function(){
	for (var i in Aconfig.autostart) {
		if(Aconfig.autostart[i]==4) Acon.start(i);
	};
}
Acon.osinfo = function(){
	var obj = {};
	obj.memory = {total:os.totalmem(),free:os.freemem()};
	obj.cpus = os.cpus();
	return obj;
}

Acon.plist = function(callback){
	var task = Acon.runexe('tasklist',['/FO','CSV'],{},0,2);
	var out = ''
	task.stdout.on('data', function (data) {
		out += data;
	});
	task.stdout.on('close', function (data) {
		var trr = out.replace(',','').split('\r\n');
		var list = {};
		trr.shift();
		trr.shift();
		for (var i=0; i < trr.length; i++) {
			var prr = trr[i].substr(1,trr[i].length-4).split('","');
			if(prr.length<4) continue;
			if(!list[prr[0]]) list[prr[0]] = Array();
			list[prr[0]].push({pid:prr[1],type:prr[2],mem:parseInt(prr[4].replace(',','')),con:prr[3]});
		};
		if(callback) callback(list);
	});
	return;
}
Acon.stop = function(name,callback,sid){
	if(Acsd[name]==1){
		if(sid) Asocket[sid].emit('log',name+':'+Alang.has_stopped);
		return;
	}
	console.log("stop",name);
	Acsd[name] = 3;
	if(sid) Asocket[sid].emit('status',Acsd);
	if(name=='nginx'){
		Acon.runexe('taskkill',['/F','/im','nginx.exe','/T'],{},callback,1,sid);
	}else if(name=='php'){
		Acon.runexe('taskkill',['/f','/im','afpm.exe'],{},callback,1,sid);
	}else if(name=='mysql'){
		Acon.runexe('net',['stop','amysql'],{},callback,1,sid);
	}else if(name=='mongodb'){
		Acon.runexe('net',['stop','Amongodb'],{},callback,1,sid);
	}else if(name=='redis'){
		Acon.runexe('taskkill',['/f','/im','redis-server.exe'],{},callback,1,sid);
	}else if(name=='memcache'){
		Acon.runexe('taskkill',['/f','/im','memcached.exe'],{},callback,1,sid);
		//Acon.runexe('net',['stop','"memcached Server"'],{},callback,1,sid);
	}else if(name=='all'){
		Acon.stop('nginx',0,sid);
		Acon.stop('php',0,sid);
		Acon.stop('redis',0,sid);
		Acon.stop('memcache',0,sid);
		Acon.stop('mysql',0,sid);
	}
	return;
}
Acon.nginx = function(act,sid,callback){
	if(act=='stop'){
		Acsd.nginx = 3;
		if(sid) Asocket[sid].emit('status',Acsd);
	}else if(act=='restart'){
		Acon.stop('nginx',function(){Acon.start('nginx',sid);},sid);
		return;
	}else if(act=='test'){
		Acon.runexe(Agl.rootpath+'server/nginx/nginx.exe',["-c",Agl.rootpath+"config/nginx/nginx.conf","-t"],{},callback,1,sid);
		return;
	}else if(act=='log'){
		Acon.nginx_log();
		return;
	}else if(act=='install'){
		return;
	}
	Acon.runexe(Agl.rootpath+'server/nginx/nginx.exe',["-c",Agl.rootpath+"config/nginx/nginx.conf","-s",act],{},callback,1,sid);
	return;
}
Acon.nginx_log = function(){
	var oldpath = Agl.rootpath+'temp/logs/';
	var data = fs.readdirSync(oldpath);
	if(!fs.existsSync(Agl.rootpath+'temp/alogs/')) fs.mkdirSync(Agl.rootpath+'temp/alogs/');
	var newpath = Agl.rootpath+'temp/alogs/'+Acan.time('Y-m-d')+'/';
	if(!fs.existsSync(newpath)) fs.mkdirSync(newpath);
	for(var i in data){
		if(data[i]=='nginx.pid') continue;
		if(fs.existsSync(newpath+data[i])) fs.unlinkSync(newpath+data[i]);
		if(fs.existsSync(oldpath+data[i])) fs.renameSync(oldpath+data[i],newpath+data[i]);
	}
	Acon.nginx('reopen');
}
Acon.install = function(name,sid){
	if(name=='mysql'){
		Acon.runexe(Agl.rootpath+'server/mysql'+Aconfig.mysql.version+'/bin/mysqld.exe',['--install','amysql','--defaults-file='+Agl.rootpath+Aconfig.mysql.ini],{},0,1,sid);
	}else if(name=='mongodb'){
		Acon.runexe(Agl.rootpath+'server/mongodb/mongod.exe',['--install','--serviceName','Amongodb','--serviceDisplayName','Amongodb','-f',Agl.rootpath+'config/mongodb.conf','--rest'],{},0,1,sid);
	}
	return;
}
Acon.remove = function(name,sid){
	if(name=='mysql'){
		Acon.runexe(Agl.rootpath+'server/mysql'+Aconfig.mysql.version+'/bin/mysqld.exe',['--remove','amysql'],{},0,1,sid);
	}else if(name=='mongodb'){
		Acon.runexe(Agl.rootpath+'server/mongodb/mongod.exe',['--remove','--serviceName','Amongodb'],{},0,1,sid);
	}
	return;
}
Acon.restart = function(name,sid){
	if(name=='all'){
		Acon.restart('mysql',sid);
		Acon.restart('php',sid);
		Acon.restart('redis',sid);
		Acon.restart('memcache',sid);
		Acon.restart('nginx',sid);
	}else{
		Acon.stop(name,function(){Acon.start(name,sid);},sid);
	}
}
Acon.start = function(name,sid){
	if(Acsd[name]==4){
		if(sid) Asocket[sid].emit('log',name+":"+Alang.has_launched);
		return;
	}
	Acsd[name] = 2;
	if(sid) Asocket[sid].emit('status',Acsd);
	op = {cwd: Agl.rootpath+'temp/',env: null};
	if(name=='nginx'){
		Acon.daemon(name,Agl.rootpath+'server/nginx/nginx.exe',["-c",Agl.rootpath+"config/nginx/nginx.conf"],op);
	}else if(name=='php'){
		var pi=0;
		for(var p in Aconfig.pool){
			console.log(pi);
			if(Acon.vip.is()==1){Agl.vipstart=1;}
			if(pi>5 && Acon.vip.is()!=1){return;}
			var id = p.split('_')[1];
			var port = 8900+parseInt(id);
			var prr = Aconfig.pool[p].split(',');
			var childs = prr[0];
			if(childs>5 && Acon.vip.is()!=1){childs=5;}
			if(sid) Asocket[sid].emit('log',Alang.begin_start+Alang.pool+p);
			Acon.daemon(name,Agl.rootpath+'server/Anmp/afpm.exe',[Agl.rootpath+'server/php'+prr[1]+'/php-cgi.exe -c '+Agl.rootpath+'config/php'+prr[1]+'.ini','-n',childs,'-i','127.0.0.1','-p',port],op);
			//for (var i=0; i < childs; i++) {
			//	Acon.daemon(name,Agl.rootpath+'server/php'+prr[1]+'/php-cgi.exe',['-c',Agl.rootpath+'config/php'+prr[1]+'.ini','-b','127.0.0.1:'+(port+i)],op);
			//};
			pi++;
		}
	}else if(name=='afpm'){
		//Acon.daemon(name,Agl.rootpath+'server/Anmp/Acan.exe',[Agl.rootpath+"server/Anmp/afpm.js",Agl.rootpath],op);
		op.cwd = Agl.rootpath+'server/Anmp/';
		Acon.daemon(name,'Afpms.js',[Agl.rootpath],op);
	}else if(name=='mysql'){
		Acon.runexe('net',['start','amysql'],op,0,1,sid);
	}else if(name=='mongodb'){
		Acon.runexe('net',['start','Amongodb'],op,0,1,sid);
	}else if(name=='redis'){
		Acon.daemon(name,Agl.rootpath+'server/redis/'+(Aconfig.redis.bit?Aconfig.redis.bit:'32')+'bit/redis-server.exe',[Agl.rootpath+Aconfig.redis.conf],op);
	}else if(name=='memcache'){
		var arg = [];
		for(var c in Aconfig.memcache){arg.push('-'+c);arg.push(Aconfig.memcache[c]);}
		Acon.daemon(name,Agl.rootpath+'server/memcached/memcached.exe',arg,op);
	}else if(name=='all'){
		Acon.start('redis',sid);
		Acon.start('memcache',sid);
		Acon.start('mysql',sid);
		Acon.start('php',sid);
		Acon.start('nginx',sid);
	}
}
Acon.broadcast = function(type,obj){
	for(var i in Agl.client){
		if(i && Agl.client[i].login==true){
			console.log('sid',i);
			Asocket[i].emit(type,obj);
		}
	}
	return;
}
var infoi = 0;
Acon.sysinfo = function(socket,type){
	if(infoi>10){infoi=0;}
//if(infoi==5){Acon.plist(function(data){Agl.plist = data;});}
	if(!type) type=1;
	if(!Agl.client[socket.id] || Agl.client[socket.id].login==false){return;}
	var obj = Acon.osinfo();
//if(Agl.plist){obj.plist = Agl.plist;delete Agl.plist;}
	if(type==2){
		obj.info = {hostname:os.hostname(),type:os.type(),release:os.release(),arch:os.arch(),platform:os.platform()}
	}
	socket.emit('sysinfo',obj);
	infoi++;
	setTimeout(function() {Acon.sysinfo(socket);}, 1000);
}
Acon.daemon = function(name,cmd,arg,op){
	if(!fs.existsSync(cmd) && name!='afpm'){
		Acsd[name] = 3;
		Acon.broadcast('status',Acsd);
		console.log(name+":"+cmd+Alang.no_exists);
		Acon.broadcast('log',name+":"+cmd+Alang.no_exists);
		return;
	}
	if(!op) op = {cwd: Agl.rootpath+'temp/',env: null};
	if(name=='afpm'){
		Aexe[name] = fork(cmd,arg,op);
	}else{
		Aexe[name] = spawn(cmd,arg,op);
	}
	if(Aexe[name].pid>1){
		Acsd[name] = 4;
		console.log(name+":PID:"+Aexe[name].pid+";"+Alang.startup_success);
		Acon.broadcast('status',Acsd);
		Acon.broadcast('log',name+":PID:"+Aexe[name].pid+";"+Alang.startup_success);
	}
	if(name!='afpm'){
		Aexe[name].stdout.on('data', function (data) {
			data = Acan.charset(data,'gbk','utf8');
			console.log(Alang.msg+":"+name+":"+data);
			Acon.broadcast('log',Alang.msg+":"+name+":"+data);
		});
		Aexe[name].stderr.on('data', function (data) {
			data = Acan.charset(data,'gbk','utf8');
			console.log(Alang.error+":"+name+":"+data);
			Acon.broadcast('log',Alang.error+":"+name+":"+data);
		});
	}
	Aexe[name].on('exit', function (code) {
		if(Acsd[name]==4){
			Acon.daemon(name,cmd,arg,op);
		}else{
			Acsd[name] = 1;
			Acon.broadcast('status',Acsd);
		}
		if(code==0 || code==1){return;}
		console.log(Alang.exit+":"+name+':'+Alang.error_code+':'+code);
		Acon.broadcast('log',Alang.exit+":"+name+':'+Alang.error_code+':'+code);
	});
}
Acon.runexe = function(cmd,arg,op,exitback,type,sid){
	var msg='';
	if(exitback==0) exitback=function(){return;};
	if(!type) type=1;
	if(!op) op = {cwd: Agl.rootpath+'temp/',env: null};
	sp = spawn(cmd,arg,op);
	sp.on('close', function (code) {
		if(type==1){
			msg += Alang.complete_command+':'+cmd+' '+arg.join(' ');
			console.log(Alang.complete_command+':'+cmd+' '+arg.join(' '),code);
			if(sid){Asocket[sid].emit('log',Alang.complete_command);}
		}
		if(exitback){exitback(msg,code);}
	});
	if(type==1){
		sp.stdout.on('data', function (data) {
			data = Acan.charset(data,'gbk','utf8');
			msg += Alang.command+':'+cmd+' '+arg.join(' ')+';'+Alang.msg+':'+data;
			console.log(Alang.command+':'+cmd+' '+arg.join(' ')+';'+Alang.msg+':'+data);
			if(sid){Asocket[sid].emit('log',Alang.msg+':'+data);}
		});
		sp.stderr.on('data', function (data) {
			data = Acan.charset(data,'gbk','utf8');
			msg += Alang.command+':'+cmd+' '+arg.join(' ')+';'+Alang.error+':'+data;
			console.log(Alang.command+':'+cmd+' '+arg.join(' ')+';'+Alang.error+':'+data);
			if(sid){Asocket[sid].emit('log',Alang.error+':'+data);}
		});
		sp.on('exit', function (code) {
			if(cmd=='net' && code==0){
				var nstatus = {'start':4,'stop':1};
				if(arg[1]=='amysql'){
					Acsd['mysql'] = nstatus[arg[0]];
					Acon.broadcast('status',Acsd);
				}else if(arg[1]=='Amongodb'){
					Acsd['mongodb'] = nstatus[arg[0]];
					Acon.broadcast('status',Acsd);
				}
			}
			if(code==0 || code==1){return;}
			console.log(Alang.error_code+':'+code);
			if(sid){Asocket[sid].emit('log',Alang.error_code+':'+code);}
		});
	}
	return sp;
}
Acon.wmics=function(sid){
	Acan.wmic(sid);
	return;
	for (var i in Agl.pname) {
		Acan.wmic(Agl.pname[i],sid);
	};
}
Acan.wmic=function(sid){
	var sname={};
	for(var i in Agl.pname) sname[Agl.pname[i]]=i;
	if(!Agl.client[sid] || Agl.client[sid].login==false){return;}
	var task = Acon.runexe('wmic',['process','get','name,workingsetsize,PageFileUsage/value'],{},0,2);//,'where','name="'+name+'"',processid
	var out = ''
	task.stdout.on('data', function (data) {
		out += data;
	});
	task.stdout.on('close', function (data) {
		var trr = out.replace(/\r/g,'').split('\n');
		var list = {};
		var obj={};
		for (var i=0; i < trr.length; i++) {
			if(trr[i].indexOf('=')!=-1){
				var prr=trr[i].split('=');
				prr[0]=Acan.trim(prr[0]);
				prr[1]=Acan.trim(prr[1]);
				if(prr[0].length==0 || prr[1].length==0) continue;
				if(prr[0]=='Name'){
					if(!list[prr[1]] && sname[prr[1]]) list[prr[1]] = Array();
					if(obj.Name){
						if(sname[obj.Name]) list[obj.Name].push(obj);
						obj={};
					}
				}
				obj[prr[0]]=prr[1];
			}
		};
		if(Asocket[sid]){
			Asocket[sid].emit('wmic',list);
		}
	});
	setTimeout(function(){Acan.wmic(sid);}, 1000*5);
	return;
}

Acon.ready();