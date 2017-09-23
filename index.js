var phantom = require('phantom');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var sitepage = null;
var phInstance = null;
var times = 0;
//var contentBox = new Array;
var contentObj = { title:'a',source:'a',comment:'a',time:'a' };
var interval = 30000;
var databaseName = 'JRTT';
var DB_CONN_STR = 'mongodb://localhost:7707/' + databaseName;

mongoose.connect(DB_CONN_STR);
var Schema = mongoose.Schema;

var DataSchema = new Schema({          
    title  : { type:String },                    		
    source : { type:String },                        
    comment: { type:String },                      
	time :   { type:String }
});

var TourismData = mongoose.model('TourismData',DataSchema); 

//连接成功
mongoose.connection.on('connected', function () {    
    console.log('Mongoose connection open to ' + DB_CONN_STR);  
});    

//连接异常
mongoose.connection.on('error',function (err) {    
    console.log('Mongoose connection error: ' + err);  
});    
 
//连接断开
mongoose.connection.on('disconnected', function () {    
    console.log('Mongoose connection disconnected');  
}); 

function dbInsert(data,callback){
	var Data = new TourismData(data);
    Data.save(function (err, res) { 
        if (err)
		   console.log("Error:" + err);
        else{
            console.log("Res:" + res);
            callback();
        }
		   
	});
}

function dbUpdate(wherestr,updatestr){
    //var wherestr = {'username' : 'Tracy McGrady'};
    //var updatestr = {'userpwd': 'zzzz'};   
    TourismData.update(wherestr, updatestr, function(err, res){
        if (err)
            console.log("Error:" + err);
        else
            console.log("Res:" + res);
    });
}

function dbDelAll(){
	//    var wherestr = {'username' : 'Tracy McGrady'};   
	TourismData.remove(function(err, res){
		if (err)
			console.log("Error:" + err);
		else
		{
	 		console.log("dbDelRes:" + res);
			//io.emit('ClaerAllFile',res);
		} 				
	});
}

function dbCount(){
    var wherestr = {};    
    TourismData.count(wherestr, function(err, res){
        if (err)
            console.log("Error:" + err);
        else 
            console.log("dbCountRes:" + res);
    });
};

/*function dbGetByConditions(wherestr){
    //    var wherestr = {'date' : {'$gte':'2017-8-28 11:5:0', '$lte':'2017-8-28 11:7:0'}};
    var finddata = { 'title' : wherestr.title };   
    TourismData.find(finddata, function(err, res){
        if (err)
            console.log("Error:" + err);
        else{
            console.log("dbGetByConditionsCount:" + res.length);
            //io.emit('ReadFile',res);  
            if( res.length == 0 ){
                //console.log(contentObj);
                dbInsert(wherestr);
            }
        }
    })
};*/

function dbGetByConditions(wherestr,callback){
    var finddata = { 'title' : wherestr.title };
    TourismData.find(finddata, function(err, res){
        if (err)
            console.log("Error:" + err);
        else{
            //console.log("dbGetByConditionsCount:" + res.length);
            if( res.length == 0 ){
                //console.log(wherestr);
                callback(wherestr,dbCount);
            }
        }
    })
};

function dbUpdate(transData){
    var wherestr = {'username' : transData.title };
    var updatestr = {'userpwd': transData.comment };   
    TourismData.update(wherestr, updatestr, function(err, res){
        if (err)
            console.log("Error:" + err);
        else
            console.log(res);
    });
}

/*var fs = require('fs')
var Promise = require('bluebird')
//改造fs.readFile为Promise版本
var readFileAsync = function(path){
    //返回一个Promise对象，初始状态pending
    return new Promise(function(fulfill, reject){
        fs.readFile(path,  'utf8', function(err, content){
            //由pending状态进入rejected状态
            if(err)
                return reject(err)
            //由pending状态进入fulfilled状态
            return fulfill(content)
        })
    })
};*/

//dbDelAll();
dbCount();

/*var test = [];
for( var t=0;t<8;t++ ){
    var wherestr = new Object();  
    wherestr.title = t + ' title';
    wherestr.source = t + ' source';
    wherestr.comment = t + ' comment';
    wherestr.time = t + ' time';
    test[t] = { num:t, cons:wherestr};
    console.log(test[t].num + test[t].cons.title);
};

console.log('\r\n--------数据准备好了--------\r\n');
console.log(test);*/

function insert(j,buf){
    var p = new Promise(function(resolve,reject){
        var obj = new Object();
        obj.title = buf[j*5 + 1];
        obj.source = buf[j*5 + 2];
        obj.comment = buf[j*5 + 3];
        obj.time = buf[j*5 + 4];
        //console.log(obj.title);
        resolve(obj);
    });
    return p;
}

setInterval(function(){
    phantom.create()
    .then(instance => {
        phInstance = instance;
        return instance.createPage();
    })
    .then(page => {
    // use page      
        sitepage = page;
        console.log('open page!');
        return page.open('http://www.toutiao.com/ch/news_travel/'); //http://www.toutiao.com/ http://www.toutiao.com/ch/news_travel/
    })
    .then(status => {
        console.log(status);
        return sitepage.property('content');
    })
    .then(content => {
        $ = cheerio.load(content);
        var buf = [],len = 0;
        len = $('.feedBox .wcommonFeed li').length;
        console.log('总数：' + len);       
        $('.feedBox .wcommonFeed li').each(function(i, el) {
            buf.push(i);
            buf.push($(this).find('.title-box').text());
            buf.push($(this).find('.source').text());
            buf.push($(this).find('.comment').text());
            buf.push($(this).find('.y-left').find('span').text());
            console.log(buf[i*5] + buf[i*5+1]);
        });
    
        console.log('\r\n--------数据准备好了--------\r\n');
        for( var j=0; j<len;j++){
            insert(j,buf).then(function(data){
                dbGetByConditions(data,dbInsert);
            })
        }
        //console.log(buf);
        phInstance.exit();
    })
    .catch(error => {
        console.log(error);
        phInstance.exit();
    });
    console.log( '第' + ++times + '次');
},interval);


/*var http = require('http');
var req = http.request('http://www.baidu.com/', function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        //响应内容
        console.log(chunk)
    });
});
req.end(function () {
    console.log('连接关闭');
});*/