var fs = require('fs'),crypto = require('crypto');
var datapath = Agl.rootpath+'config/Auser.bin';
var Adata;
var Auser = module.exports = function(){};

Auser.check = function(sid){
	if(Agl.client[sid] && Agl.client[sid].login){
		return true;
	}
	return false;
}
Auser.auth = function(obj){
	var password = Auser.password(obj.password);
	var rs = {};
	rs.time = Agl.starttime;
	rs.msg = Alang.user_not_exist;
	rs.status = 0;
	for(var i in Adata){
		if(Adata[i].username == obj.username){
			if(Adata[i].password==password){
				rs.msg = Alang.auth_success;
				rs.status=1;
			}else{
				rs.msg = Alang.password_error;
			}
			break;
		}
	}
	return rs;
}
Auser.data = function(){
	return Acan.json_obj(fs.readFileSync(datapath, 'utf-8'));
}
Auser.password = function(str){
	return crypto.createHash('sha1').update(str+'#anmp&*').digest("hex");
}
Auser.saveAll = function(obj){
	for(var i in obj){
		for(var x in obj[i]){
			if(x=='password'){
				obj[i][x] = Auser.password(obj[i][x]);
			}
		}
	}
	fs.writeFileSync(datapath, Acan.obj_json(obj));
	Adata = Auser.data();
	return;
}
Auser.add = function(){
	
}
Auser.del = function(){
	
}
Adata = Auser.data();