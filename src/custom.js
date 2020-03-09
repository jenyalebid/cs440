//start the server with express
module.exports = function () {
    var express = require('express');
    var router = express.Router();

    //Allow for multiple functions
    var async = require('async');



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
            };
            complete();
        });
    }

    //Render the page with the loaded tables
    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.query = req.query.query || "";
        var mysql = req.app.get('mysql');
        const query = req.query.query;
        if (!query) {
            res.render('custom', context);
            return;
        }
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('custom', context);
            };
        };
        customQuery(req, res, mysql, context, req.query.query, complete);
    });

    return router;
}()
