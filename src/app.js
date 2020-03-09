var express = require('express');
var mysql = require('./dbcon.js');
var morgan = require('morgan');
var app = express();
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.use('/', express.static('public'));
app.set('mysql', mysql);
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2] || process.env.WEATHER_PORT || 3340);

//Render the home page
app.get('/', function (req, res, next) {
    res.render('index');
});

//Page rendering
app.use('/weather', require('./weather.js'));

//Not found error page rendering
app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

//listen on specified port
app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
