var HTTP = require('http');
var URL = require('url'),Querystring = require('querystring');

var Acan = module.exports = function(){};
Acan.regexp = {
	"mail":/([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-]+)/g,
	"phone":/1(3|5|8)[0-9]{9}/g,
	"tel":/([0-9]{3,4}-[0-9]{7,8})/g
};
Acan.trim = function(str){
	if(typeof(str)!='string') return str;
	return str.replace(/(^\s*)|(\s*$)/g, "");
}
Acan.count = function(obj){
	var i = 0;
	if(typeof(obj)=='object' || typeof(obj)=='Array')
	for(var x in obj){
		i++;
	}
	return i;
}
Acan.in_array = function(str,arr){
	for(var i in arr){
		if(arr[i] == str){
			return true;
		}
	}
	return false;
}
Acan.str_obj = function(str){
	var arrs = new Object();
	var arr = str.split(',');
	for(var i=0;i<arr.length;i=i+2){
		arrs[arr[i]] = arr[i+1];
	}
	return arrs;
}
Acan.obj_json = function(o){
	//try{if(JSON){return JSON.stringify(o);}}catch(e){}
	var r = [];
	if(o===null) return "null";
	if(typeof o =="string") return "\""+o.replace(/([\'\"\\])/g,"\\$1").replace(/(\n)/g,"\\n").replace(/(\r)/g,"\\r").replace(/(\t)/g,"\\t")+"\"";
	if(typeof o =="undefined") return "";
	if(typeof o == "object"){
		if(Acan.count(o)==0){return '';}
		if(o===null) return "null";
	//	else if(!o.sort){
			for(var i in o){
				if(i == 'length'){continue;}
				r.push('"'+i+'"'+":"+Acan.obj_json(o[i]))
			}
			r="{"+r.join()+"}"
	/*		}else{
			for(var i =0;i<o.length;i++)
				r.push(Acan.obj_json(o[i]))
			r="["+r.join()+"]"
		}*/
		return r;
	}
	if(typeof o == "number"){
		return o.toString();
	}
	return o.toString();
}
Acan.charset = function(str,inc,out){
	if(!inc || inc=='gbk' || inc=='gb2312') inc ='GBK';
	if(!out || out=='utf8' || out=='utf-8') out ='UTF-8';
	//if(!Iconv) return str;
	//return (new Iconv('GBK','UTF-8')).convert(new Buffer(str,'binary')).toString(out);
	if(inc=='GBK' && out=='UTF-8'){return gbk_dict.gbkToUTF8(str);}
	else{return str;}
}

Acan.json_obj = function(str){
	if(typeof str == 'string' && Acan.in_array(str.substring(0,1),['{','[','"'])){/*}*/
		try{
			return (new Function("return "+str))();
		}catch(e){
			return {};
		}
	}else{
		return {};
	}
}

Acan.form_str = function(data,parent){
	var str='',add='';
	if(typeof(data)=='object' || typeof(data)=='array'){
		for (var i in data) {add=i;if(parent){add = parent+"["+i+"]";}
			if(typeof(data)=='object' || typeof(data)=='array'){str += Acan.form_str(data[i],add);}else{str += add+"="+data[i]+"&";}};
	}else{if(parent){str = parent+"="+data+"&";}else{str = data+"&";}}
	return str;
}

Acan.random = function(min,max){
	var rand;
	if(!min && !max && min!=0 && max!=0){rand = Math.floor(Math.random()*100+1);}
	else if(min>0 && !max){rand = Math.floor(Math.random()*min);}
	else{rand = Math.floor(Math.random()*max+min);}
	return rand;
}
Acan.prototype = {
	parent:this,
	run:function(obj){
		if(typeof(obj)=='object'){
			if(this.in_array('Aurl',obj)){
				console.log("Aurl:");
				this.Aurl(obj.Aurl);
			}
		}
	},
	http:{
		request:function(type,url,data,callback){
			if(!type) type='GET';
			var urlobj = URL.parse(url);
			var options = {host: urlobj.hostname,port: urlobj.port,path: urlobj.path,method: type};
			if(type=='POST'){
				options.headers = {
					'Content-Type':'application/x-www-form-urlencoded',
					'Content-Length':data.length};
				curl.post(url, data, options, function(err, res, data){
if(err){return;}
					console.log('STATUS: ' + res.statusCode);
					callback(data);
				});
			}else{
				curl.get(url, options, function(err, res, data){
					if(err){throw err;}
					console.log('STATUS: ' + res.statusCode);
					callback(data);
				});
			}
			return;
			/*
			var req = HTTP.request(options, function(res) {
				console.log('STATUS: ' + res.statusCode);
				//console.log('HEADERS: ' + JSON.stringify(res.headers));
				res.setEncoding('utf8');
				res.on('data', callback);
			});
			req.on('error', function(e) {
				console.log('problem with request: ' + e.message);
			});
			try{
				if(data){req.write(data);}
			}catch(e){}
			req.end();*/
		},
		get:function(url,callback){
			return this.request("GET",url,'',callback);
		},
		post:function(url,data,callback){
			return this.request("POST",url,Acan.form_str(data),callback);
		},
	}
};
Acan.time = function(type,t){
	if(!type) type='s';
	var now;
	if(!t){now=new Date();}
	else if(t>0 && t<9000000000){
		now=new Date(t*1000);
	}else if(t>9000000000){now=new Date(t);}
	if(type=='s') return Math.floor(now.getTime()/1000);
	else if(type=='ms') return now.getTime();
	else if(type.length>0){
		var day=[];
		day.Y = now.getFullYear();
		day.m = now.getMonth()+1;
		day.d = now.getDate();
		day.w = now.getDay();
		day.H = now.getHours();
		day.i = now.getMinutes();
		day.s = now.getSeconds();
		for (var key in day) {
			if(day[key]<10){day[key] = '0'+day[key];}
			type = type.replace(key,day[key]);
		};
		return type;
	}
}
Acan.sleep = function(st){
	var start = new Date().getTime();
	while(new Date().getTime()<start+st);
}

//----Acan.html
Acan.html = function(obj){return Acan.html.anew(obj);}
Acan.html.anew = function(obj){this.obj=obj;return this;}
//---------Acan.html.tag-----------
Acan.html.span = function(html,arr){return this.tag('span',arr,html);}
Acan.html.p = function(html,arr){return this.tag('p',arr,html);}
Acan.html.a = function(html,arr){return this.tag('a',arr,html);}
Acan.html.li = function(html,arr){return this.tag('li',arr,html);}
Acan.html.ul = function(html,arr){return this.tag('ul',arr,html);}
Acan.html.dd = function(html,arr){return this.tag('dd',arr,html);}
Acan.html.dt = function(html,arr){return this.tag('dt',arr,html);}
Acan.html.div = function(html,arr){return this.tag('div',arr,html);}
Acan.html.text = function(html,arr){return this.tag('text',arr,html);}
Acan.html.textarea = function(html,arr){return this.tag('textarea',arr,html);}
Acan.html.dl = function(arr,html){return this.tag('dl',arr,html);}
Acan.html.tag = function(type,arr,html){
	if(!arr){var arr={};}
	if(!html){ html = '';}
	var adds = '</'+type+'>';
	var adde = '';
	if(Acan.base.in_array(type,['input','br','hr'])){
		var adds = '';
		var adde = '/';
	}
	var str = this.base.unite(arr,type);
	var strs = '<'+type+' '+str+adde+'>'+html+adds;
	if(arr.type == 'text'){
		strs = html+'<'+type+' '+str+'>'+adds;
	}else if(type == 'textarea'){
		strs = '<'+type+' '+str+'>'+html+adds;
	}
	return strs;
}
Acan.html.radio = function(obj,data,val,label){
	var radios = '';
	var opobj = obj;
	opobj.type = "radio";
	for(var x in data){
		opobj.value = x;
		if(x == 'length'){continue;}
		if(x == val){opobj.checked = 'checked';}
		radios += this.tag('input',opobj,data[x]);
		delete opobj.checked;
	}
	if(!label){var label = ""}
	return label+radios;
}
Acan.html.checkbox = function(obj,data,val,label){
	var radios = '';
	var opobj = obj;
	opobj.type = "checkbox";
	opobj.name = opobj.name+"[]";
	for(var x in data){
		opobj.value = x;
		if(x == 'length'){continue;}
		if(x == val){opobj.checked = 'checked';}
		radios += this.tag('input',opobj,data[x]);
		delete opobj.checked;
	}
	if(!label){var label = ""}
	return label+radios;
}
Acan.html.select = function(obj,data,val,label){
	var option = '';
	for(var x in data){
		var opstr = Object();
		if(x == 'length'){continue;}
		opstr.value = x;
		if(x == val){opstr.selected = 'selected';}
		option += this.tag('option',opstr,data[x]);
	}
	if(!label){var label = ""}
	return label+this.tag('select',obj,option);
}
Acan.html.inputs = function(obj,data,val,label){
	var str = '';
	if(data.length == 0){return;}
	for(var i in data){
		if(i == 'length'){continue;}
		delete obj.checked;
		obj.value = i;
		if(typeof(val) == 'object'){
			if(Acan.base.in_array(i,val)){obj.checked = 'checked';}
		}else if(typeof(val) == 'string'){
			if(val == i){obj.checked = 'checked';}
		}
		str += this.tag('input',obj, this.tag('span','',data[i]));
	}
	if(!label){var label = ""}
	return label+str;
}
//--Acan.html.base
Acan.html.base = function(){}
Acan.html.base.unite = function(arr,type){
	var str = "";
	if(arr.length = 0){return;}
	for(var i in arr){
		if(i == 'length'){continue;}
		if(type == 'textarea'){if(i == 'type' || i == 'value' || i == 'size'){continue;}}
		str += i+'="'+arr[i]+'" ';
	}
	return str;
}
//var Ahtml = Acan.html();
Acan.mysql = function(option){
	this.option = option;
	this.mysql = mysql;
	this.client = null;
	this.link();
}
Acan.mysql.prototype.link=function(){
		if(this.mysql.createClient) {
			this.client = this.mysql.createClient(this.option);
		} else {
			this.client = new this.mysql.Client(this.option);
			this.client.connect(function(err) {
				if(err) {
					console.error('connect db ' + this.client.host + ' error: ' + err);
					process.exit();
				}
			});
		}
		return this.client;
}
Acan.mysql.prototype.test = function(){
	console.log(this.tables);
}
Acan.mysql.prototype.model = function(table){
	if(!this.tables) this.tables={};
	if(!this.tables[table]) this.tables[table]={};
	var obj = {table:''};
	var status=false;
	this.columns(table,function(data){
		obj = {
			'table':table,
			query:this.query,
			client:this.client,
			save:this.save,
			fields:data.fields,
			comment:data.comment,
			columns:data
		};
		status=true;
	});
	//while(status==false){};
	this.tables[table] = obj;
	return this.tables[table];
}
Acan.mysql.prototype.columns=function(table,callback){
	this.tables[table] = obj;
	var sql = "SHOW FULL FIELDS FROM "+table;
	var obj = {fields:[],comment:{}},key_name='';
	this.client.query(sql,function selectCb(err, rs, fields) {
		if(err){throw err;}
		for(var i in rs){
			if(rs[i].Key == 'PRI' && key_name==''){
				key_name = rs[i].Field;
			}
			obj.fields[i] = rs[i].Field;
			obj.comment[rs[i].Field] = rs[i].Comment;
		}
		obj.key_name = key_name;
		callback(obj);
	});
}
Acan.mysql.prototype.query=function(sql,callback){
	if(sql.substr(0,6)=="SELECT"){
		return this.client.query(sql,function selectCb(err, results, fields) {
			if(err){throw err;}
			if(callback){
				callback(results, fields);
			}
		});
	}else{
		return this.client.query(sql,function(err, results) {
			if(err){throw err;}
			if(callback){
				callback(results);
			}
		});
	}
}
Acan.mysql.prototype.update=function(val,con,callback,type){
	var sql = this.unisql_update(val,con,type);
	return this.client.exec(sql,callback);
}
Acan.mysql.prototype.updatePk=function(val,pk,callback){
	var sql = this.unisql_update(val,'`'+this.key_name+'`=\''+pk+'\'');
	return this.client.exec(sql,callback);
}
Acan.mysql.prototype.updateAll=function(val,con,callback,type){
	$sql = this.unisql_update(val,con,type);
	return this.client.exec($sql);
}
Acan.mysql.prototype.save=function(data,callback,type){
	if(!type) type=2;//1 To force inserted,2 To identify whether there are KEY
	var sql='',rs;
	if(typeof data == 'object'){
		if(data[this.key_name]){
			rs = this.updatePk(data,data[this.key_name]);
		}else{
			sql = this.unisql_insert(data);
		}
	}
	if(sql){
		this.client.query(sql,	function selectCb(err, results, fields) {
			if(err){throw err;}
			callback(results, fields);
		});
	}
}
//sql unite INSERT INTO
Acan.mysql.prototype.unisql_insert=function(data){
	var col='',val='';
	for(var fd in data){
		if(!data[fd] && data[fd] != 0){continue;}
		if(!Acan.in_array(fd,this.fields)){continue;}
		col += "`"+fd+"`,";
		val += "'"+data[fd]+"',";
	}
	return "INSERT INTO `"+this.table+"` ("+col.substr(0,-1)+") VALUES("+val.substr(0,-1)+")";
}
//sql unite UPDATE
Acan.mysql.prototype.unisql_update=function(val,con,type){
	if(!type) type = 'field';
	var set='',where='',select='',limit='',join='',order='',group='';
	if(typeof val=='object'){
		for(var field in val){
			if(!this.fields[field]){continue;}
			val[field] = val[field].replace(/\\\'/g,"'").replace(/\'/g,"\\'");
			set += '`'+field+'`=\''+val[field]+'\',';
		}
		set = set.substr(0,-1);
	}else if(typeof val=='string'){
		set = val;
	}
	if(typeof con=='string'){
		where = con;
	}else if(typeof con=='object'){
		for(var i in con){
			if(type=='field'){
				where += ' `'+i+'` = \''+con[i]+'\' and';
			}else{
				switch(i){
					case 'select':
						select = con[i];
					case 'limit':
						limit = con[i];
					case 'join':
						join = con[i];
					case 'group':
						group = ' GROUP BY '+con[i];
					case 'order':
						order = ' ORDER BY '+con[i];
					case 'where':
						where = con[i];
				}
			}
		}
		if(type=='field'){
			where = where.substr(0,-4);
		}else{
			where = join+where+group+by+limit;
		}
	}
	return "UPDATE `"+this.table+"` SET"+set+where;
}
