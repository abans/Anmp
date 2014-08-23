var net = require('net');
var LOCAL_PORT  = 89;
var REMOTE_PORT = 80;
var REMOTE_ADDR = "127.0.0.1";
var Als={},Acs={};
Anat(189,89,'192.168.10.30');
Anat(8000,8000,'192.168.10.30');
Anat(554,554,'192.168.10.30');
Anat(8389,8389,'112.124.9.158');
Anat(89,80,'112.124.9.158');
function Anat(port1,port2,ip){
	Als[port1] = net.createServer(function (socket) {
			var client = new net.Socket();
			client.connect(parseInt(port2),ip,function(){
			});
			//client.end();
		socket.on('connect', function () {
			console.log('  ** START **');
		});
		socket.on('data', function (msg) {
			client.write(msg);
			client.on("data", function (data) {
				socket.write(data);
			});
			client.on("error", function (e,code) {
				console.log('client err',e,code)
				socket.destroy();
			});
			client.on("end", function (data) {
				if(socket) socket.destroy();
				if(client) client.destroy();
			});
		});
		socket.on('close', function (msg) {
			if(socket) socket.destroy();
			if(client) client.destroy();
		});
		socket.on('end', function (msg) {
			if(socket) socket.destroy();
			if(client) client.destroy();
		});
		socket.on('error',function(e,code){
			console.log('server error',e,code);
			if(socket) socket.destroy();
			if(client) client.destroy();
		});
	});
	Als[port1].listen(port1);
	Als[port1].maxConnections=1000;
	console.log("TCP server accepting connection on port: " + port1);
}