function readHeader(request, root) {
	var success = true;

	var method = request.substring(0, request.indexOf(" "));
	var path = request.substring(method.length + 1, request.indexOf("HTTP") - 1);

	if (path.indexOf("?") > -1){
        path = path.substring(0, path.indexOf("?"));
    }
	path = decodeURI(path);
	path = root + path;

	return {
		path: path,
		success: success,
		method: method
	};
}

var types = {
	html: "text/html",
	css	: "text/css",
	js	: "text/javascript",
	jpg	: "image/jpeg",
	jpeg: "image/jpeg",
	png	: "image/png",
	gif	: "image/gif",
	swf	: "application/x-shockwave-flash"
}

var fs = require("fs");
function handler(header, c) {
	var data = {};

	var path = header.path;

	if (path.indexOf("../") > -1) {
		data.code = 403;
		data.path = null;
		response(data, c);
		return;
	}

	if (header.method != "GET" && 
		header.method != "HEAD") {
		data.code = 405;
		data.path = null;
		response(data, c);
		return;
	}
 
	fs.exists(path, function(exists) {
		if (exists) {
			fs.lstat(path, function(err, stats) {
				if (stats.isDirectory()) {
					path += "/index.html";
				}
				fs.lstat(path, function(err, stats) {
					if (err) {
						data.code = 403;
						data.path = null;
						response(data, c);	
					} else {
						data.length = stats.size;
						data.path = path;
						data.type = types[path.slice(path.lastIndexOf(".") + 1).toLowerCase()] || 'text/plain';
						data.code = 200;
						response(data, c);
					}
				});
			})
		} else {
			data.code = 404;
			data.path = null;
			response(data, c);
		}
	})
}

var errors = {
	200 : "200 OK", 
	400 : "400 Bad Request",
	403 : "403 Forbidden",
	404 : "404 Not found",
	405 : "405 Method Not Allowed",
	500 : "500 Internal Server Error"
}

function response(data, c) {
	var head = "HTTP/1.1 " +
            (errors[data.code] || errors[500]) + "\r\n" +
            "Date: " + (new Date()).toUTCString() + "\r\n" +
            "Server: tralala\r\n";
    if (data.path) 
		head += "Content-Length: " + data.length + "\r\n" +
            "Content-Type: " + data.type + "\r\n" +
            "Connection: close\r\n\r\n";
	c.write(head);

	//console.log(head);

	if (data.path && header.method == 'GET')  {
		read(c, data);
	} else {
		c.end();
	}
}

function read(c, data) {
	var fileReadStream = fs.createReadStream(data.path);

	fileReadStream.pipe(c);

	fileReadStream.on('end', function() {
		c.end();
	})
}

exports.readHeader = readHeader;
exports.handler = handler;