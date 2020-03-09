//start the server with express
module.exports = function () {
    var express = require('express');
    var router = express.Router();

    //Allow for multiple functions
    var async = require('async');


    //Get the weather table
    function getweather(mysql) {
        return function (callback) {
            mysql.pool.query("SELECT State, County, Year, Good_Days, Moderate_Days, Unhealthy_Days, Hazardous_Days, Max_AQI, Median_AQI, Days_CO, Days_Ozone, Days_SO2 FROM AirQualityAndParticles", function (err, tb1) {
                if (err) {
                    return callback(err, []);
                }
                return callback(null, tb1);
            });
        }
    }

    //Search trough the weather table based on given filters in handlebars
    function searchFunction(req, res, mysql, context, complete) {
        var query = "SELECT State, County, Year, Good_Days, Moderate_Days, Unhealthy_Days, Hazardous_Days, Max_AQI, Median_AQI, Days_CO, Days_Ozone, Days_SO2 FROM AirQualityAndParticles WHERE " + req.query.filter + " LIKE " + mysql.pool.escape(req.query.search + '%');
        customQuery(req, res, mysql, context, query, complete);
    };

    function customQuery(req, res, mysql, context, query, complete) {
        console.log(`Query: ${query}`);
        mysql.pool.query(query, function (err, results) {
            if (err) {
                res.write(JSON.stringify(err));
                res.end();
            }
            context.queryResult = results;
            console.log(results);
            context.columns = [];
            for (let column in results[0]) {
                context.columns.push(column)
                console.log(`Column: ${column}`);
            };
            complete();
        });
    }

    //Render the page with the loaded tables
    router.get('/', function (req, res) {
        var mysql = req.app.get('mysql');
        async.parallel({
            custom: getweather(mysql)
        }, function (err, results) {
            if (err) {
                console.log(err.message);
            }
            res.render('custom', results);
        });
    });

    //Render the search results based on selected criteria
    router.get('/customQuery', function (req, res) {
        var callbackCount = 0;
        var context = {};
        var mysql = req.app.get('mysql');
        customQuery(req, res, mysql, context, req.query.query, complete);

        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('custom', context);
            };
        };
    });

    //Update a row from weather table baed on id
    router.post('/update', function (req, res) {
        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = "UPDATE weather SET priority = ?, member_name = ?, note = ? WHERE id = ?";
        var inserts = [req.body.editPriority, req.body.editMember, req.body.editNote, req.body.updateID];
        sql = mysql.pool.query(sql, inserts, function (err, results) {
            if (err) {
                console.log(JSON.stringify(err))
                res.write(JSON.stringify(err));
                res.end();
            } else {
                res.redirect('/custom');
            }
        });
    });

    //Delete an entry from the table based on client id
    router.post('/delete', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM weather WHERE id = ?";
        var inserts = [req.body.deleteGID];
        sql = mysql.pool.query(sql, inserts, function (err, results) {
            if (err) {
                console.log(err)
                res.write(JSON.stringify(err));
                res.status(400);
                res.end();
            } else {
                res.redirect('/custom');
            }
        });
    });

    return router;
}()
