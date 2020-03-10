const EXAMPLE_QUERIES = [
    { query: "SELECT VVW.virus, GTM.mean, VVW.Year, (SUM(VVW.`0-4yr`) + SUM(VVW.`5-24yr`) + SUM(VVW.`25-64yr`) + SUM(VVW.`65+yr`)) AS total FROM VirusViewByWeek VVW, GlobalTempMean GTM WHERE GTM.Date LIKE CONCAT('%', VVW.year, '%') GROUP BY year, VVW.virus", name: "Total Deaths and Global Temperature Mean" },
    { query: "SELECT USB.NAME AS 'State', USB.DEATHS2019 AS '2019 Reported State Deaths', SUM(AQP.Moderate_Days)+SUM(AQP.`Unhealthy for Sensitive Groups Days`)+SUM(AQP.Unhealthy_Days)+SUM(AQP.`Very Unhealthy Days`)+SUM(AQP.Hazardous_Days) AS 'Poor Air Quality Days' FROM AirQualityAndParticles AQP, USBureauPopulationData USB WHERE AQP.State = USB.NAME AND AQP.Year = 2019 GROUP BY AQP.State", name: "State Deaths related to Air Quality" },
    { query: "SELECT A.State, A.Days_with_AQI, A.Good_Days,A.Moderate_Days, A.Unhealthy_Days, A.`Very Unhealthy Days`, A.Hazardous_Days, A.Median_AQI, S.Coal, S.`Natural Gas`, S.`Crude Oil`, S.`Nuclear Electric Power`, S.Biofuels, S.Other, S.Total FROM AirQualityAndParticles A, StateEnergyUse S WHERE A.State = S.State GROUP BY A.State ORDER BY S.COAL AND A.Good_Days", name: "State Energy Use related to Air Quality" },
    { query: "SELECT * FROM StormEvents2019 LIMIT 10", name: "10 Storm Events, 2019" },
    // { query: "SELECT * FROM StormEvents2019 LIMIT 20 OFFSET 10", name: "20 Storm Events, 2019" },
    // { query: "SELECT * FROM AbrahamLincolnNationalPark LIMIT 300 OFFSET 1000", name: "300 Records, Abe Lincoln Nat Park" },
    // { query: "SELECT * FROM TrafficEvents LIMIT 300", name: "300 Records, Traffic Events" },
    // { query: "SELECT * FROM `StateEnergyUse", name: "All Records, State Energy Use" },
]


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
        var context = {
            exampleQueries: EXAMPLE_QUERIES
        };
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
