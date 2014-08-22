var fs = require('fs');
var http = require("http"),https=require("https"),url = require("url"),querystring=require('querystring');
global.Aini = require('ini');
global.Agl = {client:{},fate:{},rootpath:fs.realpathSync(process.cwd()+'/../').replace('\\','/')+'/',starttime:new Date().getTime()};
Agl.inipath = Agl.rootpath+'config/Anmp.ini';
Agl.hostpath = Agl.rootpath+'config/ahost/';
Agl.confpath = Agl.rootpath+'config/nginx/host/';
Agl.anmppath = Agl.rootpath+'server/Anmp_web_client';
Agl.regexp = {
	"mail":/([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-]+)/g,
	"phone":/1(3|5|8|4)[0-9]{9}/g,
	"tel":/([0-9]{3,4}-[0-9]{7,8})/g,
	"domain":/([a-zA-Z0-9_-]+\.)+([a-zA-Z0-9_-]+)/g,
	"ip":/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/g
}
global.Ahs = {};
global.Aconfig = Aini.parse(fs.readFileSync(Agl.inipath, 'utf-8'));//Anmp配置文件
global.Acsd = {nginx:1,php:1,memcache:1,mysql:1};//进程状态
var Aglm={host:"127.0.0.1",ports:{},cgitimeout:120,status:2};
if(!Aconfig.anmp){Aconfig.anmp={};}
if(!Aconfig.anmp.http){Aconfig.anmp.http=8093;}
//var io = require('socket.io').listen(8900,{ log: false });
var io = require('socket.io').listen(8900);
global.Asocket = io.sockets.sockets;
global.curl = require('curl');
global.Acan = require('./Acan');
global.Auser = require('./Auser');
global.Anginx = require('./Anginx');
global.Acon = require('./Acon');
global.Alang = require('./Alang');
global.gbk_dict = require('gbk-dict').init();
io.set('log level',1);
Acon.socket(io);
//创建服务
start_server();
function start_server(){
	var server = http.createServer(function(req, res) {
		var urls = url.parse(req.url);
		var arg = urls.query;
		var post='',get = querystring.parse(arg),method="GET";
		var pathname = urls.pathname;
		if(pathname=='/favicon.ico'){return;}
		//Arunlog(req.headers);
		var sid=(new Date()).getTime()+''+Math.floor(Math.random()*1000);
		//将session_id 当做客户id
		if(get['Asid'] && get['Asid'].length>0){
			sid = get['Asid'];
			delete get['Asid'];
			arg = querystring.stringify(get);
		}
		Arunlog(sid+' client ip:'+req.connection.remoteAddress+',url:'+req.headers.host);
		//保存至全局
		if(!Ahs[sid]){
			Ahs[sid] = {stime:(new Date()).getTime(),res:res,method:method,urls:urls,data:''};
		}else{
			Ahs[sid].urls = urls;
			Ahs[sid].res = res;
			Ahs[sid].data = '';
			Ahs[sid].method = 'GET';
		}
		if(get['method'] && get['method'].length>0){Ahs[sid].method = get['method'];}
		Ahs[sid].qtime = (new Date()).getTime();
		req.setEncoding('utf8');
		req.addListener('data', function(postData) {
			post += postData;
		});
		req.addListener('end', function() {
			if(post){
				Ahs[sid].data = post;
			}
			if(pathname == '/reload'){
				res.writeHeader(200, {"Content-Type": "text/html"});
				res.write("重载成功");
				res.end();
			}else if(pathname == '/nginx_reload'){
				var msg = '',status=0;
				var hrs = hosts_up(get['domain'],get['ip']);
				if(hrs.status==1){
					status=1;
					nginx_reload(sid);
					msg = '保存成功';
				}else{
					msg = hrs.msg;
					jsonreturn(sid,{status:status,msg:msg});
				}
				return;
			}else{
				//http访问
				http_res(res,pathname);
			}
			//Arunlog(post);
			//if(Ahs[sid]){delete Ahs[sid].res;}
		});

	}).listen(Aconfig.anmp.http);
}

function jsonreturn(sid,obj){
	Ahs[sid].res.writeHeader(200, {"Content-Type": "application/json; charset=UTF-8","Access-Control-Allow-Origin":"*"});
	Ahs[sid].res.end(JSON.stringify(obj));
}
function http_res(res,pathname){
	if(pathname=='/'){pathname = '/index.html';}
	var ext = pathname.split('.').pop();
	var content_type = 'text/html; charset=utf-8';
	if(ext=='css'){content_type = 'text/css; charset=utf-8';}
	if(ext=='js'){content_type = 'application/javascript';}
	var fsop = { flags: 'r',encoding: 'utf-8',fd: null,mode: 0666,autoClose: true};
	if(ext=='jpg'){content_type = 'image/jpeg';delete fsop.encoding;}
	if(ext=='png'){content_type = 'image/png';delete fsop.encoding;}
	if(!fs.existsSync(Agl.anmppath+pathname)){
		res.writeHeader(404);
		return res.end('404 Not Found:'+pathname);
	}
	var stats = fs.statSync(Agl.anmppath+pathname);
	fs.readFile(Agl.anmppath+pathname,fsop,function (err,data) {
		if (err) {
			res.writeHeader(500);
			return res.end('Error loading '+pathname);
		}else{
			res.writeHeader(200,{"Content-Type": content_type,'Content-Length' : stats.size});
			res.end(data);
		}
	});
}

function hosts_up(domain,ip){
	var rs = {status:0,msg:""};
	if(!domain){rs.msg='域名不存在!';return rs;}
	if(!ip){rs.msg='ip不存在!';return rs;}
	Agl.regexp.domain.lastIndex=0,Agl.regexp.ip.lastIndex=0;
	if(!Agl.regexp.domain.test(domain)){rs.msg=domain+'域名不正确!';return rs;}
	if(!Agl.regexp.ip.test(ip)){rs.msg=ip+'ip不正确!';return rs;}
	var filename = 'C:/WINDOWS/system32/drivers/etc/hosts';
	//更新本地hosts dns解析
	var data = fs.readFileSync(filename,{encoding:'utf8'});
	var drr = data.replace(/\r/g,"").split("\n"),hbj={},str='';
	for (var i in drr) {
		if(drr[i].length<3){continue;}
		hrr = drr[i].split("\t");
		if(hrr[1].length<1 || hrr[0].length<1){continue;}
		hbj[hrr[1]] = hrr[0];
	};
	hbj[domain] = ip;
	for(var i in hbj){
		str += hbj[i]+"\t"+i+"\n";
	}
	fs.writeFileSync(filename,str,{encoding:'utf8'});
	rs.status=1;
	rs.msg='本地hosts更新成功';
	return rs;
}
function nginx_reload(sid){
	Acon.nginx('reload',null,function(msg,code){
		jsonreturn(sid,{status:code,msg:msg});
	});
}
function Arunlog(obj,type){
	console.log(obj);
}