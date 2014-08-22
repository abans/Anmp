var fs = require('fs');
var hostpath = Agl.hostpath;
var confpath = Agl.confpath;
var Anginx = module.exports = function(){};
Anginx.work = function(obj,sid){
	if(!obj){
		return Anginx.list();
	}else if(obj.act == 'save'){
		return Anginx.save(obj,sid);
	}else if(obj.act == 'info'){
		return Anginx.info(obj.name);
	}else if(obj.act == 'del'){
		return Anginx.del(obj);
	}else{
	}
}
Anginx.list = function(){
	var data = fs.readdirSync(hostpath);
	return {act:'list',list:data};
}
Anginx.info = function(name){
	var obj;
	if(name){
		obj = Acan.json_obj(fs.readFileSync(hostpath+name, 'utf-8'));
	}
	if(!obj || !obj.info) obj={info:{}};
	if(Acon.vip.is()!=1 && obj.info.ex){
		delete obj.info.ex;
	}
	return {act:'info',name:name,info:obj.info,pool:Acan.count(Aconfig.pool)};
}
Anginx.init = function(sid){
	if(fs.existsSync(hostpath+'phpmyadmin')){
		var obj = Acan.json_obj(fs.readFileSync(hostpath+'phpmyadmin', 'utf-8'));
		obj.info.root = Agl.rootpath+'server/phpmyadmin';
		obj.save = obj.info;
		Anginx.save(obj,sid);
	}
	if(fs.existsSync(hostpath+'localhost')){
		var obj = Acan.json_obj(fs.readFileSync(hostpath+'localhost', 'utf-8'));
		obj.info.root = Agl.rootpath+'www';
		obj.save = obj.info;
		Anginx.save(obj,sid);
	}
	if(Acsd['nginx']==4){Acon.nginx('reload',sid);}
	return {act:'rs',msg:Alang.init_success};
}
Anginx.save = function(obj,sid){
	if(Acon.vip.is()!=1 && obj.save.ex) delete obj.save.ex;
	fs.writeFileSync(hostpath+obj.name,Acan.obj_json({info:obj.save,name:obj.name}));
	var conf = 'server {\n';
	var pt = ['listen','server_name','root','index','autoindex'];
	for(var i in obj.save){
		var str = obj.save[i];
		if(Acan.in_array(i,pt) && str.length>0){
			conf += '\t'+i+" "+str+';\n';
		}else if(i=='error_log'){
			if(str=='off' || str=='' || str=='nul') str='nul';
			conf += '\t'+i+" "+str+';\n';
		}else if(i=='access_log'){
			if(str=='off' || str=='' || str=='nul') str='off';
			conf += '\t'+i+" "+str+';\n';
		}else if(i=='ssi'){
			conf += '\t'+'include ssi.conf;\n';
		}
	}
	if(obj.save.ex && Acon.vip.is()==1){
		for (var i in obj.save.ex) {
			conf += Anginx.ex(obj.save.ex[i]);
		};
	}
	if(obj.save.other){
		var str = obj.save.other;
		conf += str+'\n';
	}
	if(obj.save.pool){
		var str = obj.save.pool;
		if(str>0) conf += '\tlocation ~ .*\\.(php|php5)?$ {\n\t\tfastcgi_pass 127.0.0.1:'+(8900+parseInt(str))+';\n\t\tinclude afastcgi.conf;\n\t}\n';
	}
	conf += '}\n';
	fs.writeFileSync(confpath+obj.name+'.conf',conf);
	if(obj.type==3){
		Acon.nginx('reload',sid);
	}
	return {act:'rs',msg:Alang.save_success,call:obj.call};
}
Anginx.ex = function(obj,add){
	var str = '';
	if(obj.path){
		str += '\tlocation /'+obj.path+' {\n'
		for (var i in obj) {
			str += Anginx.ex(obj[i],'\t');
		};
		str += '\t}\n';
	}else if(obj.rate){
		if(obj.rate_after) str += add+'\tlimit_rate_after '+obj.rate_after+'m;\n';
		str += add+'\tlimit_rate '+obj.rate+'k;\n';
	}else if(obj.valid){
		str += add+'\tvalid_referers ';
		if(obj.valid_type[0]==1) str += 'none ';
		if(obj.valid_type[1]==2) str += 'blocked '
		str += obj.valid+';\n';
		str += add+'\tif ($invalid_referer) {\n'+add+'\t\treturn 500;\n'+add+'\t}\n';
	}else if(obj.alias){
		str += add+'\talias '+obj.alias+';\n';
	}else if(obj.error){
		str += add+'\terror_page '+obj.error_code+' '+obj.error+';\n';
	}else if(obj.other){
		str += obj.other+'\n';
	}
	return str;
}
Anginx.del = function(obj){
	var path = hostpath+obj.name,cpath = confpath+obj.name+'.conf';
	if(fs.existsSync(path)){
		fs.unlinkSync(path);
	}
	if(fs.existsSync(cpath)){
		fs.unlinkSync(cpath);
	}
	return {act:'rs',msg:Alang.delete_success,call:obj.call};
}
