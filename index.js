var cluster = require('cluster');
var net = require('net');

var stdin = process.stdin;

var utils = require('./utils.js');

var port = 80;
var root = './httptest'
var nodes = require('os').cpus().length;

var args = process.argv.slice(2);
for (var i = 0; i < args.length; ++i){
	if (args[i] == '-p' && parseInt(args[i + 1]) > 0 && parseInt(args[i + 1]) < 65535){
		port = parseInt(args[i + 1]); ++i;
	} else
		if (args[i] == '-r' && typeof args[i + 1] != 'undefined') {
			root = args[i + 1]; ++i;
		} else
			if (args[i] == '-n' && typeof args[i + 1] != 'undefined') {
				nodes = args[i + 1]; ++i;
			}
}


if (cluster.isMaster) {
	var timeout;
	console.log('Для отключения сервера нажмите ctrl-c!');

	for (var i = 0; i < nodes; i++) {
	    cluster.fork();
	}

	Object.keys(cluster.workers).forEach(function(id) {
    	cluster.workers[id].on('exit', function(){console.log('Воркер ' + id + ' выключается')});
  	});

  	Object.keys(cluster.workers).forEach(function(id) {
    	cluster.workers[id].on('disconnect', function(){console.log('Воркер ' + id + ' удалил все подключения')});
  	});

  	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('error',function(e) { console.error('Error: ' + e); });
  	});


	stdin.setRawMode( true );
	stdin.resume();
	stdin.setEncoding( 'utf8' );
	stdin.on( 'data', function( key ){
    	// ctrl-c
		if ( key === '\u0003' ) {
			//process.exit();
		  	Object.keys(cluster.workers).forEach(function(id) {
				cluster.workers[id].disconnect();
      			cluster.workers[id].kill();
  			});
  			timeout = setTimeout(function() {
  				console.log('Завершение работы сервера.');
				process.exit();
			}, 1000);
		}
		//process.stdout.write( key );
	});
} else 
	if (cluster.isWorker) {
		console.log('Я воркер #' + cluster.worker.id + 
				' и я буду слушать ' + port + ' порт.');
		server(port, root);
	}

function server(port) {
	net.createServer(function(c) {
		c.on("error",function(e) { 
			console.error('Server error: ' + e)
		});

		c.on('data', function(data) {
			header = utils.readHeader(data.toString(), root);
			utils.handler(header, c);
		});
	}).listen(port);
}