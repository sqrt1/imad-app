var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret:'SomeRandomSecretValue',
    cookie:{maxAge : 1000*60*60*24*30}
}));

var config = {
    user : 'anshumanupadhyay1',
    database : 'anshumanupadhyay1',
    host : 'db.imad.hasura-app.io',
    port : '5432',
    password : process.env.DB_PASSWORD
};
 var articles = {
  'article-one' : {
     title:'Articel One | Anshuman Upadhyay',
     heading:'Article One',
     date:'Sep 5, 2016',
     content:`
     <p>
     This is my first article
     </p>`
 },
  'article-two' : {
     title:'Articel Two | Anshuman Upadhyay',
     heading:'Article Two',
     date:'Sep 5, 2016',
     content:`
     <p>
     This is my second article
     </p>`
 },
  'article-three' : {
     title:'Articel Three | Anshuman Upadhyay',
     heading:'Article Three',
     date:'Sep 5, 2016',
     content:`
     <p>
     This is my thirs article
     </p>`
 }
 };
function createTemplate(data){
    var title = data.title;
    var heading = data.heading;
    var date = data.date;
    var content = data.content;
     var htmlTemplate = `
     <html>
        <head>
            <title>
                ${title}
            </title>
            <meta name ="viewport" content ="width =device-width, initial-scale=1"/>
            <link href = "/ui/style.css" rel="stylesheet" />
        </head>
        <body>
            <div class="container">
                <div>
                  <a href = "/">Home</a>
                </div>
                <hr/>
                <h3>
                   ${heading}
                </h3>
                <div>
                    ${date}
                </div>
                <div>
                  ${content}
                </div>
            </div>
        </body>
    </html>
         
     `;
     return htmlTemplate;
 }
 var pool = new Pool(config);
 app.get('/test-db', function(req, res){
    pool.query('SELECT * from article', function(err, result){
       if(err){
           res.status(500).send(err.toString());
       }else{
           res.send(JSON.stringify(result));
       } 
    });
     
 });
 
 app.post('/create-user', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    var salt = crypto.randomBytes(128).toString('hex');
    var hashedDbPassword = hash(password, salt); 
    pool.query('INSERT INTO "user" (username, password) VALUES ($1, $2)', [username, hashedDbPassword], function(err, result){
       if(err){
           res.status(500).send(err.toString());
       } else{
           res.send('User successfully created '+ username);
           }
    });
    
 });
 
 app.post('/login', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    pool.query('SELECT * FROM "user" WHERE username = $1', [username], function(err, result){
       if(err){
           res.status(500).send(err.toString());
           
       } else{
           if(result.rows.length === 0){
            res.status(403).send('Username/password is invalid');   
           }
           else{
               var dbPassword = result.rows[0].password;
               var salt = dbPassword.split('$')[2];
               var hashPassword = hash(password, salt);
               if(dbPassword === hashPassword){
               req.session.auth = {userId: result.rows[0].id};
               res.send('Correct credentials');
               }
               else{
                   res.status(403).send('Username/Password is invalid');
               }
           }
       }
 });
 });
 app.get('/check-login', function(req, res){
    if(req.session && req.session.auth && req.session.auth.userId){
        pool.query('SELECT * from "user" where id = $1',[req.session.auth.userId], function(err, result){
            if(err){
                res.status(500).send(err.toString());
            }else{
                 res.send('You are logged in as ' +result.rows[0].username); 
                }
        });
    }else{
        res.status(400).send('You are not logged in');
    } 
 });
 
 app.get('/logout', function(req, res){
     delete req.session.auth;
     res.send('<html><body>Logged out!<br/><br/><a href="/">Back to home</a></body></html>');
 });
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

var counter = 0;
app.get('/counter', function(req,res){
   counter = counter +1;
   res.send(counter.toString()); 
});
app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

app.get('/articles/:articleName', function (req, res){
    var articleName = req.params.articleName;
    pool.query("SELECT * FROM article where title = '"+articleName+"'", function(err, result){
       if(err){
           res.status(500).send(err.toString());
       }else {
           if(result.rows.length === 0){
               res.status(404).send('Article not found');
           }
           else{
               var articleData = result.rows[0];
               res.send(createTemplate(articles[articleName]));
           }
           
       }
       
    });
   
});
function hash(input, salt){
    var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
    return ["pdkdf2","10000",salt,hashed.toString('hex')].join('$');
}

app.get('/hash/:input', function(req, res){
   var hashString = hash(req.params.input, 'this-is-some-random-string');
   res.send(hashString);
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});
var names = [];
 app.get('/submit-name/:name', function(req, res){
     var name = req.params.name;
     names.push(name);
     res.send(JSON.stringfy(names));
 });

// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
